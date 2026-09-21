import { ForexRate } from '../types';
import { fetchWithCache } from './api';

// BSP (Bangko Sentral ng Pilipinas) official exchange-rate list, queried
// directly from the browser. BSP serves `Access-Control-Allow-Origin: *`, so
// no proxy/backend is needed. (Their WAF blocks datacenter/worker runtimes but
// allows real browser clients.)
const BSP_FOREX_URL =
  "https://www.bsp.gov.ph/_api/web/lists/getByTitle('Exchange%20Rate')/items?$select=*&$filter=Group%20eq%20%271%27&$orderby=Ordering%20asc";

// Raw item shape returned by the BSP OData API.
interface BSPRateItem {
  Title: string;
  Symbol: string;
  PHPequivalent: string;
}

/**
 * Fetch forex data directly from the BSP exchange-rate API.
 * @param filterSymbols Optional array of currency symbols to filter by
 * @returns Transformed forex data
 */
export const fetchForexData = async (
  filterSymbols?: string[]
): Promise<ForexRate[]> => {
  // BSP's OData API defaults to XML; request JSON explicitly.
  const data = (await fetchWithCache(BSP_FOREX_URL, undefined, {
    headers: { Accept: 'application/json' },
  })) as {
    value: BSPRateItem[];
  };

  // Transform BSP data to match our ForexRate type. BSP occasionally reports
  // "N/A" for a currency (e.g. KWD); parseFloat yields NaN, so we drop those
  // rows rather than render a blank rate.
  let transformedData: ForexRate[] = data.value
    .map(item => ({
      currency: item.Title,
      code: item.Symbol,
      rate: parseFloat(item.PHPequivalent),
    }))
    .filter(rate => Number.isFinite(rate.rate));

  // Filter by symbols if provided
  if (filterSymbols && filterSymbols.length > 0) {
    transformedData = transformedData.filter(rate =>
      filterSymbols.includes(rate.code)
    );
  }

  return transformedData;
};

/**
 * Get currency icon component name based on currency code
 * @param code Currency code
 * @returns Icon component name
 */
export const getCurrencyIconName = (code: string): string => {
  switch (code) {
    case 'USD':
      return 'DollarSign';
    case 'JPY':
      return 'JapaneseYen';
    case 'EUR':
      return 'Euro';
    case 'GBP':
      return 'PoundSterling';
    default:
      return '';
  }
};
