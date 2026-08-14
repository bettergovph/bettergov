// Create a cache for API responses
type ApiCache = {
  [url: string]: {
    data: unknown;
    timestamp: number;
  };
};

const apiCache: ApiCache = {};

const inFlightRequests: { [url: string]: Promise<unknown> } = {};
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

  // If a request for this URL is already in flight, reuse it instead of
  // triggering a duplicate network request.
  if (url in inFlightRequests) {
    return inFlightRequests[url];
  }
  const requestPromise = (async () => {
    try {
      // If no cache or expired, fetch new data
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Cache the new data
      apiCache[url] = {
        data,
        timestamp: Date.now(),
      };

      return data;
    } finally {
      delete inFlightRequests[url];
    }
  })();

  inFlightRequests[url] = requestPromise;

  return requestPromise;
};
