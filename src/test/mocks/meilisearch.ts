import { vi } from 'vitest'

// Mock MeiliSearch client
vi.mock('@meilisearch/instant-meilisearch', () => ({
  instantMeiliSearch: () => ({
    searchClient: {
      search: vi.fn().mockResolvedValue({
        results: [{
          hits: [],
          nbHits: 0,
          page: 0,
          nbPages: 0,
          hitsPerPage: 20,
          processingTimeMS: 1,
        }]
      })
    }
  })
}))

// Mock react-instantsearch to prevent errors
vi.mock('react-instantsearch', () => ({
  InstantSearch: ({ children }: any) => children,
  Configure: () => null,
  SearchBox: () => null,
  Hits: () => null,
  Pagination: () => null,
  RefinementList: () => null,
  ClearRefinements: () => null,
  CurrentRefinements: () => null,
  HierarchicalMenu: () => null,
  Highlight: () => null,
  Menu: () => null,
  PoweredBy: () => null,
  RangeInput: () => null,
  SearchBoxProps: () => null,
  SortBy: () => null,
  Stats: () => null,
  ToggleRefinement: () => null,
  useInstantSearch: () => ({
    results: {
      hits: [],
      nbHits: 0,
    },
    status: 'idle',
  }),
  useSearchBox: () => ({
    query: '',
    refine: vi.fn(),
  }),
}))