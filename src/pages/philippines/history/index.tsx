import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';

type Era = { yr: string; title: string; blurb: string };
type Entry = { yr: string; era: string; title: string; body: string };
type Number = { num: string; body: string; label: string };

/** Index where the sidebar "scholarly note" appears in the timeline column. */
const SCHOLAR_NOTE_AT = 3;

const PhilippinesHistory: FC = () => {
  const { t } = useTranslation('about-philippines');

  const eras = t('history.eras', { returnObjects: true }) as Era[];
  const entries = t('history.entries', { returnObjects: true }) as Entry[];
  const numbers = t('history.byTheNumbers.items', {
    returnObjects: true,
  }) as Number[];

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title={
          <>
            {t('history.hero.title')}{' '}
            <em className='italic font-normal'>
              {t('history.hero.titleEmphasis')}
            </em>{' '}
            {t('history.hero.titleSuffix')}
          </>
        }
        lede={t('history.hero.description')}
      >
        {/* Era strip */}
        <div className='mt-10 grid grid-cols-6 divide-x divide-white/20 max-lg:grid-cols-3 max-lg:divide-y max-md:grid-cols-2 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y'>
          {eras.map(e => (
            <div key={e.title} className='px-4 py-5 text-white/85'>
              <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/60'>
                {e.yr}
              </div>
              <h4 className='mt-1.5 font-serif-ed text-lg font-semibold text-white'>
                {e.title}
              </h4>
              <p className='mt-1.5 text-xs leading-normal text-white/75'>
                {e.blurb}
              </p>
            </div>
          ))}
        </div>
      </PageMasthead>

      {/* Timeline */}
      <section className='mt-16'>
        <Container>
          <SectionHeader
            label={t('history.entriesSectionLabel')}
            meta={t('history.entriesSectionMeta')}
          />

          <div className='relative ml-10 border-l-2 border-ed-navy pl-8 max-sm:ml-5 max-sm:pl-6'>
            {entries.map((e, i) => (
              <article key={e.title} className='relative pb-12 last:pb-0'>
                <span
                  aria-hidden
                  className='absolute -left-[41px] top-2.5 h-4 w-4 border-4 border-white bg-ed-navy max-sm:-left-[25px] max-sm:h-3 max-sm:w-3'
                />
                <div className='font-mono-ed text-[11px] uppercase tracking-[0.18em] text-ed-ink-3'>
                  {e.yr}
                </div>
                <h3 className='mt-2 font-serif-ed text-[32px] font-semibold leading-tight text-ed-navy-ink max-md:text-[26px]'>
                  {e.title}
                </h3>
                <span className='mt-3 inline-block bg-ed-navy-tint px-2 py-[3px] font-mono-ed text-[9px] uppercase tracking-[0.16em] text-ed-navy-ink'>
                  {e.era}
                </span>
                {i === SCHOLAR_NOTE_AT && (
                  <aside className='float-right mb-5 ml-9 w-[280px] border border-ed-rule border-l-[3px] border-l-ed-navy bg-white px-5 py-4 max-lg:float-none max-lg:mx-0 max-lg:my-4 max-lg:w-auto'>
                    <h5 className='mb-2 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-navy'>
                      {t('history.scholarNote.title')}
                    </h5>
                    <p className='m-0 font-sans-ed text-sm leading-normal text-ed-ink-2'>
                      {t('history.scholarNote.body')}
                    </p>
                  </aside>
                )}
                <p className='mt-3 max-w-[680px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                  {e.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* By the numbers */}
      <section className='my-14 border-y border-ed-rule bg-ed-navy-tint py-10'>
        <Container>
          <div className='mb-3'>
            <Eyebrow className='text-ed-navy-ink'>
              {t('history.byTheNumbers.eyebrow')}
            </Eyebrow>
          </div>
          <div className='grid grid-cols-3 gap-8 max-lg:grid-cols-1 max-lg:gap-6'>
            {numbers.map(n => (
              <div key={n.label}>
                <h3 className='m-0 font-serif-ed text-[40px] font-semibold leading-none text-ed-navy-ink'>
                  {n.num}
                </h3>
                <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>
                  {n.body}
                </p>
                <div className='mt-1.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  {n.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Next cards */}
      <section className='mb-20 mt-16'>
        <Container>
          <div className='grid grid-cols-2 gap-12 max-md:grid-cols-1 max-md:gap-6'>
            <NextCard
              to='/philippines/culture'
              eyebrow={t('history.nextCards.culture.eyebrow')}
              title={t('history.nextCards.culture.title')}
              desc={t('history.nextCards.culture.desc')}
              cta={t('history.nextCards.culture.cta')}
            />
            <NextCard
              to='/philippines/regions'
              eyebrow={t('history.nextCards.regions.eyebrow')}
              title={t('history.nextCards.regions.title')}
              desc={t('history.nextCards.regions.desc')}
              cta={t('history.nextCards.regions.cta')}
            />
          </div>
        </Container>
      </section>
    </main>
  );
};

const NextCard: FC<{
  to: string;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
}> = ({ to, eyebrow, title, desc, cta }) => (
  <Link
    to={to}
    className='block border border-ed-rule bg-white p-8 text-ed-ink no-underline transition-colors hover:border-ed-ink'
  >
    <div className='mb-3'>
      <Eyebrow>{eyebrow}</Eyebrow>
    </div>
    <h3 className='m-0 font-serif-ed text-[28px] font-semibold text-ed-navy-ink'>
      {title}
    </h3>
    <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>{desc}</p>
    <div className='mt-4 flex items-center gap-1.5 text-[13px] font-medium text-ed-navy'>
      {cta} <ArrowRightIcon size={14} />
    </div>
  </Link>
);

export default PhilippinesHistory;
