/**
 * Forex endpoint that queries the KV store directly
 * This endpoint is a simplified version that only reads from KV
 */

import { Env } from './types';
import { validateDataRequest } from './lib/data-request';

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
  const invalid = validateDataRequest(context.request, 'symbol');
  if (invalid) return invalid;
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
            'Exchange rates are refreshed automatically; try /api/forex to initialize an empty cache',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
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
            },
          }
        );
      }
    }

    // Return all data if no symbol specified
    return new Response(JSON.stringify(cachedData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Exchange rate service temporarily unavailable',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
