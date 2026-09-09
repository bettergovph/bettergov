import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTalaCmsClient, TalaCmsError } from '../client';

const baseEnv = {
  TALACMS_API_URL: 'https://talacms.example/cda/graphql',
  TALACMS_API_TOKEN: 'super-secret-token',
} as NodeJS.ProcessEnv;

const mockFetchOnce = (
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {}
) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, status, json: async () => body })
  );
};

describe('createTalaCmsClient', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the data field on a valid response', async () => {
    mockFetchOnce({ data: { ok: true } });
    const query = createTalaCmsClient(baseEnv);
    await expect(query('query{ok}')).resolves.toEqual({ ok: true });
  });

  it('accepts a standards-valid response carrying top-level extensions', async () => {
    mockFetchOnce({ data: { ok: true }, extensions: { requestId: 'abc' } });
    const query = createTalaCmsClient(baseEnv);
    await expect(query('query{ok}')).resolves.toEqual({ ok: true });
  });

  it('sends the bearer token, body, and a production X-Environment by default', async () => {
    mockFetchOnce({ data: { ok: true } });
    await createTalaCmsClient(baseEnv)('query{ok}');

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://talacms.example/cda/graphql');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer super-secret-token');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['X-Environment']).toBe('production');
    expect(JSON.parse(init.body)).toEqual({ query: 'query{ok}' });
  });

  it('treats a blank TALACMS_ENVIRONMENT as unset', async () => {
    mockFetchOnce({ data: { ok: true } });
    await createTalaCmsClient({ ...baseEnv, TALACMS_ENVIRONMENT: '   ' })(
      'query{ok}'
    );
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls[0][1].headers['X-Environment']).toBe(
      'production'
    );
  });

  it('sends a configured TALACMS_ENVIRONMENT', async () => {
    mockFetchOnce({ data: { ok: true } });
    await createTalaCmsClient({ ...baseEnv, TALACMS_ENVIRONMENT: 'staging' })(
      'query{ok}'
    );
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls[0][1].headers['X-Environment']).toBe('staging');
  });

  it.each([
    [{}, 'not configured'],
    [{ TALACMS_API_URL: 'not-a-url', TALACMS_API_TOKEN: 't' }, 'valid URL'],
    [
      { TALACMS_API_URL: 'http://talacms.example/g', TALACMS_API_TOKEN: 't' },
      'https',
    ],
    [{ TALACMS_API_URL: 'https://talacms.example/g' }, 'not configured'],
  ])(
    'rejects invalid configuration when the client is CREATED (%#)',
    (env, fragment) => {
      // Throws at construction, not on first query: the orchestrator must be
      // able to fail on configuration before it touches any local file.
      expect(() => createTalaCmsClient(env as NodeJS.ProcessEnv)).toThrow(
        new RegExp(fragment as string, 'i')
      );
    }
  );

  it('does not perform any request while validating configuration', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(() => createTalaCmsClient({} as NodeJS.ProcessEnv)).toThrow();
    createTalaCmsClient(baseEnv);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never includes the token in an error message', async () => {
    mockFetchOnce({}, { ok: false, status: 401 });
    const query = createTalaCmsClient(baseEnv);
    await expect(query('query{ok}')).rejects.toSatisfy(
      (err: Error) => !err.message.includes('super-secret-token')
    );
  });

  it.each([
    [{ errors: [{ message: 'boom' }] }, {}, 'GraphQL error'],
    [{ nope: 1 }, {}, 'unexpected response shape'],
    [{}, {}, 'no data'],
    [null, { ok: false, status: 502 }, 'HTTP 502'],
  ])('fails closed on a bad response (%#)', async (body, opts, fragment) => {
    mockFetchOnce(body, opts as { ok?: boolean; status?: number });
    await expect(createTalaCmsClient(baseEnv)('query{ok}')).rejects.toThrow(
      new RegExp(fragment, 'i')
    );
  });

  it('throws TalaCmsError when the network call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(
      createTalaCmsClient(baseEnv)('query{ok}')
    ).rejects.toBeInstanceOf(TalaCmsError);
  });

  it('rejects when response.json() throws (malformed body)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
      })
    );
    await expect(createTalaCmsClient(baseEnv)('query{ok}')).rejects.toThrow(
      /malformed/i
    );
  });

  it('aborts a stalled fetch after the 8s timeout', async () => {
    vi.useFakeTimers();
    // Resolves only if aborted — proves the timeout is what ends the request.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError'))
            );
          })
      )
    );

    const pending = createTalaCmsClient(baseEnv)('query{ok}');
    const assertion = expect(pending).rejects.toThrow(/failed to reach/i);
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });

  it('aborts a stalled response body, not just a stalled fetch', async () => {
    vi.useFakeTimers();
    // Headers arrive immediately, the body never does. An implementation that
    // clears the timer right after fetch() resolves would hang here forever.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { signal: AbortSignal }) => ({
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError'))
            );
          }),
      }))
    );

    const pending = createTalaCmsClient(baseEnv)('query{ok}');
    const assertion = expect(pending).rejects.toThrow(/malformed/i);
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });
});
