/**
 * Weather endpoint that queries the KV store directly
 * This endpoint is a simplified version that only reads from KV
 */

import { Env } from './types';

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const cityParam = url.searchParams.get('city');

    // Get data from KV store
    const cachedData = (await context.env.WEATHER_KV.get(
      'philippines_weather',
      { type: 'json' }
    )) as Record<string, any> | null;

    if (!cachedData) {
      return new Response(
        JSON.stringify({
          error: 'No weather data found in KV store',
          message:
            'Try calling /api/weather?update=true to fetch and store fresh data',
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

    // If city parameter is provided, filter the data
    if (cityParam) {
      const cityKey = cityParam.toLowerCase();
      if (cachedData[cityKey]) {
        return new Response(
          JSON.stringify({ [cityKey]: cachedData[cityKey] }),
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
            error: `No data found for city: ${cityParam}`,
            availableCities: Object.keys(cachedData),
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

    // Return all data if no city specified
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
