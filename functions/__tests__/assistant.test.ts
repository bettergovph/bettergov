import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Env } from '../types';
import {
  DEFAULT_ENGINE_CODE,
  MAX_QUESTION_LENGTH,
  UPSTREAM_USER_AGENT,
  extractUpstreamMessage,
  mapUpstreamError,
  onRequest,
  onRequestStream,
  parseAssistantRequest,
  readEgovAiConfig,
  resolveEgovAiBaseUrl,
} from '../api/assistant';

const ctx = {} as ExecutionContext;

const configuredEnv = {
  EGOVAI_BASE_URL: 'https://egov.example.test',
  EGOVAI_API_KEY: 'key-123',
  EGOVAI_API_SECRET: 'secret-456',
} as Env;

const post = (
  body: unknown,
  init: { contentType?: string | null; method?: string } = {}
) => {
  const headers = new Headers();
  if (init.contentType !== null) {
    headers.set('content-type', init.contentType ?? 'application/json');
  }
  const method = init.method ?? 'POST';
  return new Request('https://api.gov.ph/api/assistant', {
    method,
    headers,
    body:
      method === 'GET'
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

describe('resolveEgovAiBaseUrl', () => {
  it('returns the origin unchanged, without a trailing slash', () => {
    expect(resolveEgovAiBaseUrl('https://egov.example.test')).toBe(
      'https://egov.example.test'
    );
    expect(resolveEgovAiBaseUrl('https://egov.example.test/')).toBe(
      'https://egov.example.test'
    );
  });

  it('tolerates a full endpoint URL pasted as the base URL', () => {
    expect(
      resolveEgovAiBaseUrl(
        'https://egov.example.test/api/v1/engines/generate_stream'
      )
    ).toBe('https://egov.example.test');
    expect(
      resolveEgovAiBaseUrl('https://egov.example.test/api/v1/engines/generate')
    ).toBe('https://egov.example.test');
  });

  it('keeps a genuine path prefix', () => {
    expect(
      resolveEgovAiBaseUrl(
        'https://egov.example.test/egov/api/v1/engines/generate'
      )
    ).toBe('https://egov.example.test/egov');
  });

  it('rejects empty, malformed and non-http values', () => {
    expect(resolveEgovAiBaseUrl(undefined)).toBeNull();
    expect(resolveEgovAiBaseUrl('   ')).toBeNull();
    expect(resolveEgovAiBaseUrl('not a url')).toBeNull();
    expect(resolveEgovAiBaseUrl('ftp://egov.example.test')).toBeNull();
  });
});

describe('readEgovAiConfig', () => {
  it('requires base URL, key and secret', () => {
    expect(readEgovAiConfig({} as Env)).toBeNull();
    expect(
      readEgovAiConfig({ ...configuredEnv, EGOVAI_API_SECRET: ' ' } as Env)
    ).toBeNull();
  });

  it('defaults the engine code to govph and honours an override', () => {
    expect(readEgovAiConfig(configuredEnv)?.engineCode).toBe(
      DEFAULT_ENGINE_CODE
    );
    expect(
      readEgovAiConfig({
        ...configuredEnv,
        EGOVAI_AGENT_ENGINE_CODE: 'other',
      } as Env)?.engineCode
    ).toBe('other');
  });
});

describe('parseAssistantRequest', () => {
  it('accepts a bare question and trims it', () => {
    expect(parseAssistantRequest({ question: '  hello  ' })).toEqual({
      ok: true,
      value: { question: 'hello' },
    });
  });

  it('rejects a missing, blank or oversized question', () => {
    expect(parseAssistantRequest({}).ok).toBe(false);
    expect(parseAssistantRequest({ question: '   ' }).ok).toBe(false);
    expect(parseAssistantRequest('question').ok).toBe(false);
    expect(
      parseAssistantRequest({ question: 'x'.repeat(MAX_QUESTION_LENGTH + 1) })
        .ok
    ).toBe(false);
  });

  it('passes session_id through and drops null / empty values', () => {
    expect(parseAssistantRequest({ question: 'q', session_id: 'abc' })).toEqual(
      { ok: true, value: { question: 'q', session_id: 'abc' } }
    );
    expect(parseAssistantRequest({ question: 'q', session_id: null })).toEqual({
      ok: true,
      value: { question: 'q' },
    });
    expect(parseAssistantRequest({ question: 'q', session_id: '' })).toEqual({
      ok: true,
      value: { question: 'q' },
    });
    expect(parseAssistantRequest({ question: 'q', session_id: 42 }).ok).toBe(
      false
    );
  });

  it('only accepts an approved confirmation with a token', () => {
    expect(
      parseAssistantRequest({
        question: 'q',
        confirmation: { token: 't'.repeat(32), approved: true, extra: 1 },
      })
    ).toEqual({
      ok: true,
      value: {
        question: 'q',
        confirmation: { token: 't'.repeat(32), approved: true },
      },
    });
    expect(
      parseAssistantRequest({
        question: 'q',
        confirmation: { token: 'abc', approved: false },
      }).ok
    ).toBe(false);
    expect(
      parseAssistantRequest({ question: 'q', confirmation: { approved: true } })
        .ok
    ).toBe(false);
  });
});

describe('extractUpstreamMessage / mapUpstreamError', () => {
  it('reads the three upstream error shapes and never the stack', () => {
    expect(
      extractUpstreamMessage({ code: 400, message: 'Unknown API Key.' })
    ).toBe('Unknown API Key.');
    expect(
      extractUpstreamMessage({
        errors: [{ rule: 'required', field: 'question', message: 'Required' }],
      })
    ).toBe('Required');
    expect(
      extractUpstreamMessage({
        code: 422,
        message: 'Agent request validation failed',
        details: {
          issues: [{ path: 'confirmation.token', message: 'Too small' }],
        },
      })
    ).toBe('confirmation.token: Too small');
    expect(extractUpstreamMessage({ stack: 'Error at ...' })).toBeNull();
    expect(extractUpstreamMessage('plain text')).toBeNull();
  });

  it('passes 422 and 429 through, and hides everything else behind a 502', () => {
    expect(mapUpstreamError(422, { message: 'bad token' })).toMatchObject({
      status: 422,
      message: 'bad token',
    });
    expect(mapUpstreamError(429, null)).toMatchObject({ status: 429 });
    expect(
      mapUpstreamError(400, { message: 'Unknown API Key.' })
    ).toMatchObject({ status: 502 });
    expect(
      mapUpstreamError(400, { message: 'Unknown API Key.' }).message
    ).not.toContain('API Key');
    expect(mapUpstreamError(500, { message: 'Internal' })).toMatchObject({
      status: 502,
    });
  });
});

describe('onRequest (JSON) and onRequestStream (SSE)', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects non-POST, non-JSON and malformed requests before any upstream call', async () => {
    const get = await onRequest({
      request: post({ question: 'q' }, { method: 'GET' }),
      env: configuredEnv,
      ctx,
    });
    expect(get.status).toBe(405);

    const text = await onRequest({
      request: post({ question: 'q' }, { contentType: 'text/plain' }),
      env: configuredEnv,
      ctx,
    });
    expect(text.status).toBe(415);

    const broken = await onRequest({
      request: post('{not json'),
      env: configuredEnv,
      ctx,
    });
    expect(broken.status).toBe(400);

    const empty = await onRequest({
      request: post({ question: '' }),
      env: configuredEnv,
      ctx,
    });
    expect(empty.status).toBe(400);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 503 when the eGovAI credentials are not configured', async () => {
    const response = await onRequest({
      request: post({ question: 'q' }),
      env: {} as Env,
      ctx,
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Assistant not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the question, session and confirmation to the JSON endpoint with the credential headers', async () => {
    const answer = {
      answer: '<p>Hi</p>',
      session_id: 'sess-1',
      pending_confirmation: null,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(answer));

    const response = await onRequest({
      request: post({
        question: 'How do I renew my passport?',
        session_id: 'sess-0',
        confirmation: { token: 't'.repeat(32), approved: true },
      }),
      env: { ...configuredEnv, EGOVAI_AGENT_ENGINE_CODE: 'govph' } as Env,
      ctx,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    await expect(response.json()).resolves.toEqual(answer);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://egov.example.test/api/v1/engines/generate');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('X-EGOVAI-API-KEY')).toBe('key-123');
    expect(headers.get('X-EGOVAI-API-SECRET')).toBe('secret-456');
    expect(headers.get('X-EGOVAI-AGENT-ENGINE-CODE')).toBe('govph');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('User-Agent')).toBe(UPSTREAM_USER_AGENT);
    expect(JSON.parse(String(init?.body))).toEqual({
      question: 'How do I renew my passport?',
      session_id: 'sess-0',
      confirmation: { token: 't'.repeat(32), approved: true },
    });
  });

  it('strips the endpoint path from a pasted base URL before building the upstream URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ answer: '' }));
    await onRequest({
      request: post({ question: 'q' }),
      env: {
        ...configuredEnv,
        EGOVAI_BASE_URL:
          'https://egov.example.test/api/v1/engines/generate_stream',
      } as Env,
      ctx,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://egov.example.test/api/v1/engines/generate'
    );
  });

  it('pipes an upstream event stream through with SSE headers', async () => {
    const sse =
      'event: progress\ndata: {"label":"Thinking"}\n\nevent: complete\ndata: {"answer":"<p>ok</p>"}\n\n';
    fetchMock.mockResolvedValueOnce(
      new Response(sse, {
        status: 200,
        headers: { 'content-type': 'text/event-stream; charset=utf-8' },
      })
    );

    const response = await onRequestStream({
      request: post({ question: 'q' }),
      env: configuredEnv,
      ctx,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('cache-control')).toContain('no-cache');
    await expect(response.text()).resolves.toBe(sse);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://egov.example.test/api/v1/engines/generate_stream'
    );
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Accept')).toBe('text/event-stream');
  });

  it('hands a non-streaming 2xx answer on the stream route back as JSON', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ answer: '<p>ok</p>' }));
    const response = await onRequestStream({
      request: post({ question: 'q' }),
      env: configuredEnv,
      ctx,
    });
    expect(response.headers.get('content-type')).toBe('application/json');
    await expect(response.json()).resolves.toEqual({ answer: '<p>ok</p>' });
  });

  it('maps an upstream credential error to a generic 502 and never forwards the stack', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { message: 'Unknown API Key.', stack: 'GeneralException: at ...' },
        400
      )
    );
    const response = await onRequestStream({
      request: post({ question: 'q' }),
      env: configuredEnv,
      ctx,
    });
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain('stack');
    expect(text).not.toContain('API Key');
    expect(JSON.parse(text)).toMatchObject({ error: 'Assistant unavailable' });
  });

  it('passes an upstream 422 through with its message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          code: 422,
          message: 'Agent request validation failed',
          details: {
            issues: [{ path: 'confirmation.token', message: 'Too small' }],
          },
        },
        422
      )
    );
    const response = await onRequest({
      request: post({
        question: 'q',
        confirmation: { token: 'x', approved: true },
      }),
      env: configuredEnv,
      ctx,
    });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      message: 'confirmation.token: Too small',
    });
  });

  it('turns an upstream 500 or a network failure into a 502', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 500, message: 'Internal server error' }, 500)
    );
    const upstream500 = await onRequest({
      request: post({ question: 'q' }),
      env: configuredEnv,
      ctx,
    });
    expect(upstream500.status).toBe(502);

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const network = await onRequestStream({
      request: post({ question: 'q' }),
      env: configuredEnv,
      ctx,
    });
    expect(network.status).toBe(502);
    await expect(network.json()).resolves.toMatchObject({
      error: 'Assistant unavailable',
    });
  });
});
