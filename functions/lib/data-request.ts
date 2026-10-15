/** Public data routes are read-only; only scheduled refreshes bypass the cache. */
export function validateDataRequest(
  request: Request,
  filter: 'city' | 'symbol'
): Response | undefined {
  if (request.method !== 'GET') {
    return Response.json(
      { error: 'Method not allowed. Use GET.' },
      { status: 405, headers: { Allow: 'GET, OPTIONS' } }
    );
  }
  const params = new URL(request.url).searchParams;
  for (const [name, value] of params) {
    if (
      name !== filter ||
      !value ||
      value.length > 100 ||
      params.getAll(name).length !== 1
    ) {
      return Response.json(
        { error: `Only a single ${filter} filter is supported` },
        { status: 400 }
      );
    }
  }
}
