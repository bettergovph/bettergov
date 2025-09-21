// Create a cache for API responses
type ApiCache = {
  [url: string]: {
    data: any;
    timestamp: number;
  };
};

const apiCache: ApiCache = {};

/**
 * Fetch data from an API with caching
 * @param url The URL to fetch data from
 * @param cacheDuration Duration in milliseconds to cache the data (default: 1 hour)
 * @returns The fetched data
 */
export const fetchWithCache = async (
  url: string,
  cacheDuration = 60 * 60 * 1000
) => {
  const now = Date.now();

  // Check if we have a cached response and it's still valid
  if (apiCache[url] && now - apiCache[url].timestamp < cacheDuration) {
    return apiCache[url].data;
  }

  // If no cache or expired, fetch new data
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();

  // Cache the new data
  apiCache[url] = {
    data,
    timestamp: now,
  };

  return data;
};
