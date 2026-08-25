// Create a cache for API responses
type ApiCache = {
  [url: string]: {
    data?: unknown;
    timestamp?: number;
    promise?: Promise<unknown>;
  };
};

const apiCache: ApiCache = {};

/**
 * Fetch data from an API with caching
 * @param url The URL to fetch data from
 * @param cacheDuration Duration in milliseconds to cache the data (default: 1 hour)
 * @returns The fetched data
 */
export const fetchWithCache = (url: string, cacheDuration = 60 * 60 * 1000) => {
  const now = Date.now();

  // Check if we have a cached response and it's still valid
  if (
    apiCache[url]?.data &&
    apiCache[url]?.timestamp &&
    now - apiCache[url].timestamp < cacheDuration
  ) {
    return apiCache[url].data;
  }

  // If no cache or expired, fetch new data
  // If a request is already in progress, wait for it
  if (apiCache[url]?.promise) {
    return apiCache[url].promise;
  }

  // Create a new request and store the promise immediately
  const promise = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response.json();
    })
    .then(data => {
      apiCache[url] = {
        data,
        timestamp: Date.now(),
      };

      return data;
    })
    .catch(error => {
      delete apiCache[url];
      throw error;
    });

  apiCache[url] = {
    promise,
  };

  return promise;
};
