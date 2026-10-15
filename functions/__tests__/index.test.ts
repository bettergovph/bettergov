import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Env } from '../types';

const handlerResponse = (name: string) =>
  new Response(JSON.stringify({ handler: name }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

vi.mock('../api/weather', () => ({
  onRequest: vi.fn(async () => handlerResponse('weather')),
  scheduled: vi.fn(),
}));
vi.mock('../api/forex', () => ({
  onRequest: vi.fn(async () => handlerResponse('forex')),
  scheduled: vi.fn(),
}));
vi.mock('../weather', () => ({
  onRequest: vi.fn(async () => handlerResponse('weather-kv')),
}));
vi.mock('../forex', () => ({
  onRequest: vi.fn(async () => handlerResponse('forex-kv')),
}));
vi.mock('../api/crawl', () => ({
  onRequest: vi.fn(async () => handlerResponse('crawl')),
}));
vi.mock('../api/search', () => ({
  onRequest: vi.fn(async () => handlerResponse('search')),
}));
vi.mock('../api/report-hotline', () => ({
  onRequest: vi.fn(async () => handlerResponse('report-hotline')),
}));
vi.mock('../api/assistant', () => ({
  onRequest: vi.fn(async () => handlerResponse('assistant')),
  onRequestStream: vi.fn(async () => handlerResponse('assistant-stream')),
}));

const worker = (await import('../index')).default;

// Stub bindings so every route dispatches. No TALACMS_* — the Worker has
// no CMS role.
const rateLimiters = {
  API_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
  ASSISTANT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
  CRAWL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
  REPORT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
};

const env = {
  ...rateLimiters,
  WEATHER_KV: {},
  FOREX_KV: {},
  BROWSER_KV: {},
  BETTERGOV_DB: {},
} as unknown as Env;
const ctx = {} as ExecutionContext;

const call = (path: string, method = 'GET', withEnv: Env = env) =>
  worker.fetch(
    new Request(`https://www.gov.ph${path}`, {
      method,
      headers: {
        Origin: 'https://www.gov.ph',
        'CF-Connecting-IP': '192.0.2.1',
      },
    }),
    withEnv,
    ctx
  );

describe('Routes whose bindings are not declared', () => {
  const bare = { ...rateLimiters } as unknown as Env;

  it.each([
    ['/api/weather', ['WEATHER_KV']],
    ['/weather', ['WEATHER_KV']],
    ['/api/forex', ['FOREX_KV']],
    ['/forex', ['FOREX_KV']],
    ['/api/crawl', ['BROWSER_KV', 'BETTERGOV_DB']],
  ])(
    'answer 503 for %s naming the missing binding(s)',
    async (path, missing) => {
      const response = await call(path, 'GET', bare);
      expect(response.status).toBe(503);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://www.gov.ph'
      );
      await expect(response.json()).resolves.toMatchObject({
        error: 'Not configured',
        missingBindings: missing,
      });
    }
  );

  it.each([
    ['/api/search', 'search'],
    ['/api/assistant', 'assistant'],
    ['/api/assistant/stream', 'assistant-stream'],
    ['/api/report-hotline', 'report-hotline'],
  ])('still dispatch %s without storage bindings', async (path, handler) => {
    const response = await call(path, 'GET', bare);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ handler });
  });

  it('still serves /api/status', async () => {
    expect((await call('/api/status', 'GET', bare)).status).toBe(200);
  });

  it('skips the scheduled refreshes instead of throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      worker.scheduled({} as ScheduledController, bare)
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe('Worker routing after the CMS routes are removed', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    '/api/weather',
    '/api/search/multi-search',
    '/weather',
    '/api/forex',
    '/forex',
    '/api/crawl',
    '/api/report-hotline',
    '/api/assistant',
    '/api/assistant/stream',
    '/api/status',
    '/unknown',
  ])('blocks unapproved origins at %s before dispatch', async path => {
    const response = await worker.fetch(
      new Request(`https://www.gov.ph${path}`, {
        headers: { Origin: 'https://evil.example' },
      }),
      env,
      ctx
    );
    expect(response.status).toBe(403);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(rateLimiters.API_RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/weather', 'weather'],
    ['/api/search', 'search'],
    ['/api/search/multi-search', 'search'],
    ['/api/search/indexes/bettergov/facet-search', 'search'],
    ['/api/forex', 'forex'],
    ['/weather', 'weather-kv'],
    ['/forex', 'forex-kv'],
    ['/api/crawl', 'crawl'],
    ['/api/report-hotline', 'report-hotline'],
    ['/api/assistant', 'assistant'],
    ['/api/assistant/stream', 'assistant-stream'],
  ])('still DISPATCHES %s to its handler', async (path, handler) => {
    const response = await call(path);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ handler });
    // CORS is applied by the router, so this also proves it went through it.
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://www.gov.ph'
    );
  });

  it.each([['/cms/categories'], ['/cms/hotlines']])(
    'returns 404 for %s',
    async path => {
      const response = await call(path);
      expect(response.status).toBe(404);
    }
  );

  it('lists no CMS endpoint in the /api/status manifest', async () => {
    const response = await call('/api/status');
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain('/cms/');
    expect(body).not.toContain('cms-categories');
    expect(body).not.toContain('cms-hotlines');
  });

  it('still advertises every unrelated route in /api/status', async () => {
    const body = (await (await call('/api/status')).json()) as {
      endpoints: { path: string }[];
    };
    const paths = body.endpoints.map(e => e.path);
    for (const path of [
      '/api/weather',
      '/api/forex',
      '/weather',
      '/forex',
      '/api/crawl',
      '/api/report-hotline',
      '/api/assistant',
      '/api/assistant/stream',
    ]) {
      expect(paths).toContain(path);
    }
  });

  it('lists no CMS endpoint in the 404 manifest, and keeps the others', async () => {
    const body = (await (await call('/nope')).json()) as {
      availableEndpoints: string[];
    };
    expect(body.availableEndpoints.some(e => e.startsWith('/cms/'))).toBe(
      false
    );
    for (const path of [
      '/api/status',
      '/api/weather',
      '/api/forex',
      '/api/crawl',
      '/api/report-hotline',
      '/api/assistant',
      '/api/assistant/stream',
      '/weather',
      '/forex',
    ]) {
      expect(body.availableEndpoints).toContain(path);
    }
  });
});
