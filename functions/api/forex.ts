import { Env } from '../types';
import { validateDataRequest } from '../lib/data-request';

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
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: 'application/json;odata=nometadata',
        'User-Agent': 'GOVPH-API/1.0 (+https://www.gov.ph)',
      },
    });

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(
        `Failed to fetch BSP data: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as BSPApiResponse;
    if (!Array.isArray(data.value) || data.value.length === 0) {
      throw new Error('BSP returned no exchange rates');
    }

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

// Read this deployment's KV; fill an empty cache directly from BSP.
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const { request, env } = context;
  const invalid = validateDataRequest(request, 'symbol');
  if (invalid) return invalid;
  const symbol = new URL(request.url).searchParams.get('symbol')?.toUpperCase();
  try {
    let data = await env.FOREX_KV.get<ProcessedForexData>(
      'bsp_exchange_rates',
      { type: 'json' }
    );
    if (!data) {
      data = await fetchForexData();
      await env.FOREX_KV.put('bsp_exchange_rates', JSON.stringify(data), {
        expirationTtl: 3600 * 6,
      });
    }
    const rates = symbol
      ? data.rates.filter(rate => rate.symbol.toUpperCase() === symbol)
      : data.rates;
    if (!rates.length) {
      return Response.json(
        {
          error: 'Unknown currency symbol',
          availableSymbols: data.rates.map(rate => rate.symbol),
        },
        { status: 404 }
      );
    }
    return Response.json({ metadata: data.metadata, rates });
  } catch {
    console.error('[forex] Unable to load exchange rates');
    return Response.json(
      { error: 'Exchange rate service temporarily unavailable' },
      { status: 502 }
    );
  }
}

export async function scheduled(controller: ScheduledController, env: Env) {
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
