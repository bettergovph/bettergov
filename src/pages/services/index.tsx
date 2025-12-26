import * as ScrollArea from '@radix-ui/react-scroll-area';
import { CheckCircle2Icon, MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import serviceCategories from '../../data/service_categories.json';

// Import all service files
import { scrollToTop } from '@/lib/scrollUtils';
import { parseAsString, useQueryState, useQueryStates } from 'nuqs';
import { Helmet } from 'react-helmet-async';
import Button from '../../components/ui/Button';
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

// Combine all services
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

  // Find selected category object
  const selectedCategory = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return (serviceCategories.categories as Category[]).find(
      cat => cat.slug === selectedCategorySlug
    );
  }, [selectedCategorySlug]);

  // Find selected subcategory object
  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory || selectedSubcategorySlug === 'all') return null;
    return selectedCategory.subcategories.find(
      subcat => subcat.slug === selectedSubcategorySlug
    );
  }, [selectedCategory, selectedSubcategorySlug]);

  const filteredServices = useMemo(() => {
    let filtered = allServices;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        service =>
          service.service.toLowerCase().includes(query) ||
          service.category.name.toLowerCase().includes(query) ||
          service.subcategory.name.toLowerCase().includes(query)
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

  // Show all items from start to current page
  const paginatedServices = filteredServices.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setCurrentPage(1);
    setQueryParams({
      category: categorySlug,
      subcategory: null,
    });
  };

  const handleSubcategoryChange = (subcategorySlug: string) => {
    setCurrentPage(1);
    setQueryParams({
      category: selectedCategorySlug,
      subcategory: subcategorySlug,
    });
  };

  const handleLoadMore = useCallback(() => {
    // Prevent loading beyond available items
    if (filteredServices.length <= currentPage * ITEMS_PER_PAGE) {
      return;
    }

    setCurrentPage(prev => prev + 1);
  }, [filteredServices.length, currentPage, setCurrentPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Trigger 100px before the trigger comes into view
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleLoadMore]);

  // const currentCategoryData = selectedCategory

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamically generate SEO meta tags based on selected category & subcategory
  const { metaTitle, metaDescription, metaKeywords, canonicalUrl } =
    useMemo(() => {
      const baseTitle = 'Government Services Directory | BetterGov.ph';
      const baseDescription =
        'Browse and search a comprehensive directory of Philippine government services across categories and subcategories.';

      const phrases: string[] = [];
      if (selectedCategory) {
        phrases.push(selectedCategory.category);
      }
      if (selectedSubcategory) {
        phrases.push(selectedSubcategory.name);
      }

      const title = phrases.length
        ? `${phrases.join(' – ')} | BetterGov.ph`
        : baseTitle;

      const description = phrases.length
        ? `Explore Philippine government services for ${phrases.join(
            ' '
          )}. Find online resources, requirements, and assistance.`
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
    <div className='min-h-screen bg-gray-50'>
      <Helmet key={canonicalUrl}>
        <title>{metaTitle}</title>
        <meta name='description' content={metaDescription} />
        <meta name='keywords' content={metaKeywords} />
        <link rel='canonical' href={canonicalUrl} />

        {/* Open Graph / Social */}
        <meta property='og:title' content={metaTitle} />
        <meta property='og:description' content={metaDescription} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={canonicalUrl} />
        <meta property='og:image' content='https://gov.ph/ph-logo.webp' />
      </Helmet>
      <div className='container mx-auto px-4 py-6 md:py-12'>
        {/* Header */}
        <header className='text-center mb-8 md:mb-12'>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            {selectedCategory?.category
              ? `${selectedCategory?.category} Government Services`
              : 'Government Services'}
          </h1>
          <p className='text-sm md:text-lg text-gray-800 max-w-2xl mx-auto'>
            Access official government services quickly and easily. Find what
            you need for citizenship, business, education, and more.
          </p>
        </header>

        {/* Search Bar */}
        <section
          aria-label='Search services'
          className='max-w-2xl mx-auto mb-8 md:mb-12'
        >
          <SearchInput
            placeholder='Search for services...'
            value={searchQuery ?? ''}
            onChange={e => handleSearch(e.target.value)}
            onSearch={handleSearch}
            icon={<SearchIcon className='h-5 w-5 text-gray-400' />}
            size='lg'
            aria-label='Search government services'
            role='searchbox'
          />
          <p className='sr-only' id='search-description'>
            Search for government services by name, category, or description
          </p>
        </section>

        {/* Featured Services */}
        {/* <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/services/websites" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary-300 group-hover:transform group-hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-primary-50 text-primary-600 mr-4">
                      <Globe className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      Government Websites Directory
                    </h3>
                  </div>
                  <p className="text-gray-800 mb-4">
                    Comprehensive directory of Philippine government websites,
                    agencies, and services. Find official websites for all
                    government institutions.
                  </p>
                  <div className="flex items-center text-primary-600 font-medium">
                    <span>Browse Directory</span>
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section> */}

        {/* Mobile Category Toggle */}
        <div className='md:hidden mb-6'>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='flex items-center justify-between w-full px-4 py-3 bg-white rounded-lg shadow-xs text-gray-900 font-medium'
            aria-expanded={sidebarOpen}
            aria-controls='categories-sidebar'
            aria-label={`${sidebarOpen ? 'Close' : 'Open'} categories menu`}
          >
            <span>
              Categories{' '}
              {selectedCategorySlug !== 'all' &&
                `(${selectedCategory?.category})`}
            </span>
            {sidebarOpen ? (
              <XIcon className='h-5 w-5 text-gray-800' aria-hidden='true' />
            ) : (
              <MenuIcon className='h-5 w-5 text-gray-800' aria-hidden='true' />
            )}
          </button>
        </div>

        <div className='flex flex-col md:flex-row md:gap-8'>
          {/* Categories Sidebar */}
          <div
            id='categories-sidebar'
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } md:block w-full md:w-64 md:shrink-0 mb-6 md:mb-0`}
            role='navigation'
            aria-label='Service categories'
          >
            <div className='bg-white rounded-lg shadow-xs p-4 sticky top-[8.25rem]'>
              <h2 className='font-semibold text-gray-900 mb-4 text-lg'>
                Categories
              </h2>
              <ScrollArea.Root className='h-[calc(60vh)] md:max-h-[calc(100vh-200px)]'>
                <ScrollArea.Viewport className='h-full w-full'>
                  <div className='space-y-1 pr-4' role='list'>
                    <div role='listitem'>
                      <button
                        onClick={() => {
                          scrollToTop();
                          handleCategoryChange('all');
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategorySlug === 'all'
                            ? 'bg-primary-50 text-primary-600 font-medium'
                            : 'cursor-default text-gray-800 hover:bg-gray-50 hover:cursor-pointer'
                        }`}
                        aria-current={
                          selectedCategorySlug === 'all' ? 'true' : undefined
                        }
                      >
                        All Services
                        {selectedCategorySlug === 'all' && (
                          <span className='sr-only'> (selected)</span>
                        )}
                      </button>
                    </div>
                    {(serviceCategories.categories as Category[]).map(
                      category => (
                        <div key={category.slug} role='listitem'>
                          <button
                            onClick={() => {
                              scrollToTop();
                              handleCategoryChange(category.slug);
                              setSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedCategorySlug === category.slug
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'cursor-default text-gray-800 hover:bg-gray-50 hover:cursor-pointer'
                            }`}
                            aria-expanded={
                              selectedCategorySlug === category.slug
                            }
                            aria-controls={`subcategory-${category.slug}`}
                            aria-current={
                              selectedCategorySlug === category.slug
                                ? 'true'
                                : undefined
                            }
                          >
                            {category.category}
                            {selectedCategorySlug === category.slug && (
                              <span className='sr-only'> (selected)</span>
                            )}
                          </button>

                          <div
                            id={`subcategory-${category.slug}`}
                            className={`ml-4 space-y-1 mt-1 ${
                              selectedCategorySlug === category.slug
                                ? 'block relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200'
                                : 'hidden'
                            }`}
                            role='region'
                            aria-label={`${category.category} subcategories`}
                          >
                            {category.subcategories.map(subcategory => (
                              <button
                                key={subcategory.slug}
                                onClick={() => {
                                  scrollToTop();
                                  handleSubcategoryChange(subcategory.slug);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                  selectedSubcategorySlug === subcategory.slug
                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                    : 'cursor-default text-gray-800 hover:bg-gray-50 hover:cursor-pointer'
                                }`}
                                aria-current={
                                  selectedSubcategorySlug === subcategory.slug
                                    ? 'true'
                                    : undefined
                                }
                              >
                                {subcategory.name}
                                {selectedSubcategorySlug ===
                                  subcategory.slug && (
                                  <span className='sr-only'> (selected)</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  className='flex select-none touch-none p-0.5 bg-gray-100 transition-colors hover:bg-gray-200 rounded-full'
                  orientation='vertical'
                >
                  <ScrollArea.Thumb className='flex-1 bg-gray-300 rounded-full relative' />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>
          </div>

          {/* Services Grid */}
          <main className='flex-1'>
            <h2 className='sr-only'>Available Services</h2>
            <div
              className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'
              role='list'
              aria-label='List of government services'
            >
              {paginatedServices.map((service, index) => (
                <article key={index} className='h-full' role='listitem'>
                  <Card hoverable className='bg-white h-full'>
                    <CardContent className='p-4 md:p-6'>
                      <div className='flex items-start justify-between mb-4'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {service.service}
                          </h3>
                          <div className='mt-2 flex flex-wrap gap-2'>
                            <button
                              onClick={() => {
                                scrollToTop();
                                setQueryParams({
                                  category: service.category.slug,
                                  subcategory: null,
                                });
                                setCurrentPage(1);
                              }}
                              className='cursor-default inline-block px-2 py-1 text-xs font-medium rounded-sm bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors hover:cursor-pointer'
                            >
                              {service.category.name}
                            </button>
                            <button
                              onClick={() => {
                                scrollToTop();
                                setQueryParams({
                                  category: service.category.slug,
                                  subcategory: service.subcategory.slug,
                                });
                                setCurrentPage(1);
                              }}
                              className='cursor-default inline-block px-2 py-1 text-xs font-medium rounded-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors hover:cursor-pointer'
                            >
                              {service.subcategory.name}
                            </button>
                          </div>
                        </div>
                        <CheckCircle2Icon
                          className='h-5 w-5 text-success-500 flex-shrink-0'
                          aria-hidden='true'
                        />
                      </div>
                      <div className='space-y-3'>
                        <a
                          href={service.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-gray-800 text-sm hover:text-primary-600 transition-colors break-all line-clamp-1'
                        >
                          {service.url}
                        </a>
                        <a
                          href={service.url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Button className='cursor-default bg-blue-600 text-white rounded-lg px-4 py-1 text-xs mt-4 hover:cursor-pointer'>
                            View Service
                          </Button>
                        </a>

                        {/* <div className="flex items-center text-sm text-gray-800">
                          <time
                            dateTime={new Date().toISOString()}
                            className="text-xs md:text-sm"
                          >
                            Last verified: {formatDate(new Date())}
                          </time>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>

            {/* No services fallback */}
            {paginatedServices.length === 0 && (
              <div className='text-center py-12'>
                <p className='text-gray-500'>
                  No services found matching your criteria.
                </p>
                <Button
                  onClick={() => {
                    handleCategoryChange('all');
                    setSearchQuery(null);
                  }}
                  variant='ghost'
                >
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {filteredServices.length > ITEMS_PER_PAGE * currentPage && (
              <div
                ref={loadMoreRef}
                className='mt-6 md:mt-8 py-8'
                aria-hidden='true'
              />
            )}

            {/* Status message for screen readers */}
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
              Showing {paginatedServices.length} of {filteredServices.length}{' '}
              services
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
