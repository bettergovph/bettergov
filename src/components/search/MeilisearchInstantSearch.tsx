import { useState, useEffect, useRef, FC } from 'react';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Highlight,
  Snippet,
  Configure,
  Stats,
} from 'react-instantsearch';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import 'instantsearch.css/themes/satellite.css'; // Or your preferred theme
import './MeilisearchInstantSearch.css'; // For custom styles

interface SearchHit {
  objectID: string;
  name?: string;
  office_name?: string;
  office?: string;
  service?: string;
  description?: string;
  website?: string;
  url?: string;
  category?: string | { name: string };
  subcategory?: string | { name: string };
  address?: string;
  slug?: string;
}

const MEILISEARCH_HOST =
  import.meta.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = import.meta.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_SEARCH_API_KEY =
  import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY ||
  'your_public_search_key_here';

const { searchClient } = instantMeiliSearch(
  `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  MEILISEARCH_SEARCH_API_KEY,
  {
    primaryKey: 'slug',
    keepZeroFacets: true,
    meiliSearchParams: {
      attributesToHighlight: [
        'name',
        'office_name',
        'office',
        'service',
        'description',
      ],
      // highlightPreTag: '<em>',
      // highlightPostTag: '</em>',
      attributesToSearchOn: [
        'name',
        'office_name',
        'office',
        'service',
        'website',
        'description',
        'category',
        'subcategory',
        'address',
      ],
    },
  }
);

interface HitProps {
  hit: {
    // [key: string]: any // Allow any string keys for hit attributes
    // objectID: string
    name?: string;
    office_name?: string;
    office?: string;
    service?: string;
    website?: string;
    category?:
      | string
      | {
          name: string;
          slug: string;
        };
    address?: string;
    subcategory?:
      | string
      | {
          name: string;
          slug: string;
        };
    description?: string;
    slug?: string;
    url?: string;
    // Add other fields you expect in your search results
  };
}

const Hit: FC<HitProps> = ({ hit }) => {
  const title = hit.service || hit.name || hit.office_name || hit.office;
  const link = hit.url || `/directory/${hit.slug}`;

  return (
    <article className='hit-item p-4 border-b border-gray-200 hover:bg-gray-50'>
      <a
        href={link}
        target='_blank'
        rel='noopener noreferrer'
        className='block'
      >
        <h2 className='text-lg font-semibold text-blue-600 hover:underline'>
          {title}
          {/* <Highlight
            attribute={
              hit.service
                ? 'service'
                : hit.name
                ? 'name'
                : hit.office_name
                ? 'office_name'
                : 'office'
            }
            hit={hit as SearchHit}
          /> */}
        </h2>
        {hit.description && (
          <p className='text-sm text-gray-800 mt-1'>
            <Snippet attribute='description' hit={hit as SearchHit} />
          </p>
        )}
        <div className='text-xs text-gray-800'>
          {hit.category && (
            <span>
              <Highlight
                attribute={hit.category?.name ? 'category.name' : 'category'}
                hit={hit as SearchHit}
              />
              {' > '}
            </span>
          )}
          {hit.subcategory && (
            <span>
              <Highlight
                attribute={
                  hit.subcategory?.name ? 'subcategory.name' : 'subcategory'
                }
                hit={hit as SearchHit}
              />{' '}
            </span>
          )}
          {hit.address && (
            <span>
              <Highlight attribute='address' hit={hit as SearchHit} />
              {' > '}
            </span>
          )}
        </div>
        {(hit.url || hit.website) && (
          <p className='text-xs text-blue-500 mt-1 truncate'>
            {hit.url || hit.website}
          </p>
        )}
      </a>
    </article>
  );
};

const MeilisearchInstantSearch: FC = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setHasInteracted(false);
      }
    };

    // Handle escape key press to close search results
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHasInteracted(false);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [setHasInteracted]);

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName='bettergov'
      initialUiState={{
        bettergov: {
          query: undefined,
          hitsPerPage: 4,
        },
      }}
    >
      <Configure hitsPerPage={10} />
      <div className='ais-InstantSearch rounded-lg'>
        <div className='mb-2 w-full' ref={searchContainerRef}>
          <SearchBox
            placeholder='Search for services, directory items...'
            className='w-full'
            onFocus={() => setHasInteracted(true)}
            classNames={{
              root: 'mb-2',
              form: 'relative',
              input:
                'w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition duration-150 ease-in-out',
              submit:
                'absolute top-0 right-0 h-full px-3 text-gray-800 hover:text-blue-600',
              reset:
                'absolute top-0 right-8 h-full px-3 text-gray-400 hover:text-gray-800',
            }}
          />

          {hasInteracted && (
            <div className='bg-white rounded-lg shadow-sm overflow-y-scroll h-96 absolute z-30 w-[calc(100%-2rem)] max-w-[calc(100%-4rem)] lg:w-1/2'>
              <Stats
                classNames={{
                  root: 'text-sm text-gray-800 p-2 text-right text-xs',
                }}
              />
              <Hits
                hitComponent={Hit}
                className='w-full'
                classNames={{
                  list: 'w-full p-0',
                  item: 'w-full  py-0 px-0 border-none',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </InstantSearch>
  );
};

export default MeilisearchInstantSearch;
