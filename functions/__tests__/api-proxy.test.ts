// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';

const limiter = { limit: async () => ({ success: true }) };
const env = {
  API_RATE_LIMITER: limiter,
  ASSISTANT_RATE_LIMITER: limiter,
  CRAWL_RATE_LIMITER: limiter,
  REPORT_RATE_LIMITER: limiter,
  MEILISEARCH_SEARCH_API_KEY: 'server-search-key',
} as unknown as Env;
const fetchMock = vi.fn<typeof fetch>();
const ctx = {} as ExecutionContext;
const json = (data: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
const call = (
  path: string,
  body?: unknown,
  init: RequestInit = {},
  withEnv = env
) =>
  worker.fetch(
    new Request(`https://www.gov.ph${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      ...init,
      headers: {
        Origin: 'https://www.gov.ph',
        'CF-Connecting-IP': '192.0.2.1',
        'Content-Type': 'application/json',
        ...init.headers,
      },
      body:
        body === undefined
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
    }),
    withEnv,
    ctx
  );

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('Meilisearch proxy', () => {
  const batch = {
    queries: [{ indexUid: 'bettergov', q: 'passport', limit: 10 }],
  };

  it.each(['/api/search', '/api/search/', '/api/search/multi-search'])(
    'supports %s with only the server credential',
    async path => {
      const data = { results: [{ indexUid: 'bettergov', hits: [] }] };
      fetchMock.mockResolvedValue(json(data));
      const response = await call(path, batch, {
        headers: {
          Authorization: 'Bearer attacker-key',
          Cookie: 'session=private',
          'X-Meilisearch-Client': 'browser',
        },
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(data);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://search2.bettergov.ph/multi-search');
      expect(JSON.parse(init!.body as string)).toEqual(batch);
      expect(new Headers(init?.headers).get('Authorization')).toBe(
        'Bearer server-search-key'
      );
      expect(new Headers(init?.headers).has('Cookie')).toBe(false);
      expect(response.headers.get('RateLimit-Limit')).toBe('120');
    }
  );

  it.each(['bettergov', 'bettergov_flood_control', 'contractors'])(
    'supports query/export and facet search on %s',
    async index => {
      for (const [operation, body] of [
        ['search', { q: '', filter: 'Province = "Cebu"', limit: 10000 }],
        ['facet-search', { facetName: 'category', facetQuery: 'health' }],
      ] as const) {
        fetchMock.mockResolvedValue(json({ hits: [], facetHits: [] }));
        expect(
          (await call(`/api/search/indexes/${index}/${operation}`, body)).status
        ).toBe(200);
        expect(fetchMock.mock.lastCall?.[0]).toBe(
          `https://search2.bettergov.ph/indexes/${index}/${operation}`
        );
      }
    }
  );

  it.each([
    '/api/search/keys',
    '/api/search/indexes',
    '/api/search/indexes/bettergov/documents',
    '/api/search/indexes/bettergov/settings',
    '/api/search/indexes/private/search',
    '/api/search/indexes/bettergov%2Fsettings/search',
  ])('rejects unauthorized route %s', async path => {
    expect((await call(path, batch)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { queries: [{ indexUid: 'private', q: '' }] },
    {
      queries: [
        { indexUid: 'bettergov', federationOptions: { remote: 'secret' } },
      ],
    },
    { queries: [{ indexUid: 'bettergov', hybrid: { embedder: 'expensive' } }] },
    { queries: [{ indexUid: 'bettergov', limit: 10002 }] },
    {
      queries: Array.from({ length: 3 }, () => ({
        indexUid: 'bettergov_flood_control',
        limit: 10001,
      })),
    },
    { queries: [{ indexUid: 'bettergov', hitsPerPage: -1 }] },
    { queries: [], federation: {} },
    { queries: [] },
    { queries: Array.from({ length: 21 }, () => ({ indexUid: 'bettergov' })) },
    { queries: [null] },
  ])('blocks invalid or excessive batch %j', async body => {
    expect((await call('/api/search', body)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['GET', undefined, {}, 405],
    ['DELETE', batch, {}, 405],
    ['POST', 'not-json', {}, 400],
    ['POST', batch, { 'Content-Type': 'text/plain' }, 415],
    ['POST', 'x'.repeat(65537), {}, 413],
    ['POST', batch, { 'Content-Length': '65537' }, 413],
  ] as const)(
    'rejects invalid %s input',
    async (method, body, headers, status) => {
      expect(
        (await call('/api/search', body, { method, headers })).status
      ).toBe(status);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('does not forward client-supplied URL parameters', async () => {
    expect(
      (await call('/api/search?url=https://evil.example', batch)).status
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails clearly without a server search key', async () => {
    const response = await call(
      '/api/search',
      batch,
      {},
      { ...env, MEILISEARCH_SEARCH_API_KEY: undefined }
    );
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('supports SDK preflights and rejects foreign origins before proxying', async () => {
    const response = await call('/api/search/multi-search', undefined, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://preview.oueg.workers.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-meilisearch-client',
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    expect(
      (
        await call('/api/search', batch, {
          headers: { Origin: 'https://evil.example' },
        })
      ).status
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('upstream failures and throttling', () => {
  it.each([301, 302, 401, 403, 500, 503])(
    'sanitizes upstream %s',
    async status => {
      fetchMock.mockResolvedValue(
        new Response('private infrastructure details', {
          status,
          headers: { Location: 'https://evil.example' },
        })
      );
      const response = await call('/api/search', {
        queries: [{ indexUid: 'bettergov' }],
      });
      expect(response.status).toBe(502);
      expect(await response.text()).not.toContain('private');
      expect(response.headers.has('Location')).toBe(false);
    }
  );

  it('rejects HTML challenge pages and network failures', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html>challenge</html>', {
        headers: { 'Content-Type': 'text/html' },
      })
    );
    expect(
      (await call('/api/search', { queries: [{ indexUid: 'bettergov' }] }))
        .status
    ).toBe(502);
    fetchMock.mockRejectedValueOnce(new Error('connection details'));
    expect(
      (await call('/api/search', { queries: [{ indexUid: 'bettergov' }] }))
        .status
    ).toBe(502);
  });

  it('preserves upstream retry advice', async () => {
    fetchMock.mockResolvedValue(
      json({ message: 'upstream detail' }, 429, { 'Retry-After': '120' })
    );
    const response = await call('/api/search', {
      queries: [{ indexUid: 'bettergov' }],
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
  });

  it.each(['/api/weather', '/api/forex', '/api/search'])(
    'throttles %s before reaching the upstream',
    async path => {
      const limited = {
        ...env,
        API_RATE_LIMITER: { limit: async () => ({ success: false }) },
      } as Env;
      const response = await call(
        path,
        path === '/api/search'
          ? { queries: [{ indexUid: 'bettergov' }] }
          : undefined,
        {},
        limited
      );
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
});
