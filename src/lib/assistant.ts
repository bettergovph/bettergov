import DOMPurify from 'dompurify';

/**
 * Browser client for the Civic Assistant.
 *
 * Talks only to this site's own Worker (`/api/assistant` and
 * `/api/assistant/stream`, see functions/api/assistant.ts), which holds the
 * eGovAI credentials. Nothing here knows the upstream key or secret.
 *
 * The streamed protocol, as emitted by eGovAI and piped through unchanged:
 *   event: progress  → { label }            temporary status line
 *   event: chunk     → { content }          temporary partial text
 *   event: complete  → { answer, session_id, pending_confirmation, … }
 *   event: error     → { message | error }
 * `complete.answer` is the single authoritative HTML answer and replaces
 * anything shown from `chunk` events.
 */

export const ASSISTANT_ENDPOINT = '/api/assistant';
export const ASSISTANT_STREAM_ENDPOINT = '/api/assistant/stream';

export interface AssistantConfirmation {
  token: string;
  approved: true;
}

export interface PendingConfirmation {
  token: string;
  message: string;
}

export interface AssistantAnswer {
  /** Raw HTML from the engine. Run through sanitizeAssistantHtml before rendering. */
  answerHtml: string;
  sessionId: string | null;
  pendingConfirmation: PendingConfirmation | null;
  responseKind: string | null;
  finishReason: string | null;
}

export type AssistantErrorKind = 'http' | 'network' | 'stream' | 'aborted';

export class AssistantError extends Error {
  readonly kind: AssistantErrorKind;
  readonly status?: number;

  constructor(message: string, kind: AssistantErrorKind, status?: number) {
    super(message);
    this.name = 'AssistantError';
    this.kind = kind;
    this.status = status;
  }
}

export interface AskAssistantOptions {
  question: string;
  sessionId?: string | null;
  confirmation?: AssistantConfirmation;
  /** `stream` (default) uses Server-Sent Events; `json` waits for one answer. */
  mode?: 'stream' | 'json';
  onProgress?: (label: string) => void;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

export interface SseEvent {
  event: string;
  data: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

// Checked by name, not `instanceof Error`: a DOMException raised in another
// realm (jsdom, iframes) is still an abort.
const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: unknown }).name === 'AbortError';

export const DEFAULT_CONFIRMATION_MESSAGE =
  'The assistant needs your approval before it continues.';

/**
 * Parse a `text/event-stream` body into events. Handles `data:` spread over
 * several lines, CRLF line endings, comment lines, and events split across
 * network chunks. Cancels the underlying reader if the consumer stops early.
 */
export async function* parseSse(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = '';
  let dataLines: string[] = [];

  const flush = (): SseEvent | null => {
    if (dataLines.length === 0) {
      eventName = '';
      return null;
    }
    const event = {
      event: eventName || 'message',
      data: dataLines.join('\n'),
    };
    eventName = '';
    dataLines = [];
    return event;
  };

  const consumeLine = (rawLine: string): SseEvent | null => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line === '') return flush();
    if (line.startsWith(':')) return null;

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? '' : line.slice(separator + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventName = value;
    else if (field === 'data') dataLines.push(value);
    return null;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let newline: number;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const event = consumeLine(line);
        if (event) yield event;
      }

      if (done) break;
    }

    if (buffer) {
      const event = consumeLine(buffer);
      if (event) yield event;
    }
    const trailing = flush();
    if (trailing) yield trailing;
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** Accept whatever `pending_confirmation` shape the engine sends, as long as it carries a token. */
export function normalizePendingConfirmation(
  raw: unknown
): PendingConfirmation | null {
  if (!isRecord(raw)) return null;
  const token = typeof raw.token === 'string' ? raw.token.trim() : '';
  if (!token) return null;

  const message = [
    'message',
    'prompt',
    'description',
    'text',
    'label',
    'question',
    'summary',
  ]
    .map(key => raw[key])
    .find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    );

  return { token, message: message?.trim() ?? DEFAULT_CONFIRMATION_MESSAGE };
}

function answerFromPayload(payload: unknown): AssistantAnswer {
  if (!isRecord(payload)) {
    throw new AssistantError(
      'The assistant sent an answer this page could not read.',
      'stream'
    );
  }

  const answerHtml = typeof payload.answer === 'string' ? payload.answer : '';
  const pendingConfirmation = normalizePendingConfirmation(
    payload.pending_confirmation
  );

  if (!answerHtml && !pendingConfirmation) {
    throw new AssistantError(
      'The assistant returned an empty answer.',
      'stream'
    );
  }

  return {
    answerHtml,
    sessionId: stringOrNull(payload.session_id),
    pendingConfirmation,
    responseKind: stringOrNull(payload.response_kind),
    finishReason: stringOrNull(payload.finish_reason),
  };
}

function messageFromPayload(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  return stringOrNull(payload.message) ?? stringOrNull(payload.error);
}

async function errorFromResponse(response: Response): Promise<AssistantError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Not JSON — fall through to the status-based message.
  }

  const fallback =
    response.status === 429
      ? 'Too many questions in a row. Please wait a moment and try again.'
      : response.status === 503
        ? 'The assistant is not available right now.'
        : 'The assistant is temporarily unavailable.';

  return new AssistantError(
    messageFromPayload(payload) ?? fallback,
    'http',
    response.status
  );
}

async function consumeEventStream(
  stream: ReadableStream<Uint8Array>,
  options: Pick<AskAssistantOptions, 'onProgress' | 'onChunk' | 'signal'>
): Promise<AssistantAnswer> {
  try {
    for await (const { event, data } of parseSse(stream)) {
      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }

      const type =
        event !== 'message'
          ? event
          : isRecord(payload) && typeof payload.type === 'string'
            ? payload.type
            : 'message';

      switch (type) {
        case 'progress': {
          const label = isRecord(payload) ? stringOrNull(payload.label) : null;
          if (label) options.onProgress?.(label);
          break;
        }
        case 'chunk': {
          const content = isRecord(payload)
            ? stringOrNull(payload.content)
            : null;
          if (content) options.onChunk?.(content);
          break;
        }
        case 'complete':
          return answerFromPayload(payload);
        case 'error':
          throw new AssistantError(
            messageFromPayload(payload) ??
              'The assistant ran into a problem with this question.',
            'stream'
          );
        default:
          break;
      }
    }
  } catch (error) {
    if (error instanceof AssistantError) throw error;
    if (isAbortError(error) || options.signal?.aborted) {
      throw new AssistantError('Stopped.', 'aborted');
    }
    throw new AssistantError(
      'The connection to the assistant was interrupted.',
      'network'
    );
  }

  if (options.signal?.aborted) throw new AssistantError('Stopped.', 'aborted');
  throw new AssistantError(
    'The assistant stopped before finishing its answer.',
    'stream'
  );
}

/**
 * Ask the engine one question. Resolves with the final answer; progress and
 * partial text arrive through the callbacks while streaming.
 */
export async function askAssistant(
  options: AskAssistantOptions
): Promise<AssistantAnswer> {
  const {
    question,
    sessionId,
    confirmation,
    mode = 'stream',
    onProgress,
    onChunk,
    signal,
  } = options;

  const body: Record<string, unknown> = { question };
  if (sessionId) body.session_id = sessionId;
  if (confirmation) body.confirmation = confirmation;

  let response: Response;
  try {
    response = await fetch(
      mode === 'stream' ? ASSISTANT_STREAM_ENDPOINT : ASSISTANT_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: mode === 'stream' ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(body),
        signal,
      }
    );
  } catch (error) {
    if (isAbortError(error)) throw new AssistantError('Stopped.', 'aborted');
    throw new AssistantError(
      'Could not reach the assistant. Check your connection and try again.',
      'network'
    );
  }

  if (!response.ok) throw await errorFromResponse(response);

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream') && response.body) {
    return consumeEventStream(response.body, { onProgress, onChunk, signal });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AssistantError(
      'The assistant sent an answer this page could not read.',
      'stream'
    );
  }
  return answerFromPayload(payload);
}

// ---------------------------------------------------------------------------
// Rendering

const ALLOWED_TAGS = [
  'a',
  'abbr',
  'address',
  'article',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'iframe',
  'img',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'picture',
  'pre',
  's',
  'section',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
];

const ALLOWED_ATTR = [
  'alt',
  'class',
  'colspan',
  'datetime',
  'dir',
  'height',
  'href',
  'lang',
  'rowspan',
  'scope',
  'sizes',
  'src',
  'srcset',
  'start',
  'title',
  'type',
  'width',
];

/** Map embeds the engine may return. Anything else in an iframe is dropped. */
const ALLOWED_FRAME_SOURCES: { host: RegExp; path: RegExp }[] = [
  { host: /^(www\.)?google(\.[a-z]{2,3}){1,2}$/i, path: /^\/maps(\/|$)/ },
  { host: /^maps\.google(\.[a-z]{2,3}){1,2}$/i, path: /.*/ },
  { host: /^(www\.)?openstreetmap\.org$/i, path: /^\/export\/embed/ },
];

export function isAllowedFrameSource(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  return ALLOWED_FRAME_SOURCES.some(
    rule => rule.host.test(url.hostname) && rule.path.test(url.pathname)
  );
}

let purifier: ReturnType<typeof DOMPurify> | null = null;

/**
 * A dedicated DOMPurify instance so these hooks never leak into other
 * sanitisers on the site (news articles register their own).
 */
function getPurifier(): ReturnType<typeof DOMPurify> | null {
  if (purifier) return purifier;
  if (typeof window === 'undefined') return null;

  const instance = DOMPurify(window);

  instance.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return;
    const src = (node as Element).getAttribute?.('src') ?? '';
    if (!isAllowedFrameSource(src)) {
      node.parentNode?.removeChild(node);
    }
  });

  instance.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }
    if (node.tagName === 'IFRAME') {
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'no-referrer');
      node.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    }
  });

  purifier = instance;
  return instance;
}

/**
 * Sanitise an engine answer for `dangerouslySetInnerHTML`. Keeps text,
 * tables, images and allow-listed map embeds; strips scripts, handlers,
 * styles and everything else.
 */
export function sanitizeAssistantHtml(html: string | null | undefined): string {
  if (!html) return '';
  const instance = getPurifier();
  if (!instance) return '';

  return instance.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel', 'loading', 'referrerpolicy', 'sandbox'],
    ADD_DATA_URI_TAGS: ['img'],
    KEEP_CONTENT: true,
  });
}

// ---------------------------------------------------------------------------
// Conversation persistence (sessionStorage — survives reloads, not tabs)

export const ASSISTANT_STORAGE_KEY = 'bettergov.assistant.v1';
const MAX_STORED_MESSAGES = 40;

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  /** User question, as typed. */
  text?: string;
  /** Sanitised assistant answer. */
  html?: string;
}

export interface StoredConversation {
  sessionId: string | null;
  messages: StoredMessage[];
}

const storage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

export function loadConversation(): StoredConversation | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(ASSISTANT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.messages)) return null;

    const messages = parsed.messages.filter(
      (message): message is StoredMessage =>
        isRecord(message) &&
        typeof message.id === 'string' &&
        (message.role === 'user' || message.role === 'assistant')
    );
    return { sessionId: stringOrNull(parsed.sessionId), messages };
  } catch {
    return null;
  }
}

export function saveConversation(conversation: StoredConversation): void {
  const store = storage();
  if (!store) return;
  try {
    const messages = conversation.messages.slice(-MAX_STORED_MESSAGES);
    if (messages.length === 0 && !conversation.sessionId) {
      store.removeItem(ASSISTANT_STORAGE_KEY);
      return;
    }
    store.setItem(
      ASSISTANT_STORAGE_KEY,
      JSON.stringify({ sessionId: conversation.sessionId, messages })
    );
  } catch {
    // Quota or privacy mode — the conversation simply won't survive a reload.
  }
}

export function clearConversation(): void {
  storage()?.removeItem(ASSISTANT_STORAGE_KEY);
}
