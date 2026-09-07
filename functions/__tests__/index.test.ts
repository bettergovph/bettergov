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
vi.mock('../api/report-hotline', () => ({
  onRequest: vi.fn(async () => handlerResponse('report-hotline')),
}));

const worker = (await import('../index')).default;

// No TALACMS_* — the Worker has no CMS role.
const env = {} as Env;
const ctx = {} as ExecutionContext;

const call = (path: string, method = 'GET') =>
  worker.fetch(
    new Request(`https://api.bettergov.ph${path}`, { method }),
    env,
    ctx
  );

describe('Worker routing after the CMS routes are removed', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['/api/weather', 'weather'],
    ['/api/forex', 'forex'],
    ['/weather', 'weather-kv'],
    ['/forex', 'forex-kv'],
    ['/api/crawl', 'crawl'],
    ['/api/report-hotline', 'report-hotline'],
  ])('still DISPATCHES %s to its handler', async (path, handler) => {
    const response = await call(path);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ handler });
    // CORS is applied by the router, so this also proves it went through it.
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
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
      '/weather',
      '/forex',
    ]) {
      expect(body.availableEndpoints).toContain(path);
    }
  });
});
