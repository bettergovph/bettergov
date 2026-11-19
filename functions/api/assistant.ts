import { Env } from '../types';
import { readJsonRequest } from '../lib/request-body';
import {
  boundedEventStream,
  createDeadline,
  readBoundedText,
} from '../lib/bounded-io';

/**
 * Server-side proxy for the eGovAI "govph" engine.
 *
 * The browser never talks to eGovAI directly: the API key and secret live in
 * the Worker's environment and are attached here. Two routes share this
 * handler —
 *
 *   POST /api/assistant         → eGovAI /api/v1/engines/generate        (JSON)
 *   POST /api/assistant/stream  → eGovAI /api/v1/engines/generate_stream (SSE)
 *
 * Both accept the same body: `{ question, session_id?, confirmation? }`.
 * The SSE route pipes the upstream event stream through untouched; the JSON
 * route forwards the upstream answer object. Upstream failures are mapped to
 * a small `{ error, message }` body so the browser never sees upstream stack
 * traces or credential details.
 */

export const DEFAULT_ENGINE_CODE = 'govph';
export const MAX_QUESTION_LENGTH = 4000;
const MAX_SESSION_ID_LENGTH = 200;
const MAX_TOKEN_LENGTH = 1000;
const JSON_UPSTREAM_TIMEOUT_MS = 90_000;
export const STREAM_UPSTREAM_TIMEOUT_MS = 180_000;
export const STREAM_IDLE_TIMEOUT_MS = 60_000;
const MAX_UPSTREAM_JSON_BYTES = 2 * 1024 * 1024;
const MAX_UPSTREAM_STREAM_BYTES = 4 * 1024 * 1024;
// Workers' fetch sends no User-Agent by default and the eGovAI edge answers
// an empty one with a bare 403, so always identify ourselves.
export const UPSTREAM_USER_AGENT = 'GOVPH-Chatbot/1.0 (+https://www.gov.ph)';

export interface AssistantConfirmation {
  token: string;
  approved: true;
}

export interface AssistantRequestBody {
  question: string;
  session_id?: string | null;
  confirmation?: AssistantConfirmation;
}

export interface EgovAiConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  engineCode: string;
}

type ParseResult =
  | { ok: true; value: AssistantRequestBody }
  | { ok: false; error: string };

const json = (body: unknown, status = 200, extra?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extra ?? {}) },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Accept the eGovAI origin (`https://host`) or, tolerantly, a full endpoint
 * URL that was pasted as the "base URL" (`https://host/api/v1/engines/
 * generate_stream`). Returns the origin plus any non-endpoint path prefix,
 * without a trailing slash, or `null` when the value is unusable.
 */
export function resolveEgovAiBaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    return null;

  const path = url.pathname
    .replace(/\/api\/v1\/engines\/generate(?:_stream)?\/?$/, '')
    .replace(/\/+$/, '');
  return `${url.origin}${path}`;
}

export function readEgovAiConfig(env: Env): EgovAiConfig | null {
  const baseUrl = resolveEgovAiBaseUrl(env.EGOVAI_BASE_URL);
  const apiKey = env.EGOVAI_API_KEY?.trim();
  const apiSecret = env.EGOVAI_API_SECRET?.trim();
  if (!baseUrl || !apiKey || !apiSecret) return null;

  return {
    baseUrl,
    apiKey,
    apiSecret,
    engineCode: env.EGOVAI_AGENT_ENGINE_CODE?.trim() || DEFAULT_ENGINE_CODE,
  };
}

/** Validate the browser's body before anything reaches eGovAI. */
export function parseAssistantRequest(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const question =
    typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return { ok: false, error: 'Missing required field: question' };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `question must be at most ${MAX_QUESTION_LENGTH} characters`,
    };
  }

  const value: AssistantRequestBody = { question };

  if (body.session_id !== undefined && body.session_id !== null) {
    if (
      typeof body.session_id !== 'string' ||
      body.session_id.length > MAX_SESSION_ID_LENGTH
    ) {
      return { ok: false, error: 'session_id must be a short string' };
    }
    if (body.session_id) value.session_id = body.session_id;
  }

  if (body.confirmation !== undefined && body.confirmation !== null) {
    const confirmation = body.confirmation;
    if (
      !isRecord(confirmation) ||
      typeof confirmation.token !== 'string' ||
      !confirmation.token ||
      confirmation.token.length > MAX_TOKEN_LENGTH ||
      confirmation.approved !== true
    ) {
      return {
        ok: false,
        error: 'confirmation must be { token: string, approved: true }',
      };
    }
    value.confirmation = { token: confirmation.token, approved: true };
  }

  return { ok: true, value };
}

/**
 * Pull a human-readable message out of the shapes eGovAI has been seen to
 * return: `{ message }`, `{ errors: [{ message }] }` and
 * `{ details: { issues: [{ path, message }] } }`. Never returns `stack`.
 */
export function extractUpstreamMessage(body: unknown): string | null {
  if (!isRecord(body)) return null;

  if (isRecord(body.details) && Array.isArray(body.details.issues)) {
    const issues = body.details.issues
      .filter(isRecord)
      .map(issue =>
        typeof issue.message === 'string'
          ? `${typeof issue.path === 'string' ? `${issue.path}: ` : ''}${issue.message}`
          : null
      )
      .filter((text): text is string => Boolean(text));
    if (issues.length) return issues.join('; ');
  }

  if (Array.isArray(body.errors)) {
    const messages = body.errors
      .filter(isRecord)
      .map(error => error.message)
      .filter((text): text is string => typeof text === 'string' && !!text);
    if (messages.length) return messages.join('; ');
  }

  if (typeof body.message === 'string' && body.message) return body.message;
  if (typeof body.error === 'string' && body.error) return body.error;
  return null;
}

const UNAVAILABLE = 'The assistant is temporarily unavailable.';

/**
 * Map an upstream failure to what the browser should see. Validation and
 * rate-limit responses pass through with their message; anything that points
 * at our own configuration (bad key, unknown engine, wrong base URL) or an
 * upstream outage becomes a generic 502; logs record status without bodies.
 */
export function mapUpstreamError(
  status: number,
  body: unknown
): { status: number; error: string; message: string } {
  const detail = extractUpstreamMessage(body);

  if (status === 422) {
    return {
      status: 422,
      error: 'The assistant rejected the request',
      message: detail ?? 'The request could not be processed.',
    };
  }
  if (status === 429) {
    return {
      status: 429,
      error: 'Too many requests',
      message: detail ?? 'Please wait a moment and try again.',
    };
  }
  return { status: 502, error: 'Assistant unavailable', message: UNAVAILABLE };
}

async function readUpstreamBody(
  response: Response,
  signal: AbortSignal,
  maxBytes = MAX_UPSTREAM_JSON_BYTES
): Promise<unknown> {
  const text = await readBoundedText(response.body, maxBytes, signal);
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function handle(
  context: { request: Request; env: Env; ctx: ExecutionContext },
  mode: 'json' | 'stream'
): Promise<Response> {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405, {
      Allow: 'POST, OPTIONS',
    });
  }

  const input = await readJsonRequest(request);
  if (!input.ok) return input.response;
  const parsed = parseAssistantRequest(input.value);
  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }

  const config = readEgovAiConfig(env);
  if (!config) {
    console.error(
      '[assistant] EGOVAI_BASE_URL, EGOVAI_API_KEY and EGOVAI_API_SECRET must all be set'
    );
    return json(
      {
        error: 'Assistant not configured',
        message: 'The assistant is not available right now.',
      },
      503
    );
  }

  const endpoint = mode === 'stream' ? 'generate_stream' : 'generate';
  const upstreamUrl = `${config.baseUrl}/api/v1/engines/${endpoint}`;

  const deadline = createDeadline(
    request.signal,
    mode === 'json' ? JSON_UPSTREAM_TIMEOUT_MS : STREAM_UPSTREAM_TIMEOUT_MS
  );
  let streaming = false;
  try {
    if (deadline.signal.aborted) throw new Error('Request interrupted');
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'X-EGOVAI-API-KEY': config.apiKey,
        'X-EGOVAI-API-SECRET': config.apiSecret,
        'X-EGOVAI-AGENT-ENGINE-CODE': config.engineCode,
        'Content-Type': 'application/json',
        Accept: mode === 'stream' ? 'text/event-stream' : 'application/json',
        'User-Agent': UPSTREAM_USER_AGENT,
      },
      body: JSON.stringify(parsed.value),
      redirect: 'manual',
      signal: deadline.signal,
    });

    if (!upstream.ok) {
      // Do not follow redirects, log provider bodies, or expose arbitrary errors.
      console.error(
        `[assistant] upstream ${endpoint} responded ${upstream.status}`
      );
      let body: unknown = null;
      if (upstream.status === 422 || upstream.status === 429) {
        body = await readUpstreamBody(upstream, deadline.signal, 64 * 1024);
      } else {
        void upstream.body?.cancel().catch(() => {});
      }
      const mapped = mapUpstreamError(upstream.status, body);
      return json(
        { error: mapped.error, message: mapped.message },
        mapped.status,
        mapped.status === 429
          ? { 'Retry-After': upstream.headers.get('Retry-After') || '60' }
          : undefined
      );
    }

    const upstreamType = upstream.headers
      .get('content-type')
      ?.split(';')[0]
      .trim()
      .toLowerCase();
    if (
      mode === 'stream' &&
      upstreamType === 'text/event-stream' &&
      upstream.body
    ) {
      const body = boundedEventStream(
        upstream.body,
        deadline,
        MAX_UPSTREAM_STREAM_BYTES,
        STREAM_IDLE_TIMEOUT_MS
      );
      streaming = true;
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    if (upstreamType !== 'application/json') {
      void upstream.body?.cancel().catch(() => {});
      throw new Error('Invalid upstream response');
    }
    // Also supports an engine that returns JSON on the streaming endpoint.
    const body = await readUpstreamBody(upstream, deadline.signal);
    if (!isRecord(body)) throw new Error('Invalid upstream response');
    return json(body);
  } catch {
    deadline.abort();
    console.error(`[assistant] upstream ${endpoint} request failed`);
    return json({ error: 'Assistant unavailable', message: UNAVAILABLE }, 502);
  } finally {
    // For SSE the stream owns cleanup until EOF, cancellation, or a limit.
    if (!streaming) deadline.dispose();
  }
}

/** `POST /api/assistant` — single JSON answer. */
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  return handle(context, 'json');
}

/** `POST /api/assistant/stream` — Server-Sent Events passthrough. */
export async function onRequestStream(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  return handle(context, 'stream');
}
