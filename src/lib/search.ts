import {
  instantMeiliSearch,
  type InstantMeiliSearchOptions,
} from '@meilisearch/instant-meilisearch';
import type { SearchClient } from 'instantsearch.js';

export const SEARCH_PROXY_PATH = '/api/search';

/** The Worker holds the search-only key; the browser always uses its own origin. */
export function createSearchClient(options: InstantMeiliSearchOptions = {}) {
  const client = instantMeiliSearch(
    new URL(SEARCH_PROXY_PATH, window.location.origin).href,
    '',
    options
  );
  // The adapter implements InstantSearch's client contract; its published type
  // still references an older InstantSearch default export.
  return {
    ...client,
    searchClient: client.searchClient as unknown as SearchClient,
  };
}
