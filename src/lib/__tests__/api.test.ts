import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithCache } from '../api';

describe('fetchWithCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('deduplicates concurrent requests to the same URL (in-flight sharing)', async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    const responsePromise = new Promise(resolve => {
      resolveResponse = resolve;
    });

    const fetchMock = vi.fn().mockReturnValue(responsePromise);
    vi.stubGlobal('fetch', fetchMock);

    // Two "components" request the same URL before the first response
    // has arrived.
    const call1 = fetchWithCache('https://api.bettergov.ph/weather');
    const call2 = fetchWithCache('https://api.bettergov.ph/weather');

    resolveResponse({
      ok: true,
      json: () => Promise.resolve({ temp: 30 }),
    });

    const [result1, result2] = await Promise.all([call1, call2]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({ temp: 30 });
    expect(result2).toEqual({ temp: 30 });
  });

  it('makes a fresh request after the in-flight request settles', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ temp: 31 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchWithCache('https://api.bettergov.ph/forex', 0);
    await fetchWithCache('https://api.bettergov.ph/forex', 0);

    // cacheDuration is 0, so the second call should trigger a fresh
    // request rather than reuse a stale in-flight/cache entry.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('serves from cache without hitting the network when still valid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ temp: 32 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const url = 'https://api.bettergov.ph/weather-cache-test';
    await fetchWithCache(url, 60_000);
    const cached = await fetchWithCache(url, 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached).toEqual({ temp: 32 });
  });

  it('clears the in-flight entry after a failed request, so a retry can fetch again', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ temp: 33 }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const url = 'https://api.bettergov.ph/weather-retry-test';

    await expect(fetchWithCache(url)).rejects.toThrow(
      'API request failed with status 500'
    );

    const result = await fetchWithCache(url);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ temp: 33 });
  });
});
