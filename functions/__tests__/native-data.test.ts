// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';

const weather = {
  manila: { city: 'Manila', main: { temp: 30 } },
  cebu: { city: 'Cebu', main: { temp: 29 } },
};
const forex = {
  metadata: { source: 'BSP' },
  rates: [
    { symbol: 'USD', phpEquivalent: 58 },
    { symbol: 'EUR', phpEquivalent: 65 },
  ],
};
const bsp = {
  value: [
    {
      Title: 'United States',
      Unit: 'Dollar',
      Symbol: 'USD',
      EURequivalent: '0.9',
      USDequivalent: '1',
      PHPequivalent: '58',
      CountryCode: 'US',
      PublishedDate: '2026-10-15',
    },
  ],
};
const limiter = { limit: async () => ({ success: true }) };
const weatherKV = { get: vi.fn(), put: vi.fn() };
const forexKV = { get: vi.fn(), put: vi.fn() };
const fetchMock = vi.fn<typeof fetch>();
const env = {
  API_RATE_LIMITER: limiter,
  WEATHER_KV: weatherKV,
  FOREX_KV: forexKV,
  OPENWEATHERMAP_API_KEY: 'private-weather-key',
} as unknown as Env;
const call = (path: string, method = 'GET', withEnv = env) =>
  worker.fetch(
    new Request(`https://www.gov.ph${path}`, {
      method,
      headers: {
        Origin: 'https://www.gov.ph',
        'CF-Connecting-IP': '192.0.2.1',
      },
    }),
    withEnv,
    {} as ExecutionContext
  );

beforeEach(() => {
  vi.clearAllMocks();
  weatherKV.get.mockResolvedValue(weather);
  forexKV.get.mockResolvedValue(forex);
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('native data routes', () => {
  it.each([
    ['/api/weather', weather],
    ['/weather', weather],
    ['/api/weather?city=MANILA', { manila: weather.manila }],
    ['/weather?city=cebu', { cebu: weather.cebu }],
    ['/api/forex', forex],
    ['/forex', forex],
    ['/api/forex?symbol=usd', { ...forex, rates: [forex.rates[0]] }],
    ['/forex?symbol=eur', { ...forex, rates: [forex.rates[1]] }],
  ])('serves %s from its bound KV without a proxy', async (path, data) => {
    const response = await call(path as string);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true'
    );
    expect(response.headers.get('RateLimit-Limit')).toBe('120');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(weatherKV.put).not.toHaveBeenCalled();
    expect(forexKV.put).not.toHaveBeenCalled();
  });

  it.each([
    '/api/weather?update=true',
    '/api/forex?update=true',
    '/weather?force=true',
    '/forex?url=https://evil.example',
    '/api/weather?city=manila&city=cebu',
    '/api/forex?symbol=',
    '/api/weather?city=',
  ])('rejects cache bypass and invalid filters at %s', async path => {
    expect((await call(path)).status).toBe(400);
    expect(weatherKV.get).not.toHaveBeenCalled();
    expect(forexKV.get).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['/api/weather', '/weather', '/api/forex', '/forex'])(
    'rejects writes at %s',
    async path => {
      const response = await call(path, 'POST');
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    '/api/weather?city=unknown',
    '/api/weather?city=constructor',
    '/weather?city=constructor',
    '/api/forex?symbol=UNKNOWN',
  ])('returns 404 for unknown filters at %s', async path => {
    expect((await call(path)).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fills empty weather KV directly from OpenWeatherMap, then serves cached results', async () => {
    weatherKV.get.mockResolvedValueOnce(null);
    fetchMock.mockImplementation(async () =>
      Response.json({ main: { temp: 30 }, coord: { lat: 14, lon: 120 } })
    );
    const response = await call('/api/weather?city=manila');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      manila: { main: { temp: 30 } },
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(new URL(String(url)).origin).toBe(
        'https://api.openweathermap.org'
      );
      expect(init?.redirect).toBe('manual');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(weatherKV.put).toHaveBeenCalledWith(
      'philippines_weather',
      expect.any(String),
      { expirationTtl: 21600 }
    );
    expect(
      Object.keys(JSON.parse(weatherKV.put.mock.calls[0][1]))
    ).toHaveLength(4);
    await call('/api/weather');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('fills empty forex KV directly from BSP', async () => {
    forexKV.get.mockResolvedValueOnce(null);
    fetchMock.mockResolvedValueOnce(Response.json(bsp));
    const response = await call('/api/forex?symbol=USD');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rates: [{ symbol: 'USD', phpEquivalent: 58 }],
    });
    expect(new URL(String(fetchMock.mock.calls[0][0])).origin).toBe(
      'https://www.bsp.gov.ph'
    );
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual');
    expect(forexKV.put).toHaveBeenCalledWith(
      'bsp_exchange_rates',
      expect.any(String),
      { expirationTtl: 21600 }
    );
  });

  it('needs a weather key only when initializing an empty cache', async () => {
    const noKey = { ...env, OPENWEATHERMAP_API_KEY: undefined };
    expect((await call('/api/weather', 'GET', noKey)).status).toBe(200);
    weatherKV.get.mockResolvedValueOnce(null);
    expect((await call('/api/weather', 'GET', noKey)).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['/api/weather', '/api/forex'])(
    'rejects provider redirects at %s',
    async path => {
      weatherKV.get.mockResolvedValue(null);
      forexKV.get.mockResolvedValue(null);
      fetchMock.mockImplementation(
        async () =>
          new Response(null, {
            status: 302,
            headers: { Location: 'https://other.example' },
          })
      );
      expect((await call(path)).status).toBe(502);
      for (const [, init] of fetchMock.mock.calls)
        expect(init?.redirect).toBe('manual');
      expect(weatherKV.put).not.toHaveBeenCalled();
      expect(forexKV.put).not.toHaveBeenCalled();
    }
  );

  it.each(['/api/weather', '/api/forex'])(
    'does not cache failed provider data for %s',
    async path => {
      weatherKV.get.mockResolvedValue(null);
      forexKV.get.mockResolvedValue(null);
      fetchMock.mockImplementation(
        async () => new Response('private provider failure', { status: 503 })
      );
      const response = await call(path);
      expect(response.status).toBe(502);
      expect(await response.text()).not.toContain('private');
      expect(weatherKV.put).not.toHaveBeenCalled();
      expect(forexKV.put).not.toHaveBeenCalled();
    }
  );

  it.each(['/api/weather', '/api/forex'])(
    'rejects an empty provider result for %s',
    async path => {
      weatherKV.get.mockResolvedValue(null);
      forexKV.get.mockResolvedValue(null);
      fetchMock.mockImplementation(async () => Response.json({ value: [] }));
      expect((await call(path)).status).toBe(502);
      expect(weatherKV.put).not.toHaveBeenCalled();
      expect(forexKV.put).not.toHaveBeenCalled();
    }
  );

  it('refreshes both namespaces on the scheduled event without discarding a temporarily unavailable city', async () => {
    fetchMock.mockImplementation(async input => {
      const url = new URL(String(input));
      if (url.hostname === 'www.bsp.gov.ph') return Response.json(bsp);
      if (url.searchParams.get('lat') === '10.3157')
        return new Response('', { status: 503 });
      return Response.json({ main: { temp: 32 } });
    });
    await worker.scheduled({} as ScheduledController, env);
    const refreshedWeather = JSON.parse(weatherKV.put.mock.calls[0][1]);
    expect(refreshedWeather.manila.main.temp).toBe(32);
    expect(refreshedWeather.cebu).toEqual(weather.cebu);
    expect(forexKV.put).toHaveBeenCalledWith(
      'bsp_exchange_rates',
      expect.any(String),
      { expirationTtl: 21600 }
    );
  });

  it('keeps existing data and still refreshes forex when weather fails', async () => {
    fetchMock.mockImplementation(async input =>
      new URL(String(input)).hostname === 'www.bsp.gov.ph'
        ? Response.json(bsp)
        : new Response('', { status: 503 })
    );
    await worker.scheduled({} as ScheduledController, env);
    expect(weatherKV.put).not.toHaveBeenCalled();
    expect(forexKV.put).toHaveBeenCalledOnce();
  });
});
