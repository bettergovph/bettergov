import type { Env } from '../types';
import { proxyError, proxyJson, UPSTREAM_HEADERS } from '../lib/json-proxy';

const PUBLIC_INDEXES = new Set([
  'bettergov',
  'bettergov_flood_control',
  'contractors',
]);
const MAX_BODY_BYTES = 64 * 1024;
const MAX_QUERIES = 20;
// The map requests 5,000 hits and statistics request 10,000. InstantSearch's
// adapter adds one lookahead hit to determine whether a next page exists.
const MAX_BATCH_HITS = 20_002;
const SEARCH_FIELDS = new Set([
  'q',
  'offset',
  'limit',
  'page',
  'hitsPerPage',
  'filter',
  'sort',
  'facets',
  'attributesToRetrieve',
  'attributesToCrop',
  'cropLength',
  'cropMarker',
  'attributesToHighlight',
  'highlightPreTag',
  'highlightPostTag',
  'attributesToSearchOn',
  'showMatchesPosition',
  'matchingStrategy',
  'distinct',
]);
const FACET_FIELDS = new Set([
  'facetName',
  'facetQuery',
  'q',
  'filter',
  'matchingStrategy',
  'attributesToSearchOn',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function searchOrigin(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

// Bound the actual stream too: Content-Length can be absent or dishonest.
async function readBody(request: Request): Promise<unknown | Response> {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) {
    return proxyError('Search request is too large', 413);
  }
  if (!request.body) return proxyError('JSON body required', 400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return proxyError('Search request is too large', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return proxyError('Invalid JSON body', 400);
  } finally {
    reader.releaseLock();
  }
}

function validQuery(query: unknown, facet = false, multi = false): boolean {
  if (!isRecord(query)) return false;
  const fields = facet ? FACET_FIELDS : SEARCH_FIELDS;
  if (
    Object.keys(query).some(
      name => !fields.has(name) && !(multi && name === 'indexUid')
    )
  )
    return false;
  if (
    multi &&
    (typeof query.indexUid !== 'string' || !PUBLIC_INDEXES.has(query.indexUid))
  )
    return false;
  if (facet && (typeof query.facetName !== 'string' || !query.facetName))
    return false;
  for (const name of ['q', 'facetQuery']) {
    if (
      query[name] !== undefined &&
      (typeof query[name] !== 'string' || query[name].length > 4000)
    )
      return false;
  }
  // Preserve large map/statistics queries and the existing CSV export.
  for (const name of ['limit', 'hitsPerPage']) {
    const value = query[name];
    if (
      value !== undefined &&
      (typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > (multi ? 10001 : 10000))
    )
      return false;
  }
  return true;
}

/** Only the search operations used by the public UI are exposed. */
export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const multi = [
    '/api/search',
    '/api/search/',
    '/api/search/multi-search',
  ].includes(path);
  const match =
    /^\/api\/search\/indexes\/([a-zA-Z0-9_-]+)\/(search|facet-search)$/.exec(
      path
    );
  if (!multi && (!match || !PUBLIC_INDEXES.has(match[1]))) {
    return proxyError('Search route not found', 404);
  }
  if (request.method !== 'POST') {
    return proxyError('Method not allowed. Use POST.', 405, {
      Allow: 'POST, OPTIONS',
    });
  }
  if (url.search)
    return proxyError('Put search parameters in the JSON body', 400);
  if (
    request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  ) {
    return proxyError('Content-Type must be application/json', 415);
  }
  const body = await readBody(request);
  if (body instanceof Response) return body;
  if (multi) {
    if (
      !isRecord(body) ||
      Object.keys(body).some(name => name !== 'queries') ||
      !Array.isArray(body.queries) ||
      body.queries.length === 0 ||
      body.queries.length > MAX_QUERIES ||
      !body.queries.every(query => validQuery(query, false, true)) ||
      body.queries.reduce(
        (total, query) =>
          total +
          Math.max(
            query.limit ?? query.hitsPerPage ?? 20,
            query.hitsPerPage ?? 0
          ),
        0
      ) > MAX_BATCH_HITS
    ) {
      return proxyError('Invalid search batch or index', 400);
    }
  } else if (!validQuery(body, match![2] === 'facet-search')) {
    return proxyError('Invalid search query', 400);
  }
  const key = env.MEILISEARCH_SEARCH_API_KEY?.trim();
  const origin = searchOrigin(env.MEILISEARCH_ORIGIN);
  if (!key || !origin) return proxyError('Search is not configured', 503);

  const upstreamPath = multi
    ? '/multi-search'
    : `/indexes/${match![1]}/${match![2]}`;
  return proxyJson(new URL(upstreamPath, origin), {
    method: 'POST',
    headers: {
      ...UPSTREAM_HEADERS,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
}
