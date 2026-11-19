import { FC, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react';
import SEO from '../../components/SEO';
import Container from '../../components/v2/ui/Container';
import Flag from '../../components/v2/ui/Flag';
import Button from '../../components/v2/ui/Button';
import NewsComingSoon from '../../components/v2/news/NewsComingSoon';
import {
  fetchNewsArticle,
  formatNewsDateLong,
  NewsArticleNotFoundError,
} from '../../lib/news';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { NewsArticleDetail } from '../../types/news';

const BodySkeleton: FC = () => (
  <div className='animate-pulse'>
    <div className='h-3 w-32 bg-ed-paper-3' />
    <div className='mt-6 h-8 w-full bg-ed-paper-3' />
    <div className='mt-3 h-8 w-3/4 bg-ed-paper-3' />
    <div className='mt-10 aspect-[16/9] w-full bg-ed-paper-3' />
    <div className='mt-10 space-y-3'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='h-4 w-full bg-ed-paper-3' />
      ))}
    </div>
  </div>
);

const BackLink: FC = () => (
  <Link
    to='/news'
    className='inline-flex items-center gap-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy no-underline hover:underline'
  >
    <ArrowLeftIcon size={13} aria-hidden='true' />
    All news
  </Link>
);

const NewsArticlePage: FC = () => {
  const { id } = useParams<{ id: string }>();

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setArticle(null);

    fetchNewsArticle(id)
      .then(data => {
        if (cancelled) return;
        setArticle(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Could not load this article.'
        );
        setNotFound(err instanceof NewsArticleNotFoundError);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const publishedLabel = formatNewsDateLong(article?.publishedAt ?? null);
  useDocumentTitle(article?.title ?? (error ? 'Article unavailable' : null));

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      {article ? (
        <SEO
          title={article.title}
          description={article.excerpt || article.title}
          ogType='article'
          ogImage={article.imageUrl ?? undefined}
          canonical={`/news/${article.id}`}
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'News', url: '/news' },
            { name: article.title, url: `/news/${article.id}` },
          ]}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            datePublished: article.publishedAt?.toISOString(),
            image: article.imageUrl ? [article.imageUrl] : undefined,
            articleSection: article.category.label,
            author: article.author
              ? { '@type': 'Organization', name: article.author }
              : undefined,
            publisher: article.publisher
              ? { '@type': 'Organization', name: article.publisher }
              : undefined,
            isBasedOn: article.sourceUrl ?? undefined,
          }}
        />
      ) : (
        <SEO title='News' noIndex />
      )}

      <Container narrow className='py-12 max-md:py-6'>
        <div className='mb-8'>
          <BackLink />
        </div>

        {error && !notFound ? (
          <NewsComingSoon />
        ) : error ? (
          <div className='border-l-4 border-ed-red bg-ed-paper-2 p-6'>
            <p className='mb-1 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-red'>
              Article unavailable
            </p>
            <p className='text-sm text-ed-ink-2'>{error}</p>
            <p className='mt-3 text-sm text-ed-ink-3'>
              This article may have been removed from e.gov.ph.
            </p>
            <div className='mt-6'>
              <Button as={Link} to='/news' size='sm'>
                Back to all news
              </Button>
            </div>
          </div>
        ) : isLoading || !article ? (
          <BodySkeleton />
        ) : (
          <article>
            <header className='border-b border-ed-ink pb-8'>
              <div className='flex flex-wrap items-baseline gap-3'>
                <Flag variant={article.category.id === 6 ? 'outline' : 'navy'}>
                  {article.category.label}
                </Flag>
                {article.publishedAt && (
                  <time
                    dateTime={article.publishedAt.toISOString()}
                    className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'
                  >
                    {publishedLabel}
                  </time>
                )}
                {article.relativeLabel && (
                  <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                    · {article.relativeLabel}
                  </span>
                )}
              </div>

              <h1 className='mt-4 font-serif-ed text-[clamp(28px,4vw,46px)] font-bold leading-[1.06] tracking-[-0.02em] text-ed-ink'>
                {article.title}
              </h1>

              {(article.publisher || article.author) && (
                <p className='mt-5 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  {article.publisher ?? article.author}
                </p>
              )}
            </header>

            {article.imageUrl && (
              <figure className='mt-8'>
                <img
                  src={article.imageUrl}
                  alt=''
                  decoding='async'
                  className='w-full border border-ed-rule object-cover'
                />
              </figure>
            )}

            {article.bodyHtml ? (
              <div
                className='news-body mt-10'
                // Sanitised in lib/news.ts: DOMPurify with a tag/attribute
                // allowlist, run after the source CMS chrome is stripped.
                dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
              />
            ) : (
              <p className='mt-10 text-ed-ink-2'>
                This item has no article text — it is a headline-only entry on
                e.gov.ph.
              </p>
            )}

            <footer className='mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ed-rule pt-6'>
              <BackLink />
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy no-underline hover:underline'
                >
                  View source on e.gov.ph
                  <ExternalLinkIcon size={13} aria-hidden='true' />
                </a>
              )}
            </footer>
          </article>
        )}
      </Container>
    </main>
  );
};

export default NewsArticlePage;
