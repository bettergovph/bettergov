import { Env } from '../types';
import {
  fetchAndSaveContent,
  getContentByUrl,
  setDefaultCrawler,
} from '../lib/crawler';

/**
 * Handler for HTTP requests to the web crawling endpoint
 * This is a generic interface for crawling web content, currently using Jina.ai
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: {};
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
      } catch (error) {
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

    // Check if we already have this URL in the database and it's not a force update
    // const content = await getContentByUrl(env, targetUrl)

    // if (content) {
    //   // Convert links_summary back to object
    //   let linksSummary = []
    //   try {
    //     if (content.links_summary) {
    //       linksSummary = JSON.parse(content.links_summary)
    //     }
    //   } catch (e) {
    //     console.error('Error parsing links_summary:', e)
    //   }

    //   // Return the cached content
    //   return new Response(
    //     JSON.stringify({
    //       success: true,
    //       data: content,
    //       message: 'Content retrieved from cache',
    //       cached: true,
    //       crawler: crawler || 'default',
    //       links_summary: linksSummary,
    //     }),
    //     {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Access-Control-Allow-Origin': '*',
    //       },
    //     }
    //   )
    // }

    // If we don't have content or force update is requested, fetch it
    // if (!content || forceUpdate) {
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
