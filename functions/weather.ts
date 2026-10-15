/**
 * Weather endpoint that queries the KV store directly
 * This endpoint is a simplified version that only reads from KV
 */

import { Env } from './types';
import { validateDataRequest } from './lib/data-request';

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const invalid = validateDataRequest(context.request, 'city');
  if (invalid) return invalid;
  try {
    const url = new URL(context.request.url);
    const cityParam = url.searchParams.get('city');

    // Get data from KV store
    const cachedData = (await context.env.WEATHER_KV.get(
      'philippines_weather',
      { type: 'json' }
    )) as Record<string, unknown> | null;

    if (!cachedData) {
      return new Response(
        JSON.stringify({
          error: 'No weather data found in KV store',
          message:
            'Weather is refreshed automatically; try /api/weather to initialize an empty cache',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // If city parameter is provided, filter the data
    if (cityParam) {
      const cityKey = cityParam.toLowerCase();
      if (Object.hasOwn(cachedData, cityKey)) {
        return new Response(
          JSON.stringify({ [cityKey]: cachedData[cityKey] }),
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
            error: `No data found for city: ${cityParam}`,
            availableCities: Object.keys(cachedData),
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

    // Return all data if no city specified
    return new Response(JSON.stringify(cachedData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Weather service temporarily unavailable',
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
