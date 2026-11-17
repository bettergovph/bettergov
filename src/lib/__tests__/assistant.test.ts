import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASSISTANT_ENDPOINT,
  ASSISTANT_STREAM_ENDPOINT,
  ASSISTANT_STORAGE_KEY,
  AssistantError,
  DEFAULT_CONFIRMATION_MESSAGE,
  askAssistant,
  clearConversation,
  isAllowedFrameSource,
  loadConversation,
  normalizePendingConfirmation,
  parseSse,
  sanitizeAssistantHtml,
  saveConversation,
  type SseEvent,
} from '../assistant';

const encoder = new TextEncoder();

const streamOf = (chunks: (string | Uint8Array)[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          typeof chunk === 'string' ? encoder.encode(chunk) : chunk
        );
      }
      controller.close();
    },
  });

const collect = async (stream: ReadableStream<Uint8Array>) => {
  const events: SseEvent[] = [];
  for await (const event of parseSse(stream)) events.push(event);
  return events;
};

const sseResponse = (text: string, status = 200) =>
  new Response(text, {
    status,
    headers: { 'content-type': 'text/event-stream; charset=utf-8' },
  });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const COMPLETE = {
  type: 'complete',
  session_id: 'sess-1',
  answer: '<div class="egov-ai-response"><p>Renew at any DFA office.</p></div>',
  pending_confirmation: null,
  response_kind: 'answer',
  finish_reason: 'stop',
};

const sampleStream = [
  'event: progress\ndata: {"type":"progress","label":"Understanding your request"}\n\n',
  'event: progress\ndata: {"type":"progress","label":"Checking verified answers"}\n\n',
  'event: chunk\ndata: {"type":"chunk","content":"Renew at "}\n\n',
  'event: chunk\ndata: {"type":"chunk","content":"any DFA office."}\n\n',
  `event: complete\ndata: ${JSON.stringify(COMPLETE)}\n\n`,
].join('');

describe('parseSse', () => {
  it('parses named events with single-line data', async () => {
    const events = await collect(
      streamOf([
        'event: progress\ndata: {"label":"x"}\n\nevent: chunk\ndata: {"content":"y"}\n\n',
      ])
    );
    expect(events).toEqual([
      { event: 'progress', data: '{"label":"x"}' },
      { event: 'chunk', data: '{"content":"y"}' },
    ]);
  });

  it('joins multi-line data, skips comments and accepts CRLF', async () => {
    const events = await collect(
      streamOf([
        ': keep-alive\r\nevent: complete\r\ndata: {"a":\r\ndata: 1}\r\n\r\n',
      ])
    );
    expect(events).toEqual([{ event: 'complete', data: '{"a":\n1}' }]);
  });

  it('reassembles an event split across chunks, even mid-character', async () => {
    const bytes = encoder.encode(
      'event: chunk\ndata: {"content":"Mabuhay ☀"}\n\n'
    );
    const cut = bytes.indexOf(0xe2); // first byte of the three-byte ☀
    const events = await collect(
      streamOf([
        bytes.slice(0, 7),
        bytes.slice(7, cut + 1),
        bytes.slice(cut + 1),
      ])
    );
    expect(events).toEqual([
      { event: 'chunk', data: '{"content":"Mabuhay ☀"}' },
    ]);
  });

  it('flushes trailing data that has no closing blank line', async () => {
    const events = await collect(streamOf(['data: tail']));
    expect(events).toEqual([{ event: 'message', data: 'tail' }]);
  });

  it('drops an event name that never received data', async () => {
    const events = await collect(streamOf(['event: ghost\n\ndata: real\n\n']));
    expect(events).toEqual([{ event: 'message', data: 'real' }]);
  });
});

describe('askAssistant', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('posts the question, session and confirmation to the stream endpoint', async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(sampleStream));
    await askAssistant({
      question: 'How do I renew my passport?',
      sessionId: 'sess-0',
      confirmation: { token: 't'.repeat(32), approved: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ASSISTANT_STREAM_ENDPOINT);
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Accept')).toBe('text/event-stream');
    expect(JSON.parse(String(init?.body))).toEqual({
      question: 'How do I renew my passport?',
      session_id: 'sess-0',
      confirmation: { token: 't'.repeat(32), approved: true },
    });
  });

  it('omits session_id and confirmation when absent', async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(sampleStream));
    await askAssistant({ question: 'q', sessionId: null });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      question: 'q',
    });
  });

  it('reports progress and chunks, then resolves with the complete answer', async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(sampleStream));
    const onProgress = vi.fn();
    const onChunk = vi.fn();

    const answer = await askAssistant({ question: 'q', onProgress, onChunk });

    expect(onProgress.mock.calls.map(([label]) => label)).toEqual([
      'Understanding your request',
      'Checking verified answers',
    ]);
    expect(onChunk.mock.calls.map(([text]) => text)).toEqual([
      'Renew at ',
      'any DFA office.',
    ]);
    expect(answer).toEqual({
      answerHtml: COMPLETE.answer,
      sessionId: 'sess-1',
      pendingConfirmation: null,
      responseKind: 'answer',
      finishReason: 'stop',
    });
  });

  it('falls back to the data.type field when the event line is missing', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(`data: ${JSON.stringify(COMPLETE)}\n\n`)
    );
    const answer = await askAssistant({ question: 'q' });
    expect(answer.sessionId).toBe('sess-1');
  });

  it('surfaces pending_confirmation with its token and message', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        `event: complete\ndata: ${JSON.stringify({
          ...COMPLETE,
          answer: '<p>Shall I file the report?</p>',
          pending_confirmation: {
            token: 'c'.repeat(32),
            message: 'This will submit a report.',
          },
        })}\n\n`
      )
    );
    const answer = await askAssistant({ question: 'q' });
    expect(answer.pendingConfirmation).toEqual({
      token: 'c'.repeat(32),
      message: 'This will submit a report.',
    });
  });

  it('throws the server message on an SSE error event', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        'event: progress\ndata: {"label":"x"}\n\nevent: error\ndata: {"message":"Engine overloaded"}\n\n'
      )
    );
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      name: 'AssistantError',
      kind: 'stream',
      message: 'Engine overloaded',
    });
  });

  it('throws when the stream ends without a complete event', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse('event: chunk\ndata: {"content":"partial"}\n\n')
    );
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      kind: 'stream',
      message: 'The assistant stopped before finishing its answer.',
    });
  });

  it('maps a non-2xx JSON body to an AssistantError carrying the status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: 'Too many requests', message: 'Slow down.' }, 429)
    );
    const error = await askAssistant({ question: 'q' }).catch(e => e);
    expect(error).toBeInstanceOf(AssistantError);
    expect(error).toMatchObject({
      kind: 'http',
      status: 429,
      message: 'Slow down.',
    });
  });

  it('uses a status-based fallback when the error body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('upstream exploded', { status: 503 })
    );
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      status: 503,
      message: 'The assistant is not available right now.',
    });
  });

  it('distinguishes network failures from user aborts', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      kind: 'network',
    });

    fetchMock.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      kind: 'aborted',
    });
  });

  it('accepts a plain JSON 2xx answer on the stream route', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(COMPLETE));
    const answer = await askAssistant({ question: 'q' });
    expect(answer.answerHtml).toBe(COMPLETE.answer);
  });

  it('calls the JSON endpoint in json mode', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(COMPLETE));
    const answer = await askAssistant({ question: 'q', mode: 'json' });
    expect(fetchMock.mock.calls[0][0]).toBe(ASSISTANT_ENDPOINT);
    expect(answer.sessionId).toBe('sess-1');
  });

  it('rejects an empty answer with no confirmation', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ answer: '', session_id: 's', pending_confirmation: null })
    );
    await expect(askAssistant({ question: 'q' })).rejects.toMatchObject({
      message: 'The assistant returned an empty answer.',
    });
  });
});

describe('normalizePendingConfirmation', () => {
  it('requires an object with a non-empty token', () => {
    expect(normalizePendingConfirmation(null)).toBeNull();
    expect(normalizePendingConfirmation('token')).toBeNull();
    expect(normalizePendingConfirmation({ token: '  ' })).toBeNull();
  });

  it('picks the first descriptive field, else a default message', () => {
    expect(
      normalizePendingConfirmation({ token: 'abc', prompt: 'Proceed?' })
    ).toEqual({ token: 'abc', message: 'Proceed?' });
    expect(normalizePendingConfirmation({ token: 'abc' })).toEqual({
      token: 'abc',
      message: DEFAULT_CONFIRMATION_MESSAGE,
    });
  });
});

describe('sanitizeAssistantHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(sanitizeAssistantHtml('')).toBe('');
    expect(sanitizeAssistantHtml(null)).toBe('');
  });

  it('keeps text, tables, images and links, hardening link and image attributes', () => {
    const html = sanitizeAssistantHtml(
      '<div class="egov-ai-response"><p>Fees:</p><table><tr><th>Type</th><td>₱950</td></tr></table>' +
        '<img src="https://example.gov.ph/map.png" alt="Map"><a href="https://passport.gov.ph">Book</a></div>'
    );
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Type</th>');
    expect(html).toContain('₱950');
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).toMatch(/<img[^>]*referrerpolicy="no-referrer"/);
    expect(html).toMatch(/<a[^>]*target="_blank"/);
    expect(html).toMatch(/<a[^>]*rel="noopener noreferrer"/);
    expect(html).toContain('class="egov-ai-response"');
  });

  it('strips scripts, handlers, inline styles and javascript: URLs but keeps the text', () => {
    const html = sanitizeAssistantHtml(
      '<p onclick="alert(1)" style="color:red">Hi<script>alert(1)</script></p>' +
        '<a href="javascript:alert(1)">bad</a><object data="x"></object>'
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('style=');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<object');
    expect(html).toContain('Hi');
    expect(html).toContain('bad');
  });

  it('keeps allow-listed map embeds in a sandbox and drops any other iframe', () => {
    const maps = sanitizeAssistantHtml(
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18"></iframe>'
    );
    expect(maps).toContain('<iframe');
    expect(maps).toContain('sandbox="allow-scripts allow-same-origin"');
    expect(maps).toContain('loading="lazy"');

    const osm = sanitizeAssistantHtml(
      '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=1"></iframe>'
    );
    expect(osm).toContain('<iframe');

    expect(
      sanitizeAssistantHtml('<iframe src="https://evil.example/x"></iframe>')
    ).not.toContain('<iframe');
    expect(
      sanitizeAssistantHtml('<iframe srcdoc="<script>1</script>"></iframe>')
    ).not.toContain('<iframe');
  });
});

describe('isAllowedFrameSource', () => {
  it('allows only https Google Maps and OpenStreetMap embeds', () => {
    expect(isAllowedFrameSource('https://www.google.com/maps/embed?pb=1')).toBe(
      true
    );
    expect(isAllowedFrameSource('https://www.google.com.ph/maps/place/x')).toBe(
      true
    );
    expect(isAllowedFrameSource('https://maps.google.com/?q=manila')).toBe(
      true
    );
    expect(
      isAllowedFrameSource('https://www.openstreetmap.org/export/embed.html')
    ).toBe(true);
    expect(isAllowedFrameSource('http://www.google.com/maps/embed')).toBe(
      false
    );
    expect(isAllowedFrameSource('https://www.google.com/search?q=x')).toBe(
      false
    );
    expect(isAllowedFrameSource('https://google.com.evil.example/maps')).toBe(
      false
    );
    expect(isAllowedFrameSource('not a url')).toBe(false);
  });
});

describe('conversation storage', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('round-trips a conversation and caps its length', () => {
    const messages = Array.from({ length: 45 }, (_, i) => ({
      id: `m${i}`,
      role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant',
      text: `t${i}`,
    }));
    saveConversation({ sessionId: 'sess-9', messages });

    const loaded = loadConversation();
    expect(loaded?.sessionId).toBe('sess-9');
    expect(loaded?.messages).toHaveLength(40);
    expect(loaded?.messages[0].id).toBe('m5');
  });

  it('removes the entry when there is nothing to keep, and ignores corrupt data', () => {
    saveConversation({ sessionId: 's', messages: [] });
    expect(window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY)).not.toBeNull();

    saveConversation({ sessionId: null, messages: [] });
    expect(window.sessionStorage.getItem(ASSISTANT_STORAGE_KEY)).toBeNull();

    window.sessionStorage.setItem(ASSISTANT_STORAGE_KEY, '{not json');
    expect(loadConversation()).toBeNull();

    window.sessionStorage.setItem(ASSISTANT_STORAGE_KEY, '{"messages":"no"}');
    expect(loadConversation()).toBeNull();

    window.sessionStorage.setItem(
      ASSISTANT_STORAGE_KEY,
      JSON.stringify({
        sessionId: 'x',
        messages: [{ id: 'a', role: 'user' }, { role: 'nope' }, 'junk'],
      })
    );
    expect(loadConversation()).toEqual({
      sessionId: 'x',
      messages: [{ id: 'a', role: 'user' }],
    });

    clearConversation();
    expect(loadConversation()).toBeNull();
  });
});
