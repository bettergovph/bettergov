// Main entry point for Cloudflare Workers
import {
  scheduled as getWeatherScheduled,
  onRequest as weatherRequest,
} from './api/weather';
import {
  scheduled as getForexScheduled,
  onRequest as forexRequest,
} from './api/forex';
import { onRequest as crawlRequest } from './api/crawl';
import { onRequest as weatherKVRequest } from './weather';
import { onRequest as forexKVRequest } from './forex';
import { onRequest as reportHotlineRequest } from './api/report-hotline';
import {
  onRequest as assistantRequest,
  onRequestStream as assistantStreamRequest,
} from './api/assistant';
import { Env } from './types';

// Export the scheduled handlers
export { scheduled as scheduled_getWeather } from './api/weather';
export { scheduled as scheduled_getForex } from './api/forex';

type BindingName = 'WEATHER_KV' | 'FOREX_KV' | 'BROWSER_KV' | 'BETTERGOV_DB';

/**
 * Bindings are provisioned per Cloudflare account and declared in
 * wrangler.jsonc. A route whose binding is not declared answers a clear
 * 503 here instead of letting its handler throw on `undefined`.
 */
const ROUTE_BINDINGS: Record<string, BindingName[]> = {
  '/api/weather': ['WEATHER_KV'],
  '/weather': ['WEATHER_KV'],
  '/api/forex': ['FOREX_KV'],
  '/forex': ['FOREX_KV'],
  '/api/crawl': ['BROWSER_KV', 'BETTERGOV_DB'],
};

function missingBindings(env: Env, names: BindingName[]): BindingName[] {
  return names.filter(name => !env[name]);
}

function notConfigured(missing: BindingName[]): Response {
  return new Response(
    JSON.stringify({
      error: 'Not configured',
      message: `This route needs the ${missing.join(', ')} binding${
        missing.length > 1 ? 's' : ''
      }, which ${missing.length > 1 ? 'are' : 'is'} not declared for this deployment. See functions/README.md.`,
      missingBindings: missing,
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

// Helper function to add CORS headers to a response
function addCorsHeaders(
  response: Response,
  corsHeaders: Record<string, string>
): Response {
  const newHeaders = new Headers(response.headers);
  Object.keys(corsHeaders).forEach(key => {
    newHeaders.set(key, corsHeaders[key]);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Handler for HTTP requests
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    console.log('Scheduled update');
    if (env.WEATHER_KV) await getWeatherScheduled(controller, env);
    else console.warn('[scheduled] WEATHER_KV not declared; skipping weather');
    if (env.FOREX_KV) await getForexScheduled(controller, env);
    else console.warn('[scheduled] FOREX_KV not declared; skipping forex');
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Add CORS headers to all responses
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Routes backed by a binding this deployment does not declare
    const required = ROUTE_BINDINGS[path];
    if (required) {
      const missing = missingBindings(env, required);
      if (missing.length > 0) {
        return addCorsHeaders(notConfigured(missing), corsHeaders);
      }
    }

    // Route API requests to the appropriate handler
    if (path === '/api/weather') {
      const response = await weatherRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/api/forex') {
      const response = await forexRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    // Handle the new KV-only endpoints
    if (path === '/weather') {
      const response = await weatherKVRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/forex') {
      const response = await forexKVRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/api/crawl') {
      const response = await crawlRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/api/report-hotline') {
      const response = await reportHotlineRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/api/assistant') {
      const response = await assistantRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    if (path === '/api/assistant/stream') {
      const response = await assistantStreamRequest({ request, env, ctx });
      return addCorsHeaders(response, corsHeaders);
    }

    // Simple API to check if the functions are running
    if (path === '/api/status') {
      const response = new Response(
        JSON.stringify({
          status: 'online',
          functions: [
            'weather',
            'forex',
            'crawl',
            'report-hotline',
            'assistant',
          ],
          endpoints: [
            {
              path: '/api/weather',
              description:
                'Get weather data for Philippine cities (fetches from external API)',
              parameters: [
                {
                  name: 'city',
                  required: false,
                  description: 'Specific city to get weather for',
                },
                {
                  name: 'update',
                  required: false,
                  description: 'Set to "true" to force update KV store',
                },
              ],
            },
            {
              path: '/api/forex',
              description:
                'Get currency exchange rates from BSP API (fetches from external API)',
              parameters: [
                {
                  name: 'symbol',
                  required: false,
                  description: 'Filter by currency symbol (e.g., USD)',
                },
                {
                  name: 'update',
                  required: false,
                  description: 'Set to "true" to force update KV store',
                },
              ],
            },
            {
              path: '/weather',
              description:
                'Get weather data from KV store only (no external API calls)',
              parameters: [
                {
                  name: 'city',
                  required: false,
                  description: 'Specific city to get weather for',
                },
              ],
            },
            {
              path: '/forex',
              description:
                'Get forex data from KV store only (no external API calls)',
              parameters: [
                {
                  name: 'symbol',
                  required: false,
                  description: 'Filter by currency symbol (e.g., USD)',
                },
              ],
            },
            {
              path: '/api/crawl',
              description:
                'Get content from a URL using web crawler and store in D1 database',
              parameters: [
                {
                  name: 'url',
                  required: true,
                  description: 'URL to fetch content from',
                },
                {
                  name: 'update',
                  required: false,
                  description: 'Set to "true" to force update from crawler',
                },
              ],
            },
            {
              path: '/api/report-hotline',
              description:
                'Submit a report about outdated hotline information (creates GitHub issue)',
              method: 'POST',
              parameters: [
                {
                  name: 'hotlineName',
                  required: true,
                  description: 'Name of the hotline with outdated information',
                },
                {
                  name: 'issue',
                  required: true,
                  description: 'Description of what is incorrect',
                },
                {
                  name: 'correctInfo',
                  required: false,
                  description: 'The correct information if known',
                },
                {
                  name: 'source',
                  required: false,
                  description: 'Link to official source',
                },
                {
                  name: 'reporterEmail',
                  required: false,
                  description: 'Contact email of the reporter',
                },
              ],
            },
            {
              path: '/api/assistant',
              description:
                'Ask the eGovAI "govph" engine a question (single JSON answer)',
              method: 'POST',
              parameters: [
                {
                  name: 'question',
                  required: true,
                  description: 'The question to ask',
                },
                {
                  name: 'session_id',
                  required: false,
                  description:
                    'Session returned by a previous answer, to keep context',
                },
                {
                  name: 'confirmation',
                  required: false,
                  description:
                    '{ token, approved: true } to approve a pending_confirmation',
                },
              ],
            },
            {
              path: '/api/assistant/stream',
              description:
                'Same as /api/assistant but streams progress, chunk and complete events over Server-Sent Events',
              method: 'POST',
              parameters: [
                {
                  name: 'question',
                  required: true,
                  description: 'The question to ask',
                },
                {
                  name: 'session_id',
                  required: false,
                  description:
                    'Session returned by a previous answer, to keep context',
                },
                {
                  name: 'confirmation',
                  required: false,
                  description:
                    '{ token, approved: true } to approve a pending_confirmation',
                },
              ],
            },
          ],
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return addCorsHeaders(response, corsHeaders);
    }

    // Return 404 for any other routes
    const response = new Response(
      JSON.stringify({
        error: 'Not found',
        availableEndpoints: [
          '/api/status',
          '/api/weather',
          '/api/forex',
          '/api/crawl',
          '/api/report-hotline',
          '/api/assistant',
          '/api/assistant/stream',
          '/weather',
          '/forex',
        ],
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return addCorsHeaders(response, corsHeaders);
  },
};
