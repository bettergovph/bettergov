/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../types';
import { withRequestSecurity } from '../lib/request-security';

const origin = 'https://www.gov.ph';
const request = (path = '/api/status', init: RequestInit = {}) =>
  new Request(`https://govph-dev.govph.workers.dev${path}`, {
    ...init,
    headers: {
      Origin: origin,
      'CF-Connecting-IP': '192.0.2.1',
      ...init.headers,
    },
  });
const handler = () => vi.fn(async () => new Response('ok'));
const binding = () => ({ limit: vi.fn(async () => ({ success: true })) });
const environment = () => ({
  API_RATE_LIMITER: binding(),
  ASSISTANT_RATE_LIMITER: binding(),
  CRAWL_RATE_LIMITER: binding(),
  REPORT_RATE_LIMITER: binding(),
});
type Limiters = ReturnType<typeof environment>;
const run = (req: Request, env: Limiters, handle = handler()) =>
  withRequestSecurity(req, env as unknown as Env, handle);

afterEach(() => vi.restoreAllMocks());

describe('credentialed CORS', () => {
  it.each([
    origin,
    'https://govph-dev.govph.workers.dev',
    'https://preview.govph.workers.dev',
    'https://abc123.govph-dev.govph.workers.dev',
    'https://preview.oueg.workers.dev',
    'https://abc123.govph-dev.oueg.workers.dev',
  ])('accepts %s and echoes exactly one origin', async allowed => {
    const response = await run(
      request('/api/status', { headers: { Origin: allowed } }),
      environment()
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(allowed);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain(
      'Retry-After'
    );
    expect(response.headers.get('Vary')).toContain('Origin');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it.each([
    'https://evil.example',
    'http://www.gov.ph',
    'https://gov.ph',
    'https://api.gov.ph',
    'https://www.gov.ph.evil.example',
    'https://govph.workers.dev',
    'https://evilgovph.workers.dev',
    'https://oueg.workers.dev',
    'https://eviloueg.workers.dev',
    'https://app.oueg.workers.dev.evil.example',
    'https://app.oueg.workers.dev:8443',
    'http://app.oueg.workers.dev',
    'https://other.workers.dev',
    'https://app.govph.workers.dev.evil.example',
    'https://app.govph.workers.dev:8443',
    'http://app.govph.workers.dev',
    'https://www.gov.ph@evil.example',
    'https://evil.example@app.govph.workers.dev',
    'https://app.govph.workers.dev/path',
    'https://app.govph.workers.dev?query',
    'https://app.govph.workers.dev#fragment',
    'https://app.govph.workers.dev/',
    'https://-app.govph.workers.dev',
    'https://app..govph.workers.dev',
    'https://www.gov.ph, https://evil.example',
    'null',
    '',
  ])('rejects %s before executing the handler', async denied => {
    const env = environment();
    const handle = handler();
    const response = await run(
      request('/api/assistant', {
        method: 'POST',
        headers: { Origin: denied },
      }),
      env,
      handle
    );
    expect(response.status).toBe(403);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(
      false
    );
    expect(handle).not.toHaveBeenCalled();
    expect(env.API_RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  it('allows origin-less clients with a quota and no CORS grant', async () => {
    const env = environment();
    const req = request();
    req.headers.delete('Origin');
    const response = await run(req, env);
    expect(response.status).toBe(200);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(
      false
    );
    expect(env.API_RATE_LIMITER.limit).toHaveBeenCalledOnce();
  });

  it.each(['cross-site', 'same-site'])(
    'blocks origin-less %s browser requests',
    async fetchSite => {
      const req = request();
      req.headers.delete('Origin');
      req.headers.set('Sec-Fetch-Site', fetchSite);
      expect((await run(req, environment())).status).toBe(403);
    }
  );

  it('handles credentialed preflight without consuming quota', async () => {
    const env = environment();
    const handle = handler();
    const response = await run(
      request('/api/assistant/stream', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }),
      env,
      handle
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, X-Meilisearch-Client'
    );
    expect(response.headers.get('Access-Control-Max-Age')).toBe('600');
    expect(handle).not.toHaveBeenCalled();
    expect(env.API_RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        Origin: 'https://evil.example',
        'Access-Control-Request-Method': 'POST',
      },
      403,
    ],
    [{ 'Access-Control-Request-Method': 'DELETE' }, 405],
    [
      {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-Evil',
      },
      403,
    ],
    [{}, 405],
  ])('rejects invalid preflights: %j', async (headers, status) => {
    const handle = handler();
    const response = await run(
      request('/api/assistant', { method: 'OPTIONS', headers }),
      environment(),
      handle
    );
    expect(response.status).toBe(status);
    expect(handle).not.toHaveBeenCalled();
  });

  it('removes stale wildcard grants from handlers and preserves existing Vary', async () => {
    const handle = vi.fn(
      async () =>
        new Response('data', {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            Vary: 'Accept-Encoding',
          },
        })
    );
    const req = request();
    req.headers.delete('Origin');
    const response = await run(req, environment(), handle);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(response.headers.has('Access-Control-Allow-Credentials')).toBe(
      false
    );
    expect(response.headers.get('Vary')).toContain('Accept-Encoding');
    expect(response.headers.get('Vary')).toContain('Origin');
  });
});

describe('native rate limiting', () => {
  it.each([
    ['/api/status', 'API_RATE_LIMITER', '120'],
    ['/api/assistant', 'ASSISTANT_RATE_LIMITER', '20'],
    ['/api/assistant/stream', 'ASSISTANT_RATE_LIMITER', '20'],
    ['/api/crawl', 'CRAWL_RATE_LIMITER', '10'],
    ['/api/report-hotline', 'REPORT_RATE_LIMITER', '5'],
    ['/weather', 'API_RATE_LIMITER', '120'],
    ['/forex', 'API_RATE_LIMITER', '120'],
  ] as const)(
    'returns 429 before %s runs when its quota is exhausted',
    async (path, name, limit) => {
      const env = environment();
      env[name].limit.mockResolvedValue({ success: false });
      const handle = handler();
      const response = await run(request(path), env, handle);
      expect(response.status).toBe(429);
      expect(response.headers.get('RateLimit-Limit')).toBe(limit);
      expect(response.headers.get('RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
        'true'
      );
      expect(handle).not.toHaveBeenCalled();
    }
  );

  it('shares the AI quota across JSON/stream, origins, query strings and sessions', async () => {
    const env = environment();
    await run(
      request('/api/assistant?session_id=one', { method: 'POST' }),
      env
    );
    await run(
      request('/api/assistant/stream?session_id=two', {
        method: 'POST',
        headers: { Origin: 'https://preview.oueg.workers.dev' },
      }),
      env
    );
    const calls = env.ASSISTANT_RATE_LIMITER.limit.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(calls[1]);
  });

  it('uses Cloudflare IPs, ignores forwarded IP spoofing and separates clients', async () => {
    const env = environment();
    await run(request(), env);
    await run(
      request('/api/status', {
        headers: {
          'X-Forwarded-For': '198.51.100.2',
          'X-Real-IP': '198.51.100.3',
        },
      }),
      env
    );
    await run(
      request('/api/status', { headers: { 'CF-Connecting-IP': '192.0.2.2' } }),
      env
    );
    const calls = env.API_RATE_LIMITER.limit.mock.calls;
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0]).not.toEqual(calls[2]);
  });

  it('still limits clients that omit both Origin and client IP', async () => {
    const env = environment();
    env.API_RATE_LIMITER.limit.mockResolvedValue({ success: false });
    const response = await run(
      new Request('https://www.gov.ph/api/status'),
      env
    );
    expect(response.status).toBe(429);
    expect(env.API_RATE_LIMITER.limit).toHaveBeenCalledWith({
      key: 'govph:API_RATE_LIMITER:unknown',
    });
  });

  it('stops at the overall limit even if the AI bucket has capacity', async () => {
    const env = environment();
    env.API_RATE_LIMITER.limit.mockResolvedValue({ success: false });
    expect((await run(request('/api/assistant'), env)).status).toBe(429);
    expect(env.ASSISTANT_RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  it.each(['missing', 'failed'])(
    'fails closed when a limiter is %s',
    async mode => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const env = environment();
      if (mode === 'missing')
        delete (env as Partial<Limiters>).ASSISTANT_RATE_LIMITER;
      else
        env.ASSISTANT_RATE_LIMITER.limit.mockRejectedValue(
          new Error('internal details')
        );
      const handle = handler();
      const response = await run(request('/api/assistant'), env, handle);
      expect(response.status).toBe(503);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
        'true'
      );
      expect(await response.text()).not.toContain('internal details');
      expect(handle).not.toHaveBeenCalled();
    }
  );

  it('reports configured limits without inventing a successful remaining count', async () => {
    const { config, error } = ts.parseConfigFileTextToJson(
      'wrangler.jsonc',
      readFileSync('wrangler.jsonc', 'utf8')
    );
    expect(error).toBeUndefined();
    const namespaces = new Set<string>();
    for (const [path, name] of [
      ['/api/status', 'API_RATE_LIMITER'],
      ['/api/assistant', 'ASSISTANT_RATE_LIMITER'],
      ['/api/crawl', 'CRAWL_RATE_LIMITER'],
      ['/api/report-hotline', 'REPORT_RATE_LIMITER'],
    ]) {
      const response = await run(request(path), environment());
      const configured = config.ratelimits.find(
        (item: { name: string }) => item.name === name
      );
      expect(configured.simple).toEqual({
        limit: Number(response.headers.get('RateLimit-Limit')),
        period: 60,
      });
      expect(response.headers.has('RateLimit-Remaining')).toBe(false);
      namespaces.add(configured.namespace_id);
    }
    expect(namespaces.size).toBe(4);
    expect(config.assets.run_worker_first).toEqual(
      expect.arrayContaining(['/api/*', '/weather', '/forex'])
    );
  });
});

describe('all response paths', () => {
  it('adds CORS to unexpected failures without leaking error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await run(
      request(),
      environment(),
      vi.fn(async () => {
        throw new Error('secret');
      })
    );
    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(await response.text()).not.toContain('secret');
  });

  it('preserves upstream retry advice and response status', async () => {
    const response = await run(
      request('/api/assistant'),
      environment(),
      vi.fn(
        async () =>
          new Response('busy', {
            status: 429,
            headers: { 'Retry-After': '120' },
          })
      )
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
  });

  it('returns an open SSE body immediately without buffering', async () => {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
    });
    const handle = vi.fn(
      async () =>
        new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'X-Accel-Buffering': 'no',
          },
        })
    );
    const response = await run(
      request('/api/assistant/stream'),
      environment(),
      handle
    );
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    const reader = response.body!.getReader();
    controller!.enqueue(new TextEncoder().encode('data: hello\n\n'));
    expect(new TextDecoder().decode((await reader.read()).value)).toBe(
      'data: hello\n\n'
    );
    controller!.close();
    expect((await reader.read()).done).toBe(true);
  });
});
