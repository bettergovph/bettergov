import { FC, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import Eyebrow from '../ui/Eyebrow';
import Flag from '../ui/Flag';
import ArrowLink from '../ui/ArrowLink';
import Dropcap from '../ui/Dropcap';
import { HOLIDAYS_2026, HOTLINES, NEWS_ITEMS } from './data';

const NewsAndHolidays: FC = () => {
  const { t } = useTranslation('home');
  const [featured, ...rest] = NEWS_ITEMS;

  return (
    <section className='mt-20'>
      <Container>
        <SectionHeader
          label={t('newsAndHolidays.label')}
          meta={
            <Link
              to='/'
              className='no-underline text-ed-navy hover:text-ed-red'
            >
              {t('newsAndHolidays.newsroom')}
            </Link>
          }
        />
        <div className='grid grid-cols-[1.6fr_1fr] gap-12 max-lg:grid-cols-1 max-lg:gap-10'>
          {/* News column */}
          <div>
            <Link
              to='/'
              className='block border-b border-ed-ink pb-8 text-ed-ink no-underline'
            >
              <div className='flex flex-wrap items-baseline gap-3'>
                <Flag variant='navy'>{featured.cat}</Flag>
                <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
                  {featured.date}
                </span>
                {featured.read && (
                  <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-4'>
                    · {featured.read}
                  </span>
                )}
              </div>
              <h2 className='mt-4 font-serif-ed text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-0.01em] text-ed-ink'>
                {featured.title}
              </h2>
              <Dropcap className='mt-4 max-w-[680px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                {featured.excerpt}
              </Dropcap>
            </Link>
            <div className='mt-8 grid gap-x-12 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'>
              {rest.slice(0, 4).map(n => (
                <Link
                  key={n.title}
                  to='/'
                  className='block text-ed-ink no-underline'
                >
                  <div className='flex flex-wrap items-baseline gap-3'>
                    <Eyebrow tone='navy'>{n.cat}</Eyebrow>
                    <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-4'>
                      {n.date}
                    </span>
                  </div>
                  <h3 className='mt-2 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-ink'>
                    {n.title}
                  </h3>
                  <p className='mt-2 text-sm leading-normal text-ed-ink-2'>
                    {n.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className='bg-ed-navy p-8 text-white'>
              <Eyebrow tone='onDark'>
                {t('newsAndHolidays.holidaysEyebrow')} · 2026
              </Eyebrow>
              <h3 className='mt-2 font-serif-ed text-[28px] font-bold tracking-[-0.01em] text-white'>
                {t('newsAndHolidays.holidaysTitle')}
              </h3>
              <div className='mt-6 border-t border-white/20'>
                {HOLIDAYS_2026.map(h => (
                  <div
                    key={h.date}
                    className='grid grid-cols-[70px_1fr_auto] items-baseline gap-3 border-b border-white/10 py-3.5'
                  >
                    <div>
                      <div className='font-serif-ed text-xl tracking-[-0.01em] text-white'>
                        {h.date}
                      </div>
                      <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/60'>
                        {h.day}
                      </div>
                    </div>
                    <div className='font-serif-ed text-[15px] text-white'>
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
                className='mt-6 inline-flex items-center gap-1.5 border-b border-white/50 pb-0.5 text-[13px] text-white no-underline'
              >
                {t('newsAndHolidays.seeAllHolidays')} →
              </Link>
            </div>

            <div className='mt-6 border border-ed-rule bg-white p-7'>
              <Eyebrow>{t('newsAndHolidays.hotlinesEyebrow')}</Eyebrow>
              <h3 className='mt-1.5 font-serif-ed text-xl font-semibold text-ed-ink'>
                {t('newsAndHolidays.hotlinesTitle')}
              </h3>
              <div className='mt-4 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2.5'>
                {HOTLINES.map(h => (
                  <Fragment key={h.label}>
                    <span className='text-sm'>{h.label}</span>
                    <span
                      className={`font-mono-ed text-sm font-medium ${
                        h.accent ? 'text-ed-red' : 'text-ed-ink'
                      }`}
                    >
                      {h.number}
                    </span>
                  </Fragment>
                ))}
              </div>
              <div className='mt-6'>
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
