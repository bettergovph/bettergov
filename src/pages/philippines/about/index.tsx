import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import ArrowLink from '../../../components/v2/ui/ArrowLink';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';

type FactItem = { num: string; sub: string; desc: string };
type SymbolItem = {
  swatch: string;
  label: string;
  title: string;
  desc: string;
};
type GovItem = { label: string; body: string };
type ExploreItem = { title: string; desc: string; href: string };

const factIds = ['islands', 'population', 'area', 'languages'] as const;
const symbolIds = ['flag', 'anthem', 'seal', 'bird', 'tree', 'flower'] as const;
const govIds = [
  'executive',
  'legislative',
  'judicial',
  'constitutional',
  'local',
] as const;
const exploreIds = ['history', 'culture', 'regions', 'map'] as const;

const swatchTone: Record<(typeof symbolIds)[number], string> = {
  flag: 'bg-gradient-to-b from-[#0038A8] from-50% to-[#CE1126] to-50% text-white/0',
  anthem:
    'bg-[repeating-linear-gradient(0deg,transparent_0_14px,rgba(11,79,217,0.12)_14px_15px)] text-ed-navy-ink',
  seal: 'bg-[radial-gradient(circle,#FCD116_0%_40%,#0038A8_42%_55%,#CE1126_57%_100%)] text-transparent',
  bird: 'bg-ed-paper-2 text-ed-navy-ink',
  tree: 'bg-ed-paper-3 text-ed-navy-ink',
  flower: 'bg-[#fff5e6] text-[#b4750a]',
};

/** Render a translated string that may contain **bold** markdown. */
const renderBold = (text: string): ReactNode => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>
  );
};

const AboutPhilippines: FC = () => {
  const { t } = useTranslation('about-philippines');

  const factItems = factIds.map(id => ({
    id,
    ...(t(`about.factbox.items.${id}`, { returnObjects: true }) as FactItem),
  }));
  const overviewParagraphs = t('about.overview.paragraphs', {
    returnObjects: true,
  }) as string[];
  const symbolItems = symbolIds.map(id => ({
    id,
    ...(t(`about.symbols.items.${id}`, { returnObjects: true }) as SymbolItem),
  }));
  const govItems = govIds.map(id => ({
    id,
    ...(t(`about.government.items.${id}`, { returnObjects: true }) as GovItem),
  }));
  const exploreItems = exploreIds.map(id => ({
    id,
    ...(t(`about.explore.items.${id}`, { returnObjects: true }) as ExploreItem),
  }));

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        eyebrow={t('about.hero.eyebrow')}
        title={
          <>
            {t('about.hero.title')}{' '}
            <em className='italic font-normal'>
              {t('about.hero.titleEmphasis')}
            </em>{' '}
            {t('about.hero.titleSuffix')}
          </>
        }
        lede={t('about.hero.description')}
      />

      {/* Factbox */}
      <section className='py-10'>
        <Container>
          <div className='grid grid-cols-4 border-y border-ed-rule divide-x divide-y divide-ed-rule max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:divide-x-0'>
            {factItems.map(f => (
              <div key={f.id} className='px-6 py-7'>
                <div className='font-serif-ed text-[42px] font-semibold leading-none text-ed-navy-ink'>
                  {f.num}
                </div>
                <div className='mt-2.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  {f.sub}
                </div>
                <div className='mt-1.5 text-[13px] leading-snug text-ed-ink-2'>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* §01 What is the Philippines */}
      <section className='mt-16'>
        <Container>
          <SectionHeader
            label={t('about.overview.title')}
            meta={t('about.overview.meta')}
          />
          <div className='grid grid-cols-2 gap-x-12 max-lg:grid-cols-1 max-lg:gap-y-4'>
            <div>
              {overviewParagraphs.slice(0, 2).map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    'mb-4 font-sans-ed text-lg leading-relaxed text-ed-ink-2',
                    i === 0 &&
                      'first-letter:float-left first-letter:pr-2.5 first-letter:pt-1.5 first-letter:font-serif-ed first-letter:text-[72px] first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-ed-navy-ink'
                  )}
                >
                  {p}
                </p>
              ))}
            </div>
            <div>
              {overviewParagraphs.slice(2).map((p, i) => (
                <p
                  key={i}
                  className='mb-4 font-sans-ed text-lg leading-relaxed text-ed-ink-2'
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          <blockquote className='my-9 border-l-[3px] border-ed-navy py-2 pl-6 font-sans-ed text-[26px] italic leading-snug text-ed-navy-ink'>
            &ldquo;{t('about.overview.pullquote.body')}&rdquo;
            <footer className='mt-2.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] not-italic text-ed-ink-3'>
              {t('about.overview.pullquote.source')}
            </footer>
          </blockquote>
        </Container>
      </section>

      {/* §02 National symbols */}
      <section className='mt-16'>
        <Container>
          <SectionHeader
            label={t('about.symbols.title')}
            meta={t('about.symbols.meta')}
          />
          <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
            {symbolItems.map(s => (
              <div key={s.id} className='border border-ed-rule bg-white p-7'>
                <div
                  className={cn(
                    'mb-5 flex h-[100px] items-center justify-center border border-ed-rule font-mono-ed text-[11px] uppercase tracking-[0.1em]',
                    swatchTone[s.id]
                  )}
                >
                  {s.swatch}
                </div>
                <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  {s.label}
                </div>
                <h3 className='mt-2 font-serif-ed text-[22px] font-semibold text-ed-navy-ink'>
                  {s.title}
                </h3>
                <p className='mt-2 text-sm leading-normal text-ed-ink-2'>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* §03 + §04 split */}
      <section className='mt-20 mb-20'>
        <Container>
          <div className='grid grid-cols-2 gap-16 max-lg:grid-cols-1 max-lg:gap-12'>
            <div>
              <SectionHeader label={t('about.government.title')} />
              <div className='border-t-2 border-ed-navy'>
                {govItems.map(g => (
                  <div
                    key={g.id}
                    className='grid grid-cols-[120px_1fr] gap-8 border-b border-ed-rule py-5 max-sm:grid-cols-[80px_1fr] max-sm:gap-4'
                  >
                    <div className='font-serif-ed text-[28px] font-semibold text-ed-navy-ink'>
                      {g.label}
                    </div>
                    <div className='font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                      {renderBold(g.body)}
                    </div>
                  </div>
                ))}
              </div>
              <div className='mt-6'>
                <ArrowLink to='/government/departments'>
                  {t('about.government.directoryCta')}
                </ArrowLink>
              </div>
            </div>

            <div>
              <SectionHeader label={t('about.explore.title')} />
              <div className='border-t-2 border-ed-navy'>
                {exploreItems.map(e => (
                  <Link
                    key={e.id}
                    to={e.href}
                    className='grid grid-cols-[1fr_auto] items-center border-b border-ed-rule py-5 text-ed-ink no-underline'
                  >
                    <div>
                      <div className='font-serif-ed text-2xl font-semibold text-ed-navy-ink'>
                        {e.title}
                      </div>
                      <div className='mt-1 text-sm text-ed-ink-2'>{e.desc}</div>
                    </div>
                    <ArrowRightIcon size={14} className='text-ed-navy' />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default AboutPhilippines;
