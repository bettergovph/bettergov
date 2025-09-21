import { Env } from '../types';

// BSP API endpoint for exchange rates
const BSP_URL =
  "https://www.bsp.gov.ph/_api/web/lists/getByTitle('Exchange%20Rate')/items?$select=*&$filter=Group%20eq%20%271%27&$orderby=Ordering%20asc";

// Interface for BSP API response item
interface BSPRateItem {
  Title: string;
  Unit: string;
  Symbol: string;
  EURequivalent: string;
  USDequivalent: string;
  PHPequivalent: string;
  CountryCode: string;
  PublishedDate: string;
}

// Interface for processed rate item
interface ProcessedRateItem {
  country: string;
  currency: string;
  symbol: string;
  euroEquivalent: number;
  usdEquivalent: number;
  phpEquivalent: number;
  countryCode: string;
  publishedDate: string;
}

// Interface for processed forex data
interface ProcessedForexData {
  metadata: {
    source: string;
    fetchedAt: string;
    url: string;
  };
  rates: ProcessedRateItem[];
}

// Interface for BSP API response
interface BSPApiResponse {
  value: BSPRateItem[];
}

// Core function to fetch currency exchange rates
async function fetchForexData(): Promise<ProcessedForexData> {
  try {
    // Fetch exchange rate data
    const response = await fetch(BSP_URL, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch BSP data: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as BSPApiResponse;

    // Process the data to make it more usable
    const processedData: ProcessedForexData = {
      metadata: {
        source: 'Bangko Sentral ng Pilipinas',
        fetchedAt: new Date().toISOString(),
        url: 'https://www.bsp.gov.ph/SitePages/Statistics/ExchangeRate.aspx',
      },
      rates: data.value.map((item: BSPRateItem) => ({
        country: item.Title,
        currency: item.Unit,
        symbol: item.Symbol,
        euroEquivalent: parseFloat(item.EURequivalent),
        usdEquivalent: parseFloat(item.USDequivalent),
        phpEquivalent: parseFloat(item.PHPequivalent),
        countryCode: item.CountryCode,
        publishedDate: item.PublishedDate,
      })),
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching forex data:', error);
    throw error;
  }
}

// Function for direct API access
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');
  const forceUpdate = url.searchParams.get('update') === 'true';

  try {
    // Always fetch fresh data if update=true is specified
    if (forceUpdate) {
      // Fetch fresh forex data
      const forexData = await fetchForexData();

      // Store the data in KV
      await env.FOREX_KV.put('bsp_exchange_rates', JSON.stringify(forexData), {
        expirationTtl: 3600, // Expire after 1 hour
      });

      // Filter by symbol if specified
      if (symbol) {
        const upperSymbol = symbol.toUpperCase();
        const filteredRates = forexData.rates.filter(
          rate => rate.symbol.toUpperCase() === upperSymbol
        );

        if (filteredRates.length > 0) {
          return new Response(
            JSON.stringify({
              metadata: forexData.metadata,
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
        }
      }

      // Return all data if no symbol specified or no match found
      return new Response(JSON.stringify(forexData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600',
        },
      });
    }

    // Try to get cached data first
    const cachedData = await env.FOREX_KV.get('bsp_exchange_rates');

    if (cachedData) {
      const parsedData = JSON.parse(cachedData) as ProcessedForexData;

      // If a specific currency symbol is requested, filter the data
      if (symbol) {
        const upperSymbol = symbol.toUpperCase();
        const filteredRates = parsedData.rates.filter(
          rate => rate.symbol.toUpperCase() === upperSymbol
        );

        if (filteredRates.length > 0) {
          return new Response(
            JSON.stringify({
              metadata: parsedData.metadata,
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
        }
      }

      // Return all data if no symbol specified or no match found
      return new Response(cachedData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600',
        },
      });
    }

    // If no cached data, fetch fresh data
    const forexData = await fetchForexData();

    // Store the data in KV
    await env.FOREX_KV.put('bsp_exchange_rates', JSON.stringify(forexData), {
      expirationTtl: 3600, // Expire after 1 hour
    });

    // Filter by symbol if specified
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      const filteredRates = forexData.rates.filter(
        rate => rate.symbol.toUpperCase() === upperSymbol
      );

      if (filteredRates.length > 0) {
        return new Response(
          JSON.stringify({
            metadata: forexData.metadata,
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
      }
    }

    return new Response(JSON.stringify(forexData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
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

export async function scheduled(
  controller: ScheduledController,
  env: Env
) {
  try {
    // Fetch forex data
    const forexData = await fetchForexData();

    // Store the data in Cloudflare KV
    await env.FOREX_KV.put('bsp_exchange_rates', JSON.stringify(forexData), {
      expirationTtl: 3600 * 6, // Expire after 6 hours
    });

    return {
      success: true,
      message: `Exchange rate data updated for ${forexData.rates.length} currencies`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in forex scheduled function:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
