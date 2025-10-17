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
 * Simple rate limiting using KV storage
 * @param env Environment variables
 * @param clientIP Client IP address
 * @returns Whether request is allowed
 */
async function checkRateLimit(env: Env, clientIP: string): Promise<boolean> {
  const rateLimitKey = `rate_limit:${clientIP}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute

  try {
    const kv = env.BROWSER_KV;
    const existing = await kv.get(rateLimitKey);

    if (!existing) {
      // First request from this IP
      await kv.put(
        rateLimitKey,
        JSON.stringify({
          count: 1,
          resetTime: now + windowMs,
        }),
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );
      return true;
    }

    const data = JSON.parse(existing);

    if (now > data.resetTime) {
      // Window expired, reset
      await kv.put(
        rateLimitKey,
        JSON.stringify({
          count: 1,
          resetTime: now + windowMs,
        }),
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );
      return true;
    }

    if (data.count >= maxRequests) {
      return false; // Rate limited
    }

    // Increment count
    data.count++;
    await kv.put(rateLimitKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow request if rate limit fails
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

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
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
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Check rate limit
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitAllowed = await checkRateLimit(env, clientIP);

    if (!rateLimitAllowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Maximum 10 requests per minute per IP address',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Retry-After': '60', // Retry after 60 seconds
          },
        }
      );
    }

    // If force update is requested, fetch it
    if (forceUpdate) {
      try {
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
              'Access-Control-Allow-Origin': '*',
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
                'Access-Control-Allow-Origin': '*',
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
                'Access-Control-Allow-Origin': '*',
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
              'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
