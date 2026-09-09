import { FC, Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import Eyebrow from '../ui/Eyebrow';
import Flag from '../ui/Flag';
import ArrowLink from '../ui/ArrowLink';
import Dropcap from '../ui/Dropcap';
import {
  fetchNewsArticle,
  fetchNewsList,
  formatNewsDateLong,
} from '../../../lib/news';
import { NewsArticle, NewsArticleDetail } from '../../../types/news';
import { criticalHotlines } from '../../../data/cms';
import { HOLIDAYS_2026 } from './data';

/**
 * One lead plus four secondary headlines fills the news column. We ask for
 * one spare so pulling the lead out of the middle still leaves four.
 */
const HOME_NEWS_COUNT = 6;

/**
 * The card is a teaser, not the full list — `/philippines/hotlines` is one
 * click away. `criticalHotlines` is generated from TalaCMS at build time by
 * `npm run sync:talacms`; this component reads the generated data through
 * `src/data/cms.ts` and makes no network request itself.
 *
 * The file carries every number for a hotline; the card shows the first —
 * element 0 — which is this card's long-standing display convention. Whether
 * TalaCMS formally designates element 0 as primary is unconfirmed and is a
 * manual acceptance item, so this deliberately claims a convention, not a
 * CMS contract. Later entries are never promoted into element 0's place.
 */
const HOME_HOTLINES_LIMIT = 5;
const HOME_HOTLINES = criticalHotlines.slice(0, HOME_HOTLINES_LIMIT);

/** Circulars carry no article text upstream — only a link to the PDF. */
const CIRCULAR_CATEGORY_ID = 6;

/**
 * The lead gets a dropcap excerpt, so it has to be an item with prose behind
 * it. Circulars never are, so prefer the newest item that isn't one and let
 * circulars fill the headline-only slots.
 */
const pickLead = (articles: NewsArticle[]): number => {
  const index = articles.findIndex(a => a.category.id !== CIRCULAR_CATEGORY_ID);
  return index === -1 ? 0 : index;
};

const NewsColumnSkeleton: FC = () => (
  <div className='animate-pulse'>
    <div className='border-b border-ed-rule pb-8'>
      <div className='h-3 w-40 bg-ed-paper-3' />
      <div className='mt-4 h-8 w-full bg-ed-paper-3' />
      <div className='mt-2 h-8 w-4/5 bg-ed-paper-3' />
      <div className='mt-5 h-4 w-full bg-ed-paper-3' />
      <div className='mt-2 h-4 w-3/4 bg-ed-paper-3' />
    </div>
    <div className='mt-8 grid gap-x-12 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className='h-3 w-28 bg-ed-paper-3' />
          <div className='mt-2 h-5 w-full bg-ed-paper-3' />
          <div className='mt-2 h-5 w-2/3 bg-ed-paper-3' />
        </div>
      ))}
    </div>
  </div>
);

const NewsAndHolidays: FC = () => {
  const { t } = useTranslation('home');

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  // The listing endpoint carries no body text, so the lead's excerpt and read
  // time come from one extra detail fetch. Everything else stays headline-led.
  const [leadDetail, setLeadDetail] = useState<NewsArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchNewsList({ page: 1, perPage: HOME_NEWS_COUNT })
      .then(({ articles: latest }) => {
        if (cancelled) return;
        setArticles(latest);
        setIsLoading(false);
        return latest[pickLead(latest)]?.id;
      })
      .then(leadId => {
        if (cancelled || !leadId) return;
        // Best-effort enrichment — the column already renders without it.
        return fetchNewsArticle(leadId)
          .then(detail => {
            if (!cancelled) setLeadDetail(detail);
          })
          .catch(() => undefined);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const leadIndex = pickLead(articles);
  const featured = articles[leadIndex];
  const rest = articles.filter((_, i) => i !== leadIndex);

  return (
    <section className='mt-20 max-md:mt-8'>
      <Container>
        <SectionHeader
          label={t('newsAndHolidays.label')}
          meta={
            <Link
              to='/news'
              className='no-underline text-ed-navy hover:text-ed-red'
            >
              {t('newsAndHolidays.newsroom')}
            </Link>
          }
        />
        <div className='grid grid-cols-[1.6fr_1fr] gap-12 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-6'>
          {/* News column */}
          <div>
            {isLoading ? (
              <NewsColumnSkeleton />
            ) : failed || !featured ? (
              <div className='border-y border-ed-rule py-10'>
                <p className='font-serif-ed text-lg text-ed-ink-3'>
                  {t('newsAndHolidays.unavailable')}
                </p>
                <div className='mt-4'>
                  <ArrowLink to='/news'>
                    {t('newsAndHolidays.newsroom')}
                  </ArrowLink>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to={`/news/${featured.id}`}
                  className='block border-b border-ed-ink pb-8 text-ed-ink no-underline max-md:pb-4'
                >
                  <div className='flex flex-wrap items-baseline gap-3'>
                    <Flag
                      variant={featured.category.id === 6 ? 'outline' : 'navy'}
                    >
                      {featured.category.label}
                    </Flag>
                    <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                      {formatNewsDateLong(featured.publishedAt)}
                    </span>
                    {leadDetail && leadDetail.readingMinutes > 0 && (
                      <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                        ·{' '}
                        {t('newsAndHolidays.readTime', {
                          count: leadDetail.readingMinutes,
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className='mt-4 font-serif-ed text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-0.01em] text-ed-ink max-md:mt-2 max-md:text-[22px]'>
                    {featured.title}
                  </h2>
                  {leadDetail?.excerpt && (
                    <Dropcap className='mt-4 max-w-[680px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-md:mt-2 max-md:text-[14px] max-md:leading-snug'>
                      {leadDetail.excerpt}
                    </Dropcap>
                  )}
                </Link>
                <div className='mt-8 grid gap-x-12 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] max-md:mt-4 max-md:gap-y-4'>
                  {rest.slice(0, 4).map(n => (
                    <Link
                      key={n.id}
                      to={`/news/${n.id}`}
                      className='block text-ed-ink no-underline'
                    >
                      <div className='flex flex-wrap items-baseline gap-3'>
                        <Eyebrow tone='navy'>{n.category.label}</Eyebrow>
                        <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                          {formatNewsDateLong(n.publishedAt)}
                        </span>
                      </div>
                      <h3 className='mt-2 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-ink max-md:mt-1 max-md:text-[17px]'>
                        {n.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <div className='bg-ed-navy p-8 text-white max-md:p-4'>
              <Eyebrow tone='onDark'>
                {t('newsAndHolidays.holidaysEyebrow')} · 2026
              </Eyebrow>
              <h3 className='mt-2 font-serif-ed text-[28px] font-bold tracking-[-0.01em] text-white max-md:mt-1 max-md:text-[21px]'>
                {t('newsAndHolidays.holidaysTitle')}
              </h3>
              <div className='mt-6 border-t border-white/20 max-md:mt-3'>
                {HOLIDAYS_2026.map(h => (
                  <div
                    key={h.date}
                    className='grid grid-cols-[70px_1fr_auto] items-baseline gap-3 border-b border-white/10 py-3.5 max-md:grid-cols-[56px_1fr_auto] max-md:py-2'
                  >
                    <div>
                      <div className='font-serif-ed text-xl tracking-[-0.01em] text-white max-md:text-base'>
                        {h.date}
                      </div>
                      <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/60'>
                        {h.day}
                      </div>
                    </div>
                    <div className='font-serif-ed text-[15px] text-white max-md:text-[14px]'>
                      {h.name}
                    </div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/65'>
                      {h.type}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to='/philippines/holidays'
                className='mt-6 inline-flex items-center gap-1.5 border-b border-white/50 pb-0.5 text-[13px] text-white no-underline max-md:mt-3.5'
              >
                {t('newsAndHolidays.seeAllHolidays')} →
              </Link>
            </div>

            <div className='mt-6 border border-ed-rule bg-white p-7 max-md:mt-3 max-md:p-4'>
              <Eyebrow>{t('newsAndHolidays.hotlinesEyebrow')}</Eyebrow>
              <h3 className='mt-1.5 font-serif-ed text-xl font-semibold text-ed-ink'>
                {t('newsAndHolidays.hotlinesTitle')}
              </h3>
              <div className='mt-4 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2.5 max-md:mt-2.5 max-md:gap-y-1.5'>
                {HOME_HOTLINES.map((h, i) => (
                  <Fragment key={h.name}>
                    <span className='text-sm'>{h.name}</span>
                    {/* The first row carries the red accent, matching the
                        single accented row this card has always had.
                        Ordered by TalaCMS `position`, so that is 911. */}
                    <span
                      className={`font-mono-ed text-sm font-medium ${
                        i === 0 ? 'text-ed-red' : 'text-ed-ink'
                      }`}
                    >
                      {h.numbers[0]}
                    </span>
                  </Fragment>
                ))}
              </div>
              <div className='mt-6 max-md:mt-3.5'>
                <ArrowLink to='/philippines/hotlines'>
                  {t('newsAndHolidays.hotlinesAll')}
                </ArrowLink>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
};

export default NewsAndHolidays;
