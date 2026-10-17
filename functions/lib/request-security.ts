import type { Env } from '../types';

// Match serialized HTTPS origins, never arbitrary URLs or hostname substrings.
// Multiple labels also cover Workers version-preview subdomains.
const WORKER_ORIGIN =
  /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:govph|oueg)\.workers\.dev$/i;
const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'];
const ALLOWED_HEADERS = ['content-type', 'x-meilisearch-client'];
const PERIOD_SECONDS = 60;

export function isAllowedOrigin(origin: string): boolean {
  return origin === 'https://www.gov.ph' || WORKER_ORIGIN.test(origin);
}

type RateLimitBinding =
  | 'API_RATE_LIMITER'
  | 'ASSISTANT_RATE_LIMITER'
  | 'CRAWL_RATE_LIMITER'
  | 'REPORT_RATE_LIMITER';

interface Policy {
  binding: RateLimitBinding;
  limit: number;
}

// Keep these limits in sync with the native bindings in wrangler.jsonc.
const API_POLICY: Policy = { binding: 'API_RATE_LIMITER', limit: 120 };

function policiesFor(path: string): Policy[] {
  if (path === '/api/assistant' || path === '/api/assistant/stream') {
    return [API_POLICY, { binding: 'ASSISTANT_RATE_LIMITER', limit: 20 }];
  }
  if (path === '/api/crawl') {
    return [API_POLICY, { binding: 'CRAWL_RATE_LIMITER', limit: 10 }];
  }
  if (path === '/api/report-hotline') {
    return [API_POLICY, { binding: 'REPORT_RATE_LIMITER', limit: 5 }];
  }
  return [API_POLICY];
}

function errorResponse(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function secureResponse(
  response: Response,
  origin: string | null,
  extraHeaders: Headers
): Response {
  const headers = new Headers(response.headers);
  // No handler can accidentally restore wildcard CORS or credentials for an
  // unapproved origin. This also covers upstream and error responses.
  for (const name of Array.from(headers.keys())) {
    if (name.startsWith('access-control-')) headers.delete(name);
  }
  const vary = new Set(
    (headers.get('Vary') ?? '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );
  vary.add('Origin');
  vary.add('Access-Control-Request-Method');
  vary.add('Access-Control-Request-Headers');
  headers.set('Vary', [...vary].join(', '));
  // Rate limits and credentialed responses must not be cached across clients.
  headers.set('Cache-Control', 'no-store, no-transform');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Meilisearch-Client'
    );
    headers.set(
      'Access-Control-Expose-Headers',
      'RateLimit-Limit, RateLimit-Remaining, Retry-After'
    );
  }
  extraHeaders.forEach((value, name) => headers.set(name, value));
  // Pass the body through without reading it so SSE remains streamed.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Shared boundary for every HTTP route in the Worker. */
export async function withRequestSecurity(
  request: Request,
  env: Env,
  handle: () => Promise<Response>
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const headers = new Headers();
  const finish = (response: Response) =>
    secureResponse(response, origin, headers);

  if (
    (origin !== null && !isAllowedOrigin(origin)) ||
    (origin === null &&
      ['cross-site', 'same-site'].includes(
        request.headers.get('Sec-Fetch-Site') ?? ''
      ))
  ) {
    return finish(errorResponse('Origin not allowed', 403));
  }

  if (request.method === 'OPTIONS') {
    if (!origin)
      return finish(errorResponse('Origin required for preflight', 403));
    const method = request.headers.get('Access-Control-Request-Method');
    if (!method || !ALLOWED_METHODS.includes(method)) {
      headers.set('Allow', ALLOWED_METHODS.join(', '));
      return finish(errorResponse('Preflight method not allowed', 405));
    }
    const requestedHeaders = request.headers.get(
      'Access-Control-Request-Headers'
    );
    if (
      requestedHeaders &&
      requestedHeaders
        .split(',')
        .some(name => !ALLOWED_HEADERS.includes(name.trim().toLowerCase()))
    ) {
      return finish(errorResponse('Preflight headers not allowed', 403));
    }
    headers.set('Access-Control-Max-Age', '600');
    return finish(new Response(null, { status: 204 }));
  }

  // Origin-less requests (same-origin GETs, navigation, server clients) still
  // consume quota. Trust only Cloudflare's client-IP header, never X-Forwarded-For.
  // A missing IP shares a fallback bucket instead of bypassing the limiter.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  try {
    for (const policy of policiesFor(new URL(request.url).pathname)) {
      const limiter = env[policy.binding];
      if (!limiter) throw new Error('Rate limiter binding missing');
      const { success } = await limiter.limit({
        key: `govph:${policy.binding}:${ip}`,
      });
      headers.set('RateLimit-Limit', String(policy.limit));
      if (!success) {
        headers.set('RateLimit-Remaining', '0');
        headers.set('Retry-After', String(PERIOD_SECONDS));
        return finish(
          errorResponse('Too many requests. Please try again later.', 429)
        );
      }
    }
  } catch {
    // Protect upstream services if the binding is absent or unavailable.
    console.error('[security] Rate limiting unavailable');
    headers.set('Retry-After', String(PERIOD_SECONDS));
    return finish(errorResponse('Service temporarily unavailable', 503));
  }

  try {
    return finish(await handle());
  } catch {
    console.error('[worker] Request handler failed');
    return finish(errorResponse('Internal server error', 500));
  }
}
