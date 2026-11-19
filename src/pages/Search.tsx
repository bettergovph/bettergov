import { FC, useEffect, useState } from 'react';
import {
  InstantSearch,
  Highlight,
  Snippet,
  useSearchBox,
  useRefinementList,
  usePagination,
  useHits,
  useStats,
  useClearRefinements,
} from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import { createSearchClient } from '../lib/search';
import {
  resolveHitLink,
  typeFacetLabel,
  typeFlagLabel,
} from '../lib/searchResults';
import { withSitePages } from '../lib/siteSearch';
import { buildSitePages } from '../lib/sitePages';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';

import Container from '../components/v2/ui/Container';
import Eyebrow from '../components/v2/ui/Eyebrow';
import BigSearch from '../components/v2/ui/BigSearch';
import Flag from '../components/v2/ui/Flag';
import FilterSection from '../components/v2/ui/FilterSection';
import PageMasthead from '../components/v2/layout/PageMasthead';
import { cn } from '../lib/utils';

// ─── Meilisearch client, plus BETTERGOV.PH's own pages (see siteSearch.ts) ─────────

const { searchClient: indexClient } = createSearchClient({
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
    // Services store category and subcategory as { name, slug } objects;
    // Meilisearch only searches their names when the nested paths are
    // listed. Without them "weather" found 1 service instead of 10.
    attributesToSearchOn: [
      'name',
      'office_name',
      'office',
      'service',
      'website',
      'description',
      'category',
      'category.name',
      'subcategory',
      'subcategory.name',
      'address',
    ],
  },
});

const searchClient = withSitePages(indexClient, buildSitePages);

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchHit = {
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
  type?: string;
  [key: string]: unknown;
};

// ─── BigSearch wired to InstantSearch's search box ───────────────────────────

/**
 * `?q=` is the source of truth for the query: the header search box links
 * here with it, and typing on this page rewrites it (replacing the history
 * entry), so a results page can be shared or reloaded.
 */
const SearchBoxBridge: FC = () => {
  const { query, refine } = useSearchBox();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [localQuery, setLocalQuery] = useState(query);

  // A new ?q= while this page is open — e.g. a second search from the header.
  useEffect(() => {
    if (urlQuery !== query) refine(urlQuery);
    // Only a URL change should push into InstantSearch; typing goes the
    // other way through handleChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  useEffect(() => setLocalQuery(query), [query]);

  const handleChange = (v: string) => {
    setLocalQuery(v);
    refine(v);
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (v) next.set('q', v);
        else next.delete('q');
        return next;
      },
      { replace: true }
    );
  };

  return (
    <BigSearch
      value={localQuery}
      onChange={handleChange}
      onSubmit={() => refine(localQuery)}
      placeholder='What do you need? — e.g. passport, SSS, NBI clearance'
      ariaLabel='Search BETTERGOV.PH'
      ctaLabel='Search'
      onDark
    />
  );
};

// ─── Left-rail refinement list ────────────────────────────────────────────────

const EditorialRefinementList: FC<{
  attribute: string;
  label: string;
  formatLabel?: (value: string) => string;
}> = ({ attribute, label, formatLabel }) => {
  const { items: allItems, refine } = useRefinementList({
    attribute,
    limit: 20,
    sortBy: ['count:desc'],
  });
  // keepZeroFacets lists every value, mostly at 0. Show only values with
  // matches, plus a selected one so it can still be cleared.
  const items = allItems.filter(item => item.count > 0 || item.isRefined);

  if (items.length === 0) return null;

  return (
    <FilterSection label={label}>
      <div className='flex flex-col'>
        {items.map(item => (
          <button
            key={item.value}
            type='button'
            onClick={() => refine(item.value)}
            className={cn(
              'flex items-center justify-between gap-2 border-b border-ed-rule py-2 text-left text-sm transition-colors hover:text-ed-navy',
              item.isRefined ? 'font-semibold text-ed-ink' : 'text-ed-ink-2'
            )}
          >
            <span>{formatLabel ? formatLabel(item.value) : item.label}</span>
            <span className='font-mono-ed text-[11px] text-ed-ink-4'>
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </FilterSection>
  );
};

// ─── "Clear all" button (search + refinements) ────────────────────────────────

const ClearAllButton: FC<{ className?: string }> = ({ className }) => {
  const { refine: clearSearch, query } = useSearchBox();
  const { canRefine, refine: clearRefinements } = useClearRefinements();

  if (!query && !canRefine) return null;

  return (
    <button
      type='button'
      onClick={() => {
        clearSearch('');
        clearRefinements();
      }}
      className={cn(
        'font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy hover:text-ed-red',
        className
      )}
    >
      Clear filters
    </button>
  );
};

// ─── Results count + active query label ──────────────────────────────────────

const EditorialResultsHeader: FC = () => {
  const { nbHits, query } = useStats();

  return (
    <div className='flex items-center justify-between border-b border-ed-ink pb-3.5'>
      <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
        <strong className='text-sm text-ed-ink'>
          {nbHits.toLocaleString()}
        </strong>{' '}
        result{nbHits === 1 ? '' : 's'}
        {query ? (
          <>
            {' '}
            for{' '}
            <em className='not-italic text-ed-ink'>&ldquo;{query}&rdquo;</em>
          </>
        ) : null}
      </div>
      <ClearAllButton />
    </div>
  );
};

// ─── Editorial hit rows ───────────────────────────────────────────────────────

const EditorialHits: FC = () => {
  const { hits } = useHits<SearchHit>();
  const { query } = useSearchBox();

  if (hits.length === 0) {
    return (
      <div className='py-20 text-center'>
        {query ? (
          <>
            <div className='font-serif-ed text-[28px] text-ed-ink-2'>
              No results found.
            </div>
            <p className='mt-2 text-sm text-ed-ink-3'>
              Try a different term or clear the filters.
            </p>
          </>
        ) : (
          <div className='font-serif-ed text-[28px] text-ed-ink-2'>
            Start typing to search.
          </div>
        )}
      </div>
    );
  }

  return (
    <ul className='divide-y divide-ed-rule' role='list'>
      {hits.map((hit, i) => {
        const titleAttr = hit.service
          ? 'service'
          : hit.name
            ? 'name'
            : hit.office_name
              ? 'office_name'
              : 'office';

        const { href, external } = resolveHitLink(hit);

        // Site pages name their section ("Philippines", "Department").
        const categoryName =
          hit.category != null && typeof hit.category === 'object'
            ? (hit.category as { name: string }).name
            : ((hit.category as string | undefined) ??
              (hit.section as string | undefined));

        const typeName = hit.type as string | undefined;
        const sourceUrl = external
          ? (hit.website as string | undefined) ||
            (hit.url as string | undefined)
          : `www.gov.ph${href}`;

        const rowClass =
          'grid grid-cols-[48px_1fr] gap-6 py-7 text-ed-ink no-underline hover:bg-ed-paper-2/50 max-md:gap-4 max-md:py-5';
        const row = (
          <>
            <div className='pt-1 font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-4'>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div>
              <div className='flex flex-wrap items-baseline gap-3'>
                {typeName && (
                  <Flag variant='navy'>{typeFlagLabel(typeName)}</Flag>
                )}
                {categoryName && (
                  <span className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    {categoryName}
                  </span>
                )}
              </div>
              <h3 className='mt-2.5 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-ink max-md:text-[18px]'>
                <Highlight
                  attribute={titleAttr}
                  hit={hit as unknown as Hit<Record<string, string>>}
                  classNames={{
                    highlighted: 'bg-ed-navy-tint text-ed-navy-ink not-italic',
                    nonHighlighted: '',
                  }}
                />
              </h3>
              {hit.description && (
                <p className='mt-1.5 max-w-[620px] text-sm leading-normal text-ed-ink-2 [&_mark]:bg-ed-navy-tint [&_mark]:text-ed-navy-ink'>
                  <Snippet
                    attribute='description'
                    hit={hit as unknown as Hit<Record<string, string>>}
                    classNames={{
                      highlighted:
                        'bg-ed-navy-tint text-ed-navy-ink not-italic',
                      nonHighlighted: '',
                    }}
                  />
                </p>
              )}
              {sourceUrl && (
                <p className='mt-2 break-all font-mono-ed text-[11px] tracking-[0.04em] text-ed-ink-4'>
                  {sourceUrl}
                </p>
              )}
            </div>
          </>
        );

        return (
          <li key={hit.objectID} role='listitem'>
            {external ? (
              <a
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className={rowClass}
              >
                {row}
              </a>
            ) : (
              <Link to={href} className={rowClass}>
                {row}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// ─── Editorial pagination ─────────────────────────────────────────────────────

type PaginationBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

const PaginationBtn: FC<PaginationBtnProps> = ({
  active,
  className,
  ...rest
}) => (
  <button
    type='button'
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center border font-mono-ed text-[11px] transition-colors',
      active
        ? 'border-ed-navy bg-ed-navy text-white'
        : rest.disabled
          ? 'cursor-not-allowed border-ed-rule text-ed-ink-4'
          : 'border-ed-rule-strong text-ed-ink-2 hover:border-ed-navy hover:text-ed-navy',
      className
    )}
    {...rest}
  />
);

const EditorialPagination: FC = () => {
  const { currentRefinement, nbPages, pages, refine, isFirstPage, isLastPage } =
    usePagination({ padding: 2 });

  if (nbPages <= 1) return null;

  return (
    <div className='mt-8 border-t border-ed-rule pt-6'>
      <div className='mb-3'>
        <Eyebrow>
          page {currentRefinement + 1} of {nbPages}
        </Eyebrow>
      </div>
      <div className='flex flex-wrap items-center gap-1'>
        <PaginationBtn
          onClick={() => refine(currentRefinement - 1)}
          disabled={isFirstPage}
          aria-label='Previous page'
        >
          ‹
        </PaginationBtn>
        {pages.map(page => (
          <PaginationBtn
            key={page}
            onClick={() => refine(page)}
            active={page === currentRefinement}
            aria-current={page === currentRefinement ? 'page' : undefined}
          >
            {page + 1}
          </PaginationBtn>
        ))}
        <PaginationBtn
          onClick={() => refine(currentRefinement + 1)}
          disabled={isLastPage}
          aria-label='Next page'
        >
          ›
        </PaginationBtn>
      </div>
    </div>
  );
};

// ─── Page component ───────────────────────────────────────────────────────────

const SearchPage: FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  // Read once: InstantSearch only applies initialUiState on mount, and
  // SearchBoxBridge follows later ?q= changes itself.
  const [initialQuery] = useState(() => searchParams.get('q') ?? '');

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Search — BETTERGOV.PH</title>
        <meta
          name='description'
          content='Search Philippine government services, offices, and resources in one place.'
        />
      </Helmet>

      <InstantSearch
        searchClient={searchClient}
        indexName='bettergov'
        initialUiState={{ bettergov: { query: initialQuery } }}
      >
        {/* Navy-gradient masthead with BigSearch */}
        <PageMasthead
          title='Search BETTERGOV.PH'
          lede='Official Philippine government services, offices, and resources — across every agency, searchable in one place.'
          variant='hero'
        >
          <div className='max-w-2xl'>
            <SearchBoxBridge />
          </div>
        </PageMasthead>

        {/* Filters + Results */}
        <section className='py-10 max-md:py-6'>
          <Container>
            {/* Mobile filter toggle */}
            <div className='mb-6 md:hidden'>
              <button
                type='button'
                onClick={() => setSidebarOpen(o => !o)}
                aria-expanded={sidebarOpen}
                aria-controls='search-sidebar'
                className='inline-flex w-full items-center justify-between border border-ed-rule bg-white px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink'
              >
                <span>Refine results</span>
                {sidebarOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
              </button>
            </div>

            <div className='grid grid-cols-[260px_1fr] gap-12 max-lg:gap-8 max-md:grid-cols-1 max-md:gap-6'>
              {/* Left-rail filters */}
              <aside
                id='search-sidebar'
                className={cn(
                  'border-t border-ed-ink pt-5 max-md:pt-4',
                  sidebarOpen ? 'block' : 'hidden md:block'
                )}
                aria-label='Search filters'
              >
                <div className='mb-4 flex items-center justify-between'>
                  <Eyebrow>Refine</Eyebrow>
                  <ClearAllButton className='text-[10px]' />
                </div>

                <EditorialRefinementList
                  attribute='type'
                  label='Type'
                  formatLabel={typeFacetLabel}
                />
                {/* Nested paths: a facet on the { name, slug } object itself
                    is always empty, which hid both lists. */}
                <EditorialRefinementList
                  attribute='category.name'
                  label='Category'
                />
                <EditorialRefinementList
                  attribute='subcategory.name'
                  label='Subcategory'
                />
              </aside>

              {/* Results column */}
              <div>
                <EditorialResultsHeader />
                <EditorialHits />
                <EditorialPagination />
              </div>
            </div>
          </Container>
        </section>
      </InstantSearch>
    </main>
  );
};

export default SearchPage;
