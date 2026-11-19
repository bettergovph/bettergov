import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import ArrowLink from '../../../components/v2/ui/ArrowLink';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';
import { SITE_URL } from '../../../lib/brand';

type FactItem = { num: string; sub: string; desc: string };
type SymbolItem = {
  label: string;
  title: string;
  desc: string;
  imageAlt: string;
};
type ExploreItem = { title: string; desc: string; href: string };

const factIds = ['islands', 'population', 'area', 'languages'] as const;
const symbolIds = ['flag', 'anthem', 'seal', 'bird', 'tree', 'flower'] as const;
const exploreIds = [
  'history',
  'culture',
  'regions',
  'map',
  'government',
] as const;

type SymbolMedia = {
  src: string;
  credit: string;
  source: string;
  fit?: 'contain' | 'cover';
};

// The coat of arms is described but not shown: the site does not use the
// coat of arms or seal of the Philippines (see src/lib/brand.ts).
const symbolMedia: Record<(typeof symbolIds)[number], SymbolMedia | null> = {
  flag: {
    src: '/assets/philippines/flag-of-the-philippines.svg',
    credit: 'Public domain · Wikimedia Commons',
    source:
      'https://commons.wikimedia.org/wiki/File:Flag_of_the_Philippines.svg',
    fit: 'contain',
  },
  anthem: {
    src: '/assets/philippines/lupang-hinirang.webp',
    credit: 'Score by Pizzacito · Public domain',
    source:
      'https://commons.wikimedia.org/wiki/File:Lupang_Hinirang_Vocal_Sheet.png',
  },
  seal: {
    src: '/assets/philippines/coat-of-arms-of-the-philippines.webp',
    credit: 'Galo Ocampo · Public domain',
    source:
      'https://commons.wikimedia.org/wiki/File:Coat_of_arms_of_the_Philippines.svg',
    fit: 'contain',
  },
  bird: {
    src: '/assets/philippines/philippine-eagle.webp',
    credit: 'Shankar S. · CC BY 2.0',
    source:
      'https://commons.wikimedia.org/wiki/File:Philippine_eagle_Pithecophaga_jefferyi.jpg',
  },
  tree: {
    src: '/assets/philippines/narra.webp',
    credit: 'Obsidian Soul · CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Narra_tree_(Pterocarpus_indicus).jpg',
  },
  flower: {
    src: '/assets/philippines/sampaguita.webp',
    credit: 'Marife.altabano · CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Sampaguita_Jasmine.jpg',
  },
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
  const exploreItems = exploreIds.map(id => ({
    id,
    ...(t(`about.explore.items.${id}`, { returnObjects: true }) as ExploreItem),
  }));

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>About the Philippines | BETTERGOV.PH</title>
        <meta
          name='description'
          content='A source-backed introduction to the Philippines: geography, population, national symbols, history, culture, and regions.'
        />
        <link rel='canonical' href={`${SITE_URL}/philippines/about`} />
      </Helmet>

      <PageMasthead
        variant='hero'
        title={t('about.hero.title')}
        lede={t('about.hero.description')}
      />

      {/* Factbox */}
      <section className='py-10 max-md:py-6'>
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

      {/* 01 What is the Philippines */}
      <section className='mt-16 max-md:mt-8'>
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
        </Container>
      </section>

      {/* 02 National symbols */}
      <section className='mt-16 max-md:mt-8'>
        <Container>
          <SectionHeader
            label={t('about.symbols.title')}
            meta={t('about.symbols.meta')}
          />
          <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
            {symbolItems.map(s => {
              const media = symbolMedia[s.id];
              return (
                <figure
                  key={s.id}
                  className='flex h-full flex-col border border-ed-rule bg-white p-5'
                >
                  {media && (
                    <div className='mb-5 aspect-[3/2] overflow-hidden border border-ed-rule bg-ed-paper-2'>
                      <img
                        src={media.src}
                        alt={s.imageAlt}
                        width={960}
                        height={640}
                        loading='lazy'
                        decoding='async'
                        className={cn(
                          'h-full w-full',
                          media.fit === 'contain'
                            ? 'object-contain p-6'
                            : 'object-cover'
                        )}
                      />
                    </div>
                  )}
                  <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                    {s.label}
                  </div>
                  <h3 className='mt-2 font-serif-ed text-[22px] font-semibold text-ed-navy-ink max-md:text-[18px]'>
                    {s.title}
                  </h3>
                  <p className='mt-2 text-sm leading-normal text-ed-ink-2'>
                    {s.desc}
                  </p>
                  {media && (
                    <figcaption className='mt-auto pt-4 font-mono-ed text-[9px] uppercase tracking-[0.08em] text-ed-ink-3'>
                      <a
                        href={media.source}
                        target='_blank'
                        rel='noreferrer'
                        className='text-ed-ink-3 underline decoration-ed-rule-strong underline-offset-2 hover:text-ed-navy'
                      >
                        {media.credit}
                      </a>
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Continue exploring */}
      {/* 03 + 04 split */}
      <section className='mt-20 mb-20 max-md:mb-10 max-md:mt-8'>
        <Container>
          <SectionHeader label={t('about.explore.title')} />
          <div className='grid grid-cols-2 border-t-2 border-ed-navy max-md:grid-cols-1'>
            {exploreItems.map(e => (
              <Link
                key={e.id}
                to={e.href}
                className='grid min-h-28 grid-cols-[1fr_auto] items-center border-b border-ed-rule px-5 py-5 text-ed-ink no-underline transition-colors odd:border-r hover:bg-ed-navy-tint max-md:border-r-0'
              >
                <div>
                  <div className='font-serif-ed text-2xl font-semibold text-ed-navy-ink'>
                    {e.title}
                  </div>
                  <div className='mt-1 max-w-[48ch] text-sm text-ed-ink-2'>
                    {e.desc}
                  </div>
                </div>
                <ArrowRightIcon size={14} className='text-ed-navy' />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className='border-y border-ed-rule bg-ed-paper-2 py-10 max-md:py-7'>
        <Container>
          <div className='max-w-[900px]'>
            <SectionHeader
              label='Sources'
              meta='Facts last verified 8 September 2026'
            />
            <p className='max-w-[72ch] text-sm leading-relaxed text-ed-ink-2'>
              Population and administrative counts come from the Philippine
              Statistics Authority. Geography is based on Philippine government
              references, while the national symbols are defined by Republic Act
              No. 8491 and presidential proclamations.
            </p>
            <div className='mt-5 flex flex-wrap gap-x-6 gap-y-3'>
              <ArrowLink
                to='https://psa.gov.ph/statistics/population-and-housing/node/1684077791'
                external
              >
                2024 Census
              </ArrowLink>
              <ArrowLink
                to='https://psa.gov.ph/classification/psgc/summary'
                external
              >
                Geographic code summary
              </ArrowLink>
              <ArrowLink
                to='https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/4626'
                external
              >
                Flag and Heraldic Code
              </ArrowLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default AboutPhilippines;
