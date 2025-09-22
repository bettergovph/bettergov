import { Env } from '../types';
import { fetchAndSaveContent, setDefaultCrawler } from '../lib/crawler';

/**
 * Handler for HTTP requests to the web crawling endpoint
 * This is a generic interface for crawling web content, currently using Jina.ai
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}): Promise<Response> {
  const { request, env } = context;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const forceUpdate = url.searchParams.get('force') === 'true';
    const crawler = url.searchParams.get('crawler'); // 'jina' or 'cfbrowser'

    // Set default crawler if specified
    if (crawler) {
      try {
        setDefaultCrawler(crawler);
      } catch {
        console.warn(`Invalid crawler type: ${crawler}, using default`);
      }
    }

    // Check if URL parameter is provided
    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing URL parameter',
          usage: 'Add ?url=https://example.com to fetch content',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // If force update is requested, fetch it
    if (forceUpdate) {
      const result = await fetchAndSaveContent(env, targetUrl, crawler);

      if (!result.success) {
        // Return the response with CORS headers
        return new Response(
          JSON.stringify({
            ...result,
            crawler: crawler || 'default',
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

      return new Response(
        JSON.stringify({
          ...result.data,
          source: 'crawler',
          crawler: crawler || 'default',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        status: 'error',
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
