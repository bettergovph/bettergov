import { Env } from '../types';
import { fetchAndSaveContent, setDefaultCrawler } from '../lib/crawler';

/**
 * Validate URL to prevent SSRF and other attacks
 * @param url The URL to validate
 * @returns Whether the URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP/HTTPS protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return false;
    }

    // Prevent localhost and private networks
    const hostname = parsedUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Prevent IP addresses (only allow domain names)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return false;
    }

    // Only allow .gov.ph domains for government services
    if (!hostname.endsWith('.gov.ph')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Handler for HTTP requests to the web crawling endpoint
 * This is a generic interface for crawling web content, currently using Jina.ai
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // CORS and rate limiting are enforced by the Worker entry point.
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
          },
        }
      );
    }

    // Validate URL before processing
    if (!isValidUrl(targetUrl)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid URL',
          message: 'Only .gov.ph domains are allowed for crawling',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // If force update is requested, fetch it
    if (forceUpdate) {
      try {
        const result = await fetchAndSaveContent(env, targetUrl, crawler);

        if (!result.success) {
          // Return the crawler error
          return new Response(
            JSON.stringify({
              ...result,
              crawler: crawler || 'default',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
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
            },
          }
        );
      } catch (error) {
        console.error('Crawl error:', error);
        return new Response(
          JSON.stringify({
            error: 'Crawl operation failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            details:
              'The crawl service may be temporarily unavailable or misconfigured. Please try again later.',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else {
      // Try to get existing content from database
      try {
        const existingContent = await getContentByUrl(env, targetUrl, crawler);

        if (existingContent) {
          return new Response(
            JSON.stringify({
              ...existingContent,
              source: 'database',
              crawler: crawler || 'default',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              error: 'Content not found',
              message:
                'No cached content available for this URL. Use ?force=true to crawl the content.',
              url: targetUrl,
            }),
            {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      } catch (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({
            error: 'Database operation failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: 'The database service may be temporarily unavailable.',
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }
  } catch (error) {
    console.error('Crawl endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Request processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Please check the URL parameter and try again.',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
