import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { Helmet } from 'react-helmet-async';

import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import BigSearch from '../../components/v2/ui/BigSearch';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import { cn } from '../../lib/utils';
import { scrollToTop } from '@/lib/scrollUtils';

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allServices.length };
    (serviceCategories.categories as Category[]).forEach(c => {
      counts[c.slug] = allServices.filter(
        s => s.category.slug === c.slug
      ).length;
    });
    return counts;
  }, []);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query || null);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setCurrentPage(1);
    scrollToTop();
    setQueryParams({
      category: categorySlug === 'all' ? null : categorySlug,
      subcategory: null,
    });
  };

  const handleSubcategoryChange = (subcategorySlug: string) => {
    setCurrentPage(1);
    scrollToTop();
    setQueryParams({
      category: selectedCategorySlug,
      subcategory: subcategorySlug === 'all' ? null : subcategorySlug,
    });
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
        <meta property='og:image' content='https://gov.ph/ph-logo.webp' />
      </Helmet>

      <PageMasthead
        variant='hero'
        eyebrow='§ Services · Index'
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

      {/* Category sub-nav (same pattern as /guides) */}
      <nav
        aria-label='Service categories'
        className='border-b border-ed-rule bg-white'
      >
        <Container className='flex flex-wrap'>
          <CategoryPill
            label='All'
            count={categoryCounts.all}
            active={selectedCategorySlug === 'all'}
            onClick={() => handleCategoryChange('all')}
          />
          {(serviceCategories.categories as Category[]).map(c => (
            <CategoryPill
              key={c.slug}
              label={c.category}
              count={categoryCounts[c.slug] ?? 0}
              active={selectedCategorySlug === c.slug}
              onClick={() => handleCategoryChange(c.slug)}
            />
          ))}
        </Container>
      </nav>

      {/* Subcategory pill row (when a category is selected) */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <div className='border-b border-ed-rule bg-ed-paper-2'>
          <Container className='flex flex-wrap items-center gap-2 py-3'>
            <Eyebrow className='mr-2'>Refine</Eyebrow>
            <SubcategoryPill
              label={`All ${selectedCategory.category.toLowerCase()}`}
              active={selectedSubcategorySlug === 'all'}
              onClick={() => handleSubcategoryChange('all')}
            />
            {selectedCategory.subcategories.map(s => (
              <SubcategoryPill
                key={s.slug}
                label={s.name}
                active={selectedSubcategorySlug === s.slug}
                onClick={() => handleSubcategoryChange(s.slug)}
              />
            ))}
          </Container>
        </div>
      )}

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between border-b border-ed-ink pb-3.5'>
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
              {paginatedServices.map((service, i) => (
                <li key={service.id} role='listitem'>
                  <a
                    href={service.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='grid grid-cols-[60px_1fr_220px] gap-6 py-7 text-ed-ink no-underline hover:bg-ed-paper-2/50 max-lg:grid-cols-[40px_1fr] max-lg:gap-4 max-md:py-5'
                  >
                    <div className='pt-1 font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-4'>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className='flex flex-wrap items-baseline gap-3'>
                        <Flag variant='navy'>{service.category.name}</Flag>
                        <span className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                          {service.subcategory.name}
                        </span>
                      </div>
                      <h3 className='mt-2.5 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-ink'>
                        {service.service}
                      </h3>
                      <p className='mt-1.5 max-w-[620px] break-all text-sm leading-normal text-ed-ink-3'>
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
        </Container>
      </section>
    </main>
  );
}

const CategoryPill: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ label, count, active, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      'border-r border-ed-rule px-[18px] py-3.5 font-mono-ed text-[11px] uppercase tracking-[0.12em] transition-colors',
      active
        ? 'bg-ed-navy text-white'
        : 'bg-transparent text-ed-ink-2 hover:bg-ed-navy-tint hover:text-ed-navy-ink'
    )}
    aria-pressed={active}
  >
    {label}
    <span className={cn('ml-2', active ? 'opacity-75' : 'opacity-65')}>
      {count}
    </span>
  </button>
);

const SubcategoryPill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 border px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.12em] transition-colors',
      active
        ? 'border-ed-navy bg-ed-navy text-white'
        : 'border-ed-rule-strong bg-white text-ed-ink-2 hover:border-ed-navy hover:text-ed-navy'
    )}
    aria-pressed={active}
  >
    {label}
  </button>
);
