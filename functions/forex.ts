/**
 * Forex endpoint that queries the KV store directly
 * This endpoint is a simplified version that only reads from KV
 */

import { Env } from './types';

interface RateItem {
  symbol: string;
  country?: string;
  phpEquivalent?: number;
  [key: string]: unknown;
}

interface ForexCachedData {
  metadata: Record<string, unknown>;
  rates: RateItem[];
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const symbolParam = url.searchParams.get('symbol');

    // Get data from KV store
    const cachedData = (await context.env.FOREX_KV.get('bsp_exchange_rates', {
      type: 'json',
    })) as ForexCachedData | null;

    if (!cachedData) {
      return new Response(
        JSON.stringify({
          error: 'No forex data found in KV store',
          message:
            'Try calling /api/forex?update=true to fetch and store fresh data',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // If symbol parameter is provided, filter the data
    if (symbolParam) {
      const upperSymbol = symbolParam.toUpperCase();
      const filteredRates = cachedData.rates.filter(
        rate => rate.symbol.toUpperCase() === upperSymbol
      );

      if (filteredRates.length > 0) {
        return new Response(
          JSON.stringify({
            metadata: cachedData.metadata,
            rates: filteredRates,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=3600',
            },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            error: `No data found for symbol: ${symbolParam}`,
            availableSymbols: cachedData.rates.map(rate => rate.symbol),
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Return all data if no symbol specified
    return new Response(JSON.stringify(cachedData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        stack: (error as Error).stack,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
