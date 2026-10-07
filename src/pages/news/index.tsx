import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Helmet } from 'react-helmet-async';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Pagination from '../../components/v2/ui/Pagination';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import NewsCard from '../../components/v2/news/NewsCard';
import {
  DEFAULT_NEWS_PER_PAGE,
  NEWS_CATEGORIES,
  fetchNewsList,
  getNewsCategoryBySlug,
} from '../../lib/news';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { NewsListResult } from '../../types/news';
import { cn } from '../../lib/utils';

const numberFormat = new Intl.NumberFormat('en-PH');

/**
 * Build a `/news` URL from the current one, dropping params that are back at
 * their default so the canonical first page stays a bare `/news`.
 */
const buildHref = (
  search: string,
  next: { page?: number; category?: string }
): string => {
  const params = new URLSearchParams(search);

  if (next.category !== undefined) {
    if (next.category === 'all') params.delete('category');
    else params.set('category', next.category);
    // A new filter invalidates the current page number.
    params.delete('page');
  }

  if (next.page !== undefined) {
    if (next.page <= 1) params.delete('page');
    else params.set('page', String(next.page));
  }

  const qs = params.toString();
  return qs ? `/news?${qs}` : '/news';
};

const CardSkeleton: FC = () => (
  <div className='animate-pulse'>
    <div className='aspect-[16/9] w-full bg-ed-paper-3' />
    <div className='mt-4 h-3 w-24 bg-ed-paper-3' />
    <div className='mt-3 h-4 w-full bg-ed-paper-3' />
    <div className='mt-2 h-4 w-2/3 bg-ed-paper-3' />
  </div>
);

const NewsIndex: FC = () => {
  const { search } = useLocation();
  const [{ page, category: categorySlug }] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    category: parseAsString.withDefault('all'),
  });

  const category = getNewsCategoryBySlug(categorySlug);
  const currentPage = Math.max(1, page);

  const [result, setResult] = useState<NewsListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Skip the scroll-into-view on first paint — only paging should move us.
  const isFirstRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchNewsList({
      page: currentPage,
      perPage: DEFAULT_NEWS_PER_PAGE,
      categoryId: category?.id ?? null,
    })
      .then(data => {
        if (cancelled) return;
        setResult(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load news from e.gov.ph.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, category?.id]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage, categorySlug]);

  const articles = result?.articles ?? [];
  const pagination = result?.pagination;

  const rangeLabel = useMemo(() => {
    if (!pagination || pagination.total === 0) return null;
    const first = (pagination.currentPage - 1) * pagination.perPage + 1;
    const last = first + Math.max(0, pagination.count - 1);
    return `${numberFormat.format(first)}–${numberFormat.format(
      last
    )} of ${numberFormat.format(pagination.total)}`;
  }, [pagination]);

  // The lead treatment is for the newest item, so only on an unpaged view.
  const showLead = currentPage === 1 && articles.length > 1;
  const [lead, ...rest] = articles;
  const gridArticles = showLead ? rest : articles;

  const heading = category ? `${category.label} · News` : 'News';
  const canonicalPage = currentPage > 1 ? ` — page ${currentPage}` : '';
  useDocumentTitle(`${heading}${canonicalPage}`);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>{`${heading}${canonicalPage} | GOV.PH`}</title>
        <meta
          name='description'
          content='Official news, press releases and circulars from the Philippine government, republished from e.gov.ph.'
        />
        {/* Deep pages are near-duplicates for search; index page one only. */}
        {currentPage > 1 && <meta name='robots' content='noindex, follow' />}
      </Helmet>

      <PageMasthead
        variant='hero'
        title='News'
        lede='Official announcements, press releases and circulars from the Philippine government, published by the Presidential Communications Office on e.gov.ph.'
      />

      <section className='py-12 max-md:py-6'>
        <Container>
          {/* Category filter */}
          <nav
            aria-label='Filter news by category'
            className='mb-8 max-md:mb-5'
          >
            <ul className='flex flex-wrap gap-2'>
              {[{ slug: 'all', label: 'All' }, ...NEWS_CATEGORIES].map(c => {
                const isActive = (categorySlug || 'all') === c.slug;
                return (
                  <li key={c.slug}>
                    <Link
                      to={buildHref(search, { category: c.slug })}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'inline-flex h-9 items-center border px-3.5 font-mono-ed text-[11px] uppercase tracking-[0.12em] no-underline transition-colors',
                        isActive
                          ? 'border-ed-navy bg-ed-navy text-white'
                          : 'border-ed-rule-strong bg-white text-ed-ink hover:border-ed-navy hover:bg-ed-navy-tint hover:text-ed-navy'
                      )}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            ref={resultsRef}
            className='mb-6 flex items-baseline justify-between gap-4 border-t-2 border-ed-navy pt-4 max-sm:flex-col max-sm:items-start max-sm:gap-1'
          >
            <Eyebrow tone='navy'>
              {category ? category.label : 'All categories'}
            </Eyebrow>
            {rangeLabel && !isLoading && (
              <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                {rangeLabel}
              </span>
            )}
          </div>

          {error ? (
            <div className='border-l-4 border-ed-red bg-ed-paper-2 p-6'>
              <p className='mb-1 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-red'>
                News unavailable
              </p>
              <p className='text-sm text-ed-ink-2'>{error}</p>
              <p className='mt-3 text-sm text-ed-ink-3'>
                The e.gov.ph news service may be temporarily down. Try again in
                a few minutes.
              </p>
            </div>
          ) : isLoading ? (
            <div
              aria-busy='true'
              aria-live='polite'
              className='grid grid-cols-3 gap-x-8 gap-y-10 max-lg:grid-cols-2 max-md:gap-y-6 max-sm:grid-cols-1'
            >
              <span className='sr-only'>Loading news…</span>
              {Array.from({ length: DEFAULT_NEWS_PER_PAGE }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No articles in this category.
            </div>
          ) : (
            <>
              {showLead && <NewsCard article={lead} variant='lead' />}
              <div
                className={cn(
                  'grid grid-cols-3 gap-x-8 gap-y-10 max-lg:grid-cols-2 max-sm:grid-cols-1',
                  showLead && 'mt-10'
                )}
              >
                {gridArticles.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}

          {pagination && !error && (
            <Pagination
              page={pagination.currentPage}
              totalPages={pagination.totalPages}
              hrefFor={p => buildHref(search, { page: p })}
              label='News pagination'
              className='mt-14 max-md:mt-10'
            />
          )}
        </Container>
      </section>
    </main>
  );
};

export default NewsIndex;
