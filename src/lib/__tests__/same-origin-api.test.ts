import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSearchClient } from '../search';
import { fetchWeatherData } from '../weather';
import { fetchForexData } from '../forex';
import { exportMeilisearchData } from '../exportData';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('same-origin API clients', () => {
  it('sends weather and forex to relative /api paths and preserves transformations', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            manila: {
              main: { temp: 30.5, humidity: 60, pressure: 1010 },
              weather: [{ description: 'clear sky', icon: '01d' }],
              wind: { speed: 2 },
              visibility: 10000,
            },
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rates: [{ country: 'USA', symbol: 'USD', phpEquivalent: 58 }],
          })
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchWeatherData()).toEqual([
      expect.objectContaining({
        location: 'manila',
        temperature: 31,
        icon: 'Sun',
      }),
    ]);
    expect(await fetchForexData(['USD'])).toEqual([
      { currency: 'USA', code: 'USD', rate: 58 },
    ]);
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '/api/weather',
      '/api/forex',
    ]);
  });

  it.each([5, 1000, 5000, 10000])(
    'uses the actual SDK with the /api/search prefix for %s hits and no browser key',
    async hitsPerPage => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              results: [
                {
                  indexUid: 'bettergov',
                  hits: [],
                  query: 'passport',
                  processingTimeMs: 1,
                  limit: 5,
                  offset: 0,
                  estimatedTotalHits: 0,
                  facetDistribution: {},
                },
              ],
            })
          )
      );
      vi.stubGlobal('fetch', fetchMock);
      const client = createSearchClient({ primaryKey: 'slug' });
      await client.searchClient.search([
        { indexName: 'bettergov', params: { query: 'passport', hitsPerPage } },
      ]);
      for (const [url, init] of fetchMock.mock.calls) {
        expect(String(url)).toBe(
          `${window.location.origin}/api/search/multi-search`
        );
        expect(new Headers(init.headers).has('Authorization')).toBe(false);
      }
      expect(
        fetchMock.mock.calls.flatMap(
          ([, init]) => JSON.parse(init.body).queries
        )
      ).toContainEqual(
        expect.objectContaining({
          indexUid: 'bettergov',
          q: 'passport',
          limit: hitsPerPage + 1,
        })
      );
    }
  );

  it('keeps CSV export requests on the same origin without a browser credential', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ hits: [] })));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    await exportMeilisearchData({
      indexName: 'bettergov_flood_control',
      filters: 'Province = "Cebu"',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/search/indexes/bettergov_flood_control/search');
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
    expect(JSON.parse(init.body)).toMatchObject({
      limit: 10000,
      filter: 'Province = "Cebu"',
    });
  });
});
