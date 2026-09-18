import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithCache } from '../api';

describe('fetchWithCache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should deduplicate simultaneous requests', async () => {
    const mockFetch = vi.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ data: 'test' }),
              }),
            50
          )
        )
    );

    vi.stubGlobal('fetch', mockFetch);

    const url = 'https://example.com/api';

    const request1 = fetchWithCache(url);
    const request2 = fetchWithCache(url);

    const [result1, result2] = await Promise.all([request1, request2]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({ data: 'test' });
    expect(result2).toEqual({ data: 'test' });
  });
});
