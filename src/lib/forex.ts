import { ForexRate } from '../types';
import { fetchWithCache } from './api';

/**
 * Fetch forex data from the API
 * @param filterSymbols Optional array of currency symbols to filter by
 * @returns Transformed forex data
 */
export const fetchForexData = async (
  filterSymbols?: string[]
): Promise<ForexRate[]> => {
  const data = await fetchWithCache('https://api.bettergov.ph/forex');

  // Transform API data to match our ForexRate type
  let transformedData: ForexRate[] = data.rates.map(
    (rate: { country: string; symbol: string; phpEquivalent: number }) => ({
      currency: rate.country,
      code: rate.symbol,
      rate: rate.phpEquivalent,
    })
  );

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
