/** JSON-only upstream responses; never forward cookies, redirects or CORS. */
export function proxyError(
  message: string,
  status: number,
  headers = {}
): Response {
  return new Response(JSON.stringify({ error: message, message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function proxyJson(
  url: URL,
  init: RequestInit
): Promise<Response> {
  try {
    const upstream = await fetch(url.toString(), {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      await upstream.body?.cancel();
      if (upstream.status === 429) {
        return proxyError('Too many requests. Please try again later.', 429, {
          'Retry-After': upstream.headers.get('Retry-After') || '60',
        });
      }
      if (upstream.status === 400 || upstream.status === 422) {
        return proxyError('Invalid upstream query', upstream.status);
      }
      if (upstream.status === 404) return proxyError('Data not found', 404);
      return proxyError('Data service temporarily unavailable', 502);
    }
    if (!upstream.headers.get('Content-Type')?.includes('application/json')) {
      await upstream.body?.cancel();
      return proxyError('Invalid response from data service', 502);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return proxyError('Data service temporarily unavailable', 502);
  }
}

export const UPSTREAM_HEADERS = {
  Accept: 'application/json',
  Origin: 'https://www.gov.ph',
  'User-Agent': 'GOVPH-API/1.0 (+https://www.gov.ph)',
};
