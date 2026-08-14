import { FC, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import Button from '../../components/v2/ui/Button';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import PlaceholderImage from '../../components/v2/ui/PlaceholderImage';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import { GUIDES, GUIDE_CATEGORIES, GuideCategory, GuideSummary } from './data';
import { cn } from '../../lib/utils';

const guideHref = (g: GuideSummary) =>
  g.id === 'passport' ? '/guides/passport' : `/guides?topic=${g.id}`;

const totalSteps = GUIDES.reduce((s, g) => s + g.steps, 0);

const GuidesIndex: FC = () => {
  const [cat, setCat] = useState<GuideCategory>('All');

  const list = useMemo(
    () =>
      (cat === 'All' ? GUIDES : GUIDES.filter(g => g.cat === cat))
        .slice()
        .sort((a, b) => b.pop - a.pop),
    [cat]
  );

  const primary = GUIDES.find(g => g.featured === 'primary')!;
  const secondary = GUIDES.filter(g => g.id !== primary.id).slice(0, 2);
  const trending = GUIDES.filter(
    g => g.id !== primary.id && !secondary.some(s => s.id === g.id)
  ).slice(0, 6);

  const counts: Record<GuideCategory, number> = useMemo(() => {
    const c = { All: GUIDES.length } as Record<GuideCategory, number>;
    GUIDE_CATEGORIES.forEach(k => {
      if (k === 'All') return;
      c[k] = GUIDES.filter(g => g.cat === k).length;
    });
    return c;
  }, []);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Guides · Plain-language walkthroughs | BetterGov.ph</title>
        <meta
          name='description'
          content='Detailed, step-by-step guides to the most common transactions with the Philippine government. Written in plain language, organized as checklists, and updated when rules change.'
        />
      </Helmet>

      <PageMasthead
        variant='hero'
        eyebrow='§ Guides · Plain-language walkthroughs'
        title={
          <>
            Every step, <em className='italic font-normal'>explained.</em>
          </>
        }
        lede='Detailed, step-by-step guides to the most common transactions with the Philippine government. Written in plain language, organized as checklists, and updated when rules change.'
      >
        <div className='mt-7 grid grid-cols-4 gap-12 border-t border-white/20 pt-6 max-md:grid-cols-2 max-md:gap-6'>
          {[
            { n: GUIDES.length.toString(), l: 'Published guides' },
            { n: (GUIDE_CATEGORIES.length - 1).toString(), l: 'Topics' },
            { n: totalSteps.toString(), l: 'Steps documented' },
            { n: 'Daily', l: 'Updates' },
          ].map(s => (
            <div key={s.l}>
              <div className='font-serif-ed text-[32px] font-medium leading-none text-white'>
                {s.n}
              </div>
              <div className='mt-1.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/70'>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </PageMasthead>

      {/* Category filter bar */}
      <section className='border-y border-ed-rule bg-white'>
        <Container>
          <div className='flex flex-wrap'>
            {GUIDE_CATEGORIES.map((c, i) => (
              <button
                key={c}
                type='button'
                onClick={() => setCat(c)}
                className={cn(
                  'border-r border-ed-rule px-[18px] py-3.5 font-mono-ed text-[11px] uppercase tracking-[0.12em] transition-colors',
                  cat === c
                    ? 'bg-ed-navy text-white'
                    : 'bg-transparent text-ed-ink-2 hover:bg-ed-navy-tint hover:text-ed-navy-ink',
                  i === GUIDE_CATEGORIES.length - 1 && 'border-r-0'
                )}
              >
                {c}
                <span className='ml-2 opacity-65'>{counts[c]}</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured row */}
      <section className='mt-10'>
        <Container>
          <SimpleSectionHead
            label='Most requested this week'
            meta={`Updated ${new Date().toLocaleDateString()}`}
          />
          <div className='grid grid-cols-[1.4fr_1fr_1fr] border border-ed-rule bg-white max-lg:grid-cols-1'>
            <Link
              to={guideHref(primary)}
              className='flex flex-col border-r border-ed-rule p-10 text-ed-ink no-underline max-lg:border-r-0 max-lg:border-b max-md:p-6'
            >
              <Flag variant='red' className='self-start'>
                Most searched
              </Flag>
              <PlaceholderImage height={220} className='my-6'>
                DFA consular lobby photo
              </PlaceholderImage>
              <Eyebrow tone='navy'>
                {primary.agency} · {primary.steps}-step guide · {primary.time}
              </Eyebrow>
              <h2 className='mt-3.5 font-serif-ed text-[36px] font-medium leading-[1.12] tracking-[-0.01em] text-ed-navy-ink'>
                {primary.title}
              </h2>
              <p className='mt-4 max-w-[520px] font-sans-ed text-base leading-relaxed text-ed-ink-2'>
                {primary.lede}
              </p>
              <div className='mt-6 flex flex-wrap gap-5 border-t border-ed-rule pt-4 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                <span>{primary.steps} steps</span>
                <span>{primary.time}</span>
                <span>Updated 3 days ago</span>
              </div>
            </Link>

            <div className='flex flex-col border-r border-ed-rule max-lg:border-r-0 max-lg:border-b'>
              {secondary.map((g, i) => (
                <Link
                  key={g.id}
                  to={guideHref(g)}
                  className={cn(
                    'flex-1 p-7 text-ed-ink no-underline max-md:p-6',
                    i === 0 && 'border-b border-ed-rule'
                  )}
                >
                  <Eyebrow tone='navy'>
                    № 0{i + 2} · {g.agency}
                  </Eyebrow>
                  <h3 className='mt-2.5 font-serif-ed text-[22px] font-medium leading-tight text-ed-navy-ink'>
                    {g.title}
                  </h3>
                  <p className='mt-2.5 text-[13px] leading-normal text-ed-ink-2'>
                    {g.lede}
                  </p>
                  <div className='mt-4 flex gap-3 border-t border-ed-rule pt-3 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    <span>{g.steps} steps</span>
                    <span>·</span>
                    <span>{g.time}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className='bg-ed-paper-2 p-7 max-md:p-6'>
              <Eyebrow className='text-ed-ink-2'>Also trending</Eyebrow>
              <div className='mt-3.5'>
                {trending.map((g, i) => (
                  <Link
                    key={g.id}
                    to={guideHref(g)}
                    className='grid grid-cols-[24px_1fr] gap-3 border-b border-ed-rule py-3 text-ed-ink no-underline last:border-b-0'
                  >
                    <div className='pt-1 font-mono-ed text-[10px] tracking-[0.14em] text-ed-ink-4'>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className='font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                        {g.agency}
                      </div>
                      <div className='mt-0.5 font-serif-ed text-[15px] font-medium leading-tight text-ed-navy-ink'>
                        {g.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className='mt-4'>
                <ArrowLink to='/services'>Browse all services</ArrowLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Full grid */}
      <section className='mt-16 mb-20'>
        <Container>
          <SimpleSectionHead
            label={
              <>
                {cat === 'All' ? 'All guides' : cat}
                <span className='ml-3 font-mono-ed text-xs uppercase tracking-[0.14em] text-ed-ink-3'>
                  {list.length} guides
                </span>
              </>
            }
            meta='Sorted by popularity'
          />

          {list.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No guides in this category yet — but we&rsquo;re writing.
            </div>
          ) : (
            <div className='grid grid-cols-3 border-t-2 border-ed-navy max-lg:grid-cols-2 max-sm:grid-cols-1'>
              {list.map(g => (
                <Link
                  key={g.id}
                  to={guideHref(g)}
                  className='flex min-h-[260px] flex-col gap-3 border-b border-r border-ed-rule bg-white p-7 text-ed-ink no-underline transition-colors hover:bg-ed-navy-tint last:border-r-0 max-lg:[&:nth-child(2n)]:border-r-0 max-lg:[&:nth-child(2n+1)]:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n+1)]:border-r lg:[&:nth-child(3n+2)]:border-r max-sm:!border-r-0'
                >
                  <Flag variant='navy' className='self-start'>
                    {g.cat}
                  </Flag>
                  <div className='font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    {g.agency}
                  </div>
                  <h3 className='font-serif-ed text-[22px] font-medium leading-tight text-ed-navy-ink'>
                    {g.title}
                  </h3>
                  <p className='mb-auto text-[13px] leading-normal text-ed-ink-2'>
                    {g.lede}
                  </p>
                  <div className='flex items-baseline justify-between gap-3 border-t border-dashed border-ed-rule pt-3.5 font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3'>
                    <span>
                      {g.steps} steps · {g.time}
                    </span>
                    <span className='font-sans-ed text-xs font-medium normal-case tracking-normal text-ed-navy'>
                      Read guide →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* CTA band */}
      <section className='border-y border-ed-rule bg-ed-navy-tint py-14'>
        <Container>
          <div className='grid grid-cols-[1fr_auto] items-center gap-12 max-md:grid-cols-1 max-md:gap-6'>
            <div>
              <div className='mb-3'>
                <Eyebrow tone='navy'>Don&rsquo;t see your transaction?</Eyebrow>
              </div>
              <h2 className='m-0 font-serif-ed text-[40px] font-medium leading-tight tracking-[-0.01em] text-ed-navy-ink max-md:text-[30px]'>
                Suggest a guide. We&rsquo;ll write it.
              </h2>
              <p className='mt-3.5 max-w-[560px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                BetterGov.ph is written by volunteers. Every guide starts from a
                real transaction someone needed help understanding. If
                you&rsquo;ve navigated a government process and took notes,
                we&rsquo;d love to publish them.
              </p>
            </div>
            <div className='flex flex-col gap-2.5'>
              <Button as={Link} to='/ideas'>
                <span>Suggest a guide</span> <ArrowRightIcon size={14} />
              </Button>
              <Button
                as='a'
                href='https://github.com/bettergovph/bettergov'
                target='_blank'
                rel='noreferrer'
                variant='ghost'
              >
                <span>Contribute on GitHub</span> <ArrowRightIcon size={14} />
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

const SimpleSectionHead: FC<{
  num: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
}> = ({ num, label, meta }) => (
  <div className='mb-6 grid grid-cols-[auto_1fr_auto] items-baseline gap-6 border-t-2 border-ed-navy py-4 max-md:grid-cols-1 max-md:gap-2'>
    <span className='font-mono-ed text-[11px] tracking-[0.18em] text-ed-navy'>
      {num}
    </span>
    <span className='font-serif-ed text-2xl font-medium text-ed-navy-ink'>
      {label}
    </span>
    {meta && (
      <span className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
        {meta}
      </span>
    )}
  </div>
);

export default GuidesIndex;
