import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, MenuIcon, XIcon } from 'lucide-react';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { Helmet } from 'react-helmet-async';

import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import BigSearch from '../../components/v2/ui/BigSearch';
import Flag from '../../components/v2/ui/Flag';
import FilterSection from '../../components/v2/ui/FilterSection';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import { cn } from '../../lib/utils';
import { smoothScrollToElement } from '@/lib/scrollUtils';

import serviceCategories from '../../data/service_categories.json';
import businessTradeServices from '../../data/services/business-trade.json';
import certificatesIdsServices from '../../data/services/certificates-ids.json';
import contributionsServices from '../../data/services/contributions.json';
import disasterWeatherServices from '../../data/services/disaster-weather.json';
import educationServices from '../../data/services/education.json';
import employmentServices from '../../data/services/employment.json';
import healthServices from '../../data/services/health.json';
import housingServices from '../../data/services/housing.json';
import passportTravelServices from '../../data/services/passport-travel.json';
import socialServices from '../../data/services/social-services.json';
import taxServices from '../../data/services/tax.json';
import transportDrivingServices from '../../data/services/transport-driving.json';
import uncategorizedServices from '../../data/services/uncategorized.json';

const allServices = [
  ...businessTradeServices,
  ...certificatesIdsServices,
  ...contributionsServices,
  ...disasterWeatherServices,
  ...educationServices,
  ...employmentServices,
  ...healthServices,
  ...housingServices,
  ...passportTravelServices,
  ...socialServices,
  ...taxServices,
  ...transportDrivingServices,
  ...uncategorizedServices,
];

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

const ITEMS_PER_PAGE = 16;

/** DOM id used for the results section; category changes scroll here. */
const RESULTS_ANCHOR = 'services-results';

export default function ServicesPage() {
  const [
    { category: selectedCategorySlug, subcategory: selectedSubcategorySlug },
    setQueryParams,
  ] = useQueryStates({
    category: parseAsString.withDefault('all'),
    subcategory: parseAsString.withDefault('all'),
  });
  const [searchQuery, setSearchQuery] = useQueryState('search', {
    defaultValue: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const selectedCategory = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return (serviceCategories.categories as Category[]).find(
      cat => cat.slug === selectedCategorySlug
    );
  }, [selectedCategorySlug]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory || selectedSubcategorySlug === 'all') return null;
    return selectedCategory.subcategories.find(
      subcat => subcat.slug === selectedSubcategorySlug
    );
  }, [selectedCategory, selectedSubcategorySlug]);

  const filteredServices = useMemo(() => {
    let filtered = allServices;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        service =>
          service.service.toLowerCase().includes(q) ||
          service.category.name.toLowerCase().includes(q) ||
          service.subcategory.name.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        service => service.category.slug === selectedCategory.slug
      );
      if (selectedSubcategory) {
        filtered = filtered.filter(
          service => service.subcategory.slug === selectedSubcategory.slug
        );
      }
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  const paginatedServices = filteredServices.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  /** Scroll to just below the hero so the user keeps context on filter changes. */
  const scrollToResults = () => {
    smoothScrollToElement(RESULTS_ANCHOR, 24);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query || null);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setCurrentPage(1);
    setQueryParams({
      category: categorySlug === 'all' ? null : categorySlug,
      subcategory: null,
    });
    scrollToResults();
  };

  const handleSubcategoryChange = (subcategorySlug: string) => {
    setCurrentPage(1);
    setQueryParams({
      category: selectedCategorySlug,
      subcategory: subcategorySlug === 'all' ? null : subcategorySlug,
    });
    scrollToResults();
  };

  const handleLoadMore = useCallback(() => {
    if (filteredServices.length <= currentPage * ITEMS_PER_PAGE) return;
    setCurrentPage(prev => prev + 1);
  }, [filteredServices.length, currentPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) handleLoadMore();
      },
      { root: null, rootMargin: '100px', threshold: 0.1 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleLoadMore]);

  const { metaTitle, metaDescription, metaKeywords, canonicalUrl } =
    useMemo(() => {
      const baseTitle = 'Government Services Directory | BetterGov.ph';
      const baseDescription =
        'Browse and search a comprehensive directory of Philippine government services across categories and subcategories.';
      const phrases: string[] = [];
      if (selectedCategory) phrases.push(selectedCategory.category);
      if (selectedSubcategory) phrases.push(selectedSubcategory.name);
      const title = phrases.length
        ? `${phrases.join(' – ')} | BetterGov.ph`
        : baseTitle;
      const description = phrases.length
        ? `Explore Philippine government services for ${phrases.join(' ')}. Find online resources, requirements, and assistance.`
        : baseDescription;
      const keywords = [
        'philippine government services',
        'online services',
        'public service directory',
        'government portal',
        ...phrases.map(p => p.toLowerCase()),
      ].join(', ');
      let canonical = 'https://bettergov.ph/services';
      if (selectedCategorySlug !== 'all') {
        canonical += `?category=${selectedCategorySlug}`;
        if (selectedSubcategorySlug !== 'all') {
          canonical += `&subcategory=${selectedSubcategorySlug}`;
        }
      }
      return {
        metaTitle: title,
        metaDescription: description,
        metaKeywords: keywords,
        canonicalUrl: canonical,
      };
    }, [
      selectedCategory,
      selectedSubcategory,
      selectedCategorySlug,
      selectedSubcategorySlug,
    ]);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet key={canonicalUrl}>
        <title>{metaTitle}</title>
        <meta name='description' content={metaDescription} />
        <meta name='keywords' content={metaKeywords} />
        <link rel='canonical' href={canonicalUrl} />
        <meta property='og:title' content={metaTitle} />
        <meta property='og:description' content={metaDescription} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={canonicalUrl} />
        <meta property='og:image' content='https://bettergov.ph/ph-logo.webp' />
      </Helmet>

      <PageMasthead
        variant='hero'
        title={
          selectedCategory ? selectedCategory.category : 'Government services'
        }
        lede={
          selectedCategory
            ? `Browse services under ${selectedCategory.category}. Every entry links to the official source and is reviewed by our volunteer editors.`
            : 'Find official Philippine government services — written plainly, updated continuously, sourced from the original issuing agency.'
        }
      >
        <div className='mt-2 max-w-2xl'>
          <BigSearch
            value={searchQuery ?? ''}
            onChange={handleSearch}
            onSubmit={() => {
              /* state already driven by onChange */
            }}
            placeholder='What do you need? e.g. passport, NBI clearance'
            ariaLabel='Search government services'
            ctaLabel='Search'
            onDark
          />
        </div>
      </PageMasthead>

      <section id={RESULTS_ANCHOR} className='scroll-mt-24 py-10 max-md:py-6'>
        <Container>
          {/* Mobile filter toggle */}
          <div className='mb-6 md:hidden'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-expanded={sidebarOpen}
              aria-controls='services-sidebar'
              className='inline-flex w-full items-center justify-between border border-ed-rule bg-white px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink'
            >
              <span>
                Refine
                {selectedCategorySlug !== 'all' &&
                  ` · ${selectedCategory?.category ?? ''}`}
              </span>
              {sidebarOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
            </button>
          </div>

          <div className='grid grid-cols-[260px_1fr] gap-12 max-lg:gap-8 max-md:grid-cols-1 max-md:gap-6'>
            {/* Sidebar */}
            <aside
              id='services-sidebar'
              className={cn(
                'border-t border-ed-ink pt-5 md:sticky md:top-6 md:self-start max-md:pt-4',
                sidebarOpen ? 'block' : 'hidden md:block'
              )}
              aria-label='Service filters'
            >
              <div className='mb-4'>
                <Eyebrow>Refine</Eyebrow>
              </div>

              <FilterSection label='Category'>
                <div className='flex flex-col'>
                  <CategoryRow
                    label='All categories'
                    count={allServices.length}
                    active={selectedCategorySlug === 'all'}
                    onClick={() => {
                      handleCategoryChange('all');
                      setSidebarOpen(false);
                    }}
                  />
                  {(serviceCategories.categories as Category[]).map(c => {
                    const count = allServices.filter(
                      s => s.category.slug === c.slug
                    ).length;
                    const isOpen = selectedCategorySlug === c.slug;
                    return (
                      <div key={c.slug}>
                        <CategoryRow
                          label={c.category}
                          count={count}
                          active={isOpen}
                          onClick={() => {
                            handleCategoryChange(c.slug);
                            setSidebarOpen(false);
                          }}
                          showChevron
                          chevronOpen={isOpen}
                        />
                        {isOpen && c.subcategories.length > 0 && (
                          <div className='ml-3 mt-1 flex flex-col border-l border-ed-rule pl-3'>
                            <button
                              onClick={() => {
                                handleSubcategoryChange('all');
                                setSidebarOpen(false);
                              }}
                              className={cn(
                                'py-1.5 text-left text-[13px] transition-colors hover:text-ed-navy',
                                selectedSubcategorySlug === 'all'
                                  ? 'font-semibold text-ed-ink'
                                  : 'text-ed-ink-2'
                              )}
                            >
                              All {c.category.toLowerCase()}
                            </button>
                            {c.subcategories.map(sub => {
                              const subCount = allServices.filter(
                                s =>
                                  s.category.slug === c.slug &&
                                  s.subcategory.slug === sub.slug
                              ).length;
                              const subActive =
                                selectedSubcategorySlug === sub.slug;
                              return (
                                <button
                                  key={sub.slug}
                                  onClick={() => {
                                    handleSubcategoryChange(sub.slug);
                                    setSidebarOpen(false);
                                  }}
                                  className={cn(
                                    'flex items-center justify-between gap-2 py-1.5 text-left text-[13px] transition-colors hover:text-ed-navy',
                                    subActive
                                      ? 'font-semibold text-ed-ink'
                                      : 'text-ed-ink-2'
                                  )}
                                >
                                  <span>{sub.name}</span>
                                  <span className='font-mono-ed text-[11px] text-ed-ink-4'>
                                    {subCount}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </FilterSection>
            </aside>

            {/* Results */}
            <div>
              <div className='flex items-center justify-between border-b border-ed-ink pb-3.5'>
                <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
                  <strong className='text-sm text-ed-ink'>
                    {filteredServices.length}
                  </strong>{' '}
                  result{filteredServices.length === 1 ? '' : 's'}
                  {searchQuery ? (
                    <>
                      {' for '}
                      <em className='not-italic text-ed-ink'>
                        &ldquo;{searchQuery}&rdquo;
                      </em>
                    </>
                  ) : null}
                </div>
                {(searchQuery || selectedCategorySlug !== 'all') && (
                  <button
                    onClick={() => {
                      handleCategoryChange('all');
                      setSearchQuery(null);
                      setCurrentPage(1);
                    }}
                    className='font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy no-underline hover:text-ed-red'
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {paginatedServices.length === 0 ? (
                <div className='py-20 text-center text-ed-ink-3'>
                  <div className='font-serif-ed text-[28px] text-ed-ink-2'>
                    No results.
                  </div>
                  <p className='mt-2 text-sm'>
                    Try a different term, or browse categories.
                  </p>
                </div>
              ) : (
                <ul className='divide-y divide-ed-rule' role='list'>
                  {paginatedServices.map(service => (
                    <li key={service.id} role='listitem'>
                      <a
                        href={service.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='grid grid-cols-[1fr_220px] gap-6 py-7 text-ed-ink no-underline hover:bg-ed-paper-2/50 max-lg:grid-cols-1 max-lg:gap-4 max-md:py-3.5'
                      >
                        <div>
                          <div className='flex flex-wrap items-baseline gap-3 max-md:gap-2'>
                            <Flag variant='navy'>{service.category.name}</Flag>
                            <span className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                              {service.subcategory.name}
                            </span>
                          </div>
                          <h3 className='mt-2.5 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-ink max-md:mt-1.5 max-md:text-[18px]'>
                            {service.service}
                          </h3>
                          <p className='mt-1.5 max-w-[620px] break-all text-sm leading-normal text-ed-ink-3 max-md:mt-1 max-md:text-xs'>
                            {service.url}
                          </p>
                        </div>
                        <div className='border-l border-ed-rule pl-5 font-mono-ed text-[11px] uppercase tracking-[0.08em] text-ed-ink-3 max-lg:hidden'>
                          <div>Visit</div>
                          <div className='mt-1 font-sans-ed text-[13px] normal-case tracking-normal text-ed-navy'>
                            Open official site →
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {filteredServices.length > ITEMS_PER_PAGE * currentPage && (
                <div ref={loadMoreRef} className='py-8' aria-hidden='true' />
              )}

              <div className='sr-only' aria-live='polite' aria-atomic='true'>
                Showing {paginatedServices.length} of {filteredServices.length}{' '}
                services
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

type CategoryRowProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  showChevron?: boolean;
  chevronOpen?: boolean;
};

const CategoryRow: React.FC<CategoryRowProps> = ({
  label,
  count,
  active,
  onClick,
  showChevron,
  chevronOpen,
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'true' : undefined}
    className={cn(
      'flex items-center justify-between gap-2 border-b border-ed-rule py-2 text-left text-sm transition-colors hover:text-ed-navy',
      active ? 'font-semibold text-ed-ink' : 'text-ed-ink-2'
    )}
  >
    <span className='inline-flex items-center gap-1.5'>
      {label}
      {showChevron && (
        <ChevronDownIcon
          size={12}
          className={cn(
            'opacity-70 transition-transform',
            chevronOpen && 'rotate-180'
          )}
        />
      )}
    </span>
    <span className='font-mono-ed text-[11px] text-ed-ink-4'>{count}</span>
  </button>
);
