import { FC, ReactNode, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowDownIcon, ArrowRightIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import Button from '../../components/v2/ui/Button';
import Card from '../../components/v2/ui/Card';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import BigSearch from '../../components/v2/ui/BigSearch';
import {
  COAT_OF_ARMS_ALT,
  COAT_OF_ARMS_SRC,
  REPO_URL,
  SITE_NAME,
  SITE_OWNER,
} from '../../lib/brand';
import { cn } from '../../lib/utils';

const CHAPTERS = [
  { id: 'brand', num: '01', label: 'The brand' },
  { id: 'mark', num: '02', label: 'The mark' },
  { id: 'colour', num: '03', label: 'Colour' },
  { id: 'type', num: '04', label: 'Typography' },
  { id: 'voice', num: '05', label: 'Voice' },
  { id: 'in-use', num: '06', label: 'In use' },
];

/** Chapter opener: oversized number, small label, display title. */
const ChapterHead: FC<{
  num: string;
  label: string;
  title: ReactNode;
  onDark?: boolean;
}> = ({ num, label, title, onDark }) => (
  <div className='mb-14 max-md:mb-10'>
    <div
      className={cn(
        'flex items-baseline gap-4 border-b pb-4',
        onDark ? 'border-white/30' : 'border-ed-ink'
      )}
    >
      <span
        className={cn(
          'font-serif-ed text-[clamp(40px,6vw,72px)] font-bold leading-none',
          onDark ? 'text-white/60' : 'text-ed-navy'
        )}
      >
        {num}
      </span>
      <span
        className={cn(
          'font-mono-ed text-[11px] font-medium uppercase tracking-[0.2em]',
          onDark ? 'text-white/70' : 'text-ed-ink-3'
        )}
      >
        {label}
      </span>
    </div>
    <h2
      className={cn(
        'mt-8 max-w-4xl font-serif-ed text-[clamp(34px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.02em]',
        onDark ? 'text-white' : 'text-ed-ink'
      )}
    >
      {title}
    </h2>
  </div>
);

/** A large presentation colour plate. */
const Plate: FC<{
  bg: string;
  ink: string;
  name: string;
  hex: string;
  usage: string;
  tall?: boolean;
  border?: boolean;
}> = ({ bg, ink, name, hex, usage, tall, border }) => (
  <div
    className={cn(
      'flex flex-col justify-between p-6',
      bg,
      ink,
      tall ? 'min-h-[300px] max-md:min-h-[200px]' : 'min-h-[180px]',
      border && 'border border-ed-rule'
    )}
  >
    <div className='font-serif-ed text-xl font-bold leading-tight'>{name}</div>
    <div>
      <div className='font-mono-ed text-[12px] uppercase tracking-[0.1em]'>
        {hex}
      </div>
      <div className='mt-1 max-w-[260px] font-sans-ed text-[13px] leading-snug'>
        {usage}
      </div>
    </div>
  </div>
);

const SAY_INSTEAD: Array<[string, string]> = [
  ['apply', 'avail of'],
  ['get', 'secure'],
  ['start', 'commence'],
  ['use', 'utilize'],
  ['help', 'assistance may be provided'],
];

const BrandGuidePage: FC = () => {
  const [searchDemo, setSearchDemo] = useState('');

  return (
    <main className='bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Design — GOV.PH Brand Guidelines | GOV.PH</title>
        <meta
          name='description'
          content='The GOV.PH brand guidelines as a presentation: the mark, the colour system, the typography, and the voice of Philippine government digital services.'
        />
        <link rel='canonical' href='https://www.gov.ph/design' />
      </Helmet>

      {/* ------------------------------------------------ Cover */}
      <section className='flex min-h-[88vh] flex-col justify-between bg-ed-navy-2 py-14 text-white max-md:min-h-[70vh]'>
        <Container className='flex items-center justify-between'>
          <span className='font-mono-ed text-[11px] uppercase tracking-[0.2em] text-white/70'>
            {SITE_OWNER}
          </span>
          <span className='font-mono-ed text-[11px] uppercase tracking-[0.2em] text-white/70 max-md:hidden'>
            2026 Edition · Draft
          </span>
        </Container>
        <Container>
          <img
            src={COAT_OF_ARMS_SRC}
            alt={COAT_OF_ARMS_ALT}
            className='h-24 w-auto max-md:h-16'
          />
          <h1 className='mt-8 font-serif-ed text-[clamp(56px,11vw,160px)] font-bold leading-[0.95] tracking-[-0.03em]'>
            {SITE_NAME}
            <span className='block text-[clamp(28px,4.5vw,64px)] font-bold text-white/80'>
              Brand Guidelines
            </span>
          </h1>
        </Container>
        <Container className='flex flex-wrap items-end justify-between gap-6'>
          <div className='max-w-md'>
            <p className='font-sans-ed text-base leading-relaxed text-white/85'>
              How the digital front door of the Philippine government looks,
              reads, and behaves — so that every service feels like one
              government.
            </p>
            <Link
              to='/design/overview'
              className='mt-6 inline-flex h-11 items-center justify-center gap-2.5 bg-white px-6 font-sans-ed text-sm font-semibold text-ed-navy-ink no-underline transition-colors hover:bg-ed-navy-tint'
            >
              Learn more <ArrowRightIcon size={15} aria-hidden />
            </Link>
          </div>
          <a
            href='#contents'
            className='inline-flex items-center gap-2 font-mono-ed text-[11px] uppercase tracking-[0.16em] text-white no-underline hover:text-white/70'
          >
            Begin <ArrowDownIcon size={14} aria-hidden />
          </a>
        </Container>
      </section>

      {/* ------------------------------------------------ Chapter strip */}
      <nav
        aria-label='Brand guide chapters'
        className='sticky top-0 z-30 border-b border-ed-rule bg-white'
      >
        <Container className='flex items-center gap-1 overflow-x-auto py-0'>
          {CHAPTERS.map(c => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className='flex shrink-0 items-baseline gap-2 px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-2 no-underline transition-colors hover:bg-ed-navy-tint hover:text-ed-navy max-md:px-3'
            >
              <span className='text-ed-ink-3'>{c.num}</span>
              <span>{c.label}</span>
            </a>
          ))}
          <Link
            to='/design/overview'
            className='ml-auto flex shrink-0 items-center gap-2 px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-navy no-underline hover:text-ed-red'
          >
            Learn more <ArrowRightIcon size={12} aria-hidden />
          </Link>
        </Container>
      </nav>

      {/* ------------------------------------------------ Contents */}
      <section id='contents' className='scroll-mt-12 py-20 max-md:py-12'>
        <Container>
          <div className='grid gap-10 lg:grid-cols-[1fr_2fr]'>
            <h2 className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.2em] text-ed-ink-3'>
              Contents
            </h2>
            <ol className='divide-y divide-ed-rule border-y border-ed-rule'>
              {CHAPTERS.map(c => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className='group flex items-baseline gap-6 py-5 no-underline'
                  >
                    <span className='font-serif-ed text-2xl font-bold text-ed-navy transition-colors group-hover:text-ed-red'>
                      {c.num}
                    </span>
                    <span className='font-serif-ed text-[clamp(22px,3vw,34px)] font-semibold text-ed-ink transition-colors group-hover:text-ed-red'>
                      {c.label}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ 01 The brand */}
      <section
        id='brand'
        className='scroll-mt-12 border-t border-ed-rule bg-ed-paper-2 py-20 max-md:py-12'
      >
        <Container>
          <ChapterHead
            num='01'
            label='The brand'
            title='One government, one front door.'
          />
          <div className='grid gap-12 lg:grid-cols-2'>
            <p className='font-serif-ed text-[clamp(22px,2.6vw,32px)] font-semibold leading-snug text-ed-ink'>
              To the public there is no DFA, no DILG, no LGU — there is only the
              government. The brand exists to make thousands of services feel
              like one calm, credible place.
            </p>
            <div className='space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
              <p>
                The identity is deliberately quiet: ink on paper, ruled lines, a
                single working blue, and one red held in reserve for urgency. It
                borrows the discipline of a broadsheet and the bluntness of a
                government form — nothing decorative, nothing that competes with
                the task someone came to finish.
              </p>
              <p>
                Everything in this guide ships as code in the GOV.PH design
                system, published under the CC BY-NC-ND 4.0 license.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ 02 The mark */}
      <section id='mark' className='scroll-mt-12 py-20 max-md:py-12'>
        <Container>
          <ChapterHead
            num='02'
            label='The mark'
            title='The arms, the wordmark, the lockup.'
          />
          <div className='grid gap-6 lg:grid-cols-2'>
            <div className='flex min-h-[320px] items-center justify-center border border-ed-rule bg-white p-10'>
              <span className='inline-flex items-center gap-4'>
                <img
                  src={COAT_OF_ARMS_SRC}
                  alt={COAT_OF_ARMS_ALT}
                  className='h-20 w-auto'
                />
                <span>
                  <span className='block font-serif-ed text-4xl font-bold leading-none text-ed-navy-ink'>
                    {SITE_NAME}
                  </span>
                  <span className='mt-1.5 block font-sans-ed text-[13px] text-ed-ink-3'>
                    {SITE_OWNER}
                  </span>
                </span>
              </span>
            </div>
            <div className='flex min-h-[320px] items-center justify-center bg-ed-navy-2 p-10'>
              <span className='inline-flex items-center gap-4'>
                <img src={COAT_OF_ARMS_SRC} alt='' className='h-20 w-auto' />
                <span>
                  <span className='block font-serif-ed text-4xl font-bold leading-none text-white'>
                    {SITE_NAME}
                  </span>
                  <span className='mt-1.5 block font-sans-ed text-[13px] text-white/80'>
                    {SITE_OWNER}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className='mt-10 grid gap-x-10 gap-y-6 md:grid-cols-3'>
            {[
              {
                rule: 'Give it room',
                body: 'Keep clear space around the lockup equal to the height of the wordmark. Nothing sits inside it.',
              },
              {
                rule: 'Never redraw it',
                body: 'The coat of arms is used as supplied — never stretched, recoloured, outlined, or given effects.',
              },
              {
                rule: 'Two grounds only',
                body: 'The lockup sits on paper white or the navy band. Never on photography, gradients, or red.',
              },
            ].map(item => (
              <div key={item.rule} className='border-t-2 border-ed-ink pt-3'>
                <h3 className='font-serif-ed text-lg font-semibold text-ed-ink'>
                  {item.rule}
                </h3>
                <p className='mt-2 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ 03 Colour */}
      <section
        id='colour'
        className='scroll-mt-12 border-t border-ed-rule bg-ed-paper-2 py-20 max-md:py-12'
      >
        <Container>
          <ChapterHead
            num='03'
            label='Colour'
            title='Ink, paper, one blue — and a red held in reserve.'
          />
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Plate
              bg='bg-ed-navy'
              ink='text-white'
              name='Republic Blue'
              hex='#0B4FD9 · ed-navy'
              usage='Links, primary buttons, active states. The only interactive colour.'
              tall
            />
            <Plate
              bg='bg-ed-navy-2'
              ink='text-white'
              name='Band Navy'
              hex='#0A44BD · ed-navy-2'
              usage='Hero and masthead bands. Flat, never a gradient.'
              tall
            />
            <Plate
              bg='bg-ed-ink'
              ink='text-white'
              name='Ink'
              hex='#0C1B33 · ed-ink'
              usage='Headings and primary text. The voice of the page.'
              tall
            />
            <Plate
              bg='bg-ed-red'
              ink='text-white'
              name='Alert Red'
              hex='#C8102E · ed-red'
              usage='Urgency only: advisories and emergencies. If everything is red, nothing is.'
              tall
            />
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Plate
              bg='bg-white'
              ink='text-ed-ink'
              name='Paper'
              hex='#FFFFFF · ed-paper'
              usage='The default ground. Most of every page is paper.'
              border
            />
            <Plate
              bg='bg-ed-paper-2'
              ink='text-ed-ink'
              name='Paper Tint'
              hex='#F4F7FC · ed-paper-2'
              usage='Tinted sections and light mastheads.'
              border
            />
            <Plate
              bg='bg-ed-sage'
              ink='text-white'
              name='Sage'
              hex='#4A6B5A · ed-sage'
              usage='Rare editorial accent. Never interactive.'
            />
            <Plate
              bg='bg-ed-gold'
              ink='text-ed-ink'
              name='Gold'
              hex='#B8893A · ed-gold'
              usage='Rare editorial accent. Never interactive, never for text.'
            />
          </div>

          <div className='mt-12'>
            <h3 className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.16em] text-ed-ink-3'>
              Proportion — most pages are paper
            </h3>
            <div
              className='mt-3 flex h-10 overflow-hidden border border-ed-rule'
              role='img'
              aria-label='Colour proportion: roughly 70 percent paper, 20 percent ink, 8 percent blue, 2 percent red'
            >
              <div className='w-[70%] bg-white' />
              <div className='w-[20%] bg-ed-ink' />
              <div className='w-[8%] bg-ed-navy' />
              <div className='w-[2%] bg-ed-red' />
            </div>
            <p className='mt-3 max-w-2xl font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              Every documented text pairing meets WCAG 2.1 AA. The full token
              scale, with contrast notes, lives in the{' '}
              <Link
                to='/design/styles'
                className='text-ed-navy underline underline-offset-2 hover:text-ed-red'
              >
                styles documentation
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ 04 Typography */}
      <section id='type' className='scroll-mt-12 py-20 max-md:py-12'>
        <Container>
          <ChapterHead
            num='04'
            label='Typography'
            title='Figtree speaks. Inter works. Mono labels.'
          />
          <div className='grid min-w-0 gap-6 lg:grid-cols-[3fr_2fr]'>
            <div className='min-w-0 border border-ed-rule bg-white p-8 max-md:p-5'>
              <div className='font-serif-ed text-[clamp(120px,16vw,220px)] font-bold leading-none tracking-[-0.03em] text-ed-ink'>
                Aa
              </div>
              <div className='mt-6 border-t border-ed-rule pt-4'>
                <div className='font-serif-ed text-[22px] font-bold leading-relaxed text-ed-ink [overflow-wrap:anywhere]'>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div className='font-serif-ed text-[22px] font-semibold leading-relaxed text-ed-ink-2 [overflow-wrap:anywhere]'>
                  abcdefghijklmnopqrstuvwxyz 0123456789 ₱%&
                </div>
              </div>
              <div className='mt-4 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                Figtree · Display — titles, headings, figures · semibold & bold
                only
              </div>
            </div>
            <div className='flex min-w-0 flex-col gap-6'>
              <div className='flex-1 border border-ed-rule bg-white p-8 max-md:p-5'>
                <p className='font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                  Inter carries everything people actually read: body copy,
                  forms, navigation, and answers. Write so a stressed person on
                  a phone understands the first time — short sentences,
                  front-load the answer.
                </p>
                <div className='mt-4 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  Inter · Body & interface
                </div>
              </div>
              <div className='flex-1 border border-ed-rule bg-white p-8 max-md:p-5'>
                <div className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-ink-3'>
                  Section · Government Directory · Updated Weekly
                </div>
                <div className='mt-4 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  JetBrains Mono · Labels & metadata only — never sentences
                </div>
              </div>
            </div>
          </div>
          <p className='mt-8 max-w-2xl font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
            Titles are plain language in upright weights — never italicised,
            never in all caps. One display-size heading per page.
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------ 05 Voice */}
      <section
        id='voice'
        className='scroll-mt-12 bg-ed-ink py-20 text-white max-md:py-12'
      >
        <Container>
          <ChapterHead
            num='05'
            label='Voice'
            title='Plain language, in both languages.'
            onDark
          />
          <div className='grid gap-12 lg:grid-cols-2'>
            <p className='font-serif-ed text-[clamp(22px,2.6vw,32px)] font-semibold leading-snug text-white'>
              We write like a helpful clerk on a good day: direct, warm, and
              never impressed with ourselves. English and Filipino are served as
              equals.
            </p>
            <div>
              <h3 className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.16em] text-white/70'>
                Say — not
              </h3>
              <ul className='mt-4 divide-y divide-white/15 border-y border-white/15'>
                {SAY_INSTEAD.map(([say, not]) => (
                  <li
                    key={say}
                    className='grid grid-cols-2 gap-6 py-3 font-serif-ed text-xl font-semibold'
                  >
                    <span className='text-white'>{say}</span>
                    <span className='text-white/60 line-through decoration-ed-red decoration-2'>
                      {not}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ 06 In use */}
      <section id='in-use' className='scroll-mt-12 py-20 max-md:py-12'>
        <Container>
          <ChapterHead num='06' label='In use' title='The system at work.' />
          <div className='space-y-6'>
            <div className='border border-ed-rule'>
              <PageMasthead
                titleAs='p'
                variant='hero'
                title='Every agency, one directory'
                lede='The executive branch and its departments, each with a verified head of office, trunkline, and official website.'
              >
                <div className='max-w-xl'>
                  <BigSearch
                    value={searchDemo}
                    onChange={setSearchDemo}
                    onSubmit={() => {}}
                    placeholder='Try: passport renewal'
                    ariaLabel='Example search'
                    onDark
                  />
                </div>
              </PageMasthead>
            </div>
            <div className='grid gap-6 lg:grid-cols-2'>
              <div className='flex flex-wrap items-center gap-4 border border-ed-rule bg-ed-paper-2 p-8'>
                <Button>Start a report</Button>
                <Button variant='ghost'>Cancel</Button>
                <Flag variant='navy'>Executive</Flag>
                <Flag variant='red'>Emergency</Flag>
                <Flag>Department</Flag>
              </div>
              <Card to='/guides/passport'>
                <Eyebrow tone='navy'>Guides</Eyebrow>
                <h3 className='mt-3 font-serif-ed text-xl font-semibold text-ed-ink'>
                  Getting a Philippine passport
                </h3>
                <p className='mt-2 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
                  Requirements, fees, and every step from appointment to
                  release.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------ Call to action */}
      <section className='bg-ed-navy-2 py-24 text-white max-md:py-14'>
        <Container>
          <div className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.2em] text-white/70'>
            Start building
          </div>
          <p className='mt-6 max-w-4xl font-serif-ed text-[clamp(34px,5vw,64px)] font-bold leading-[1.02] tracking-[-0.02em]'>
            Built in the open, with citizen volunteers.
          </p>
          <p className='mt-6 max-w-2xl font-sans-ed text-lg leading-relaxed text-white/85'>
            Every style, component, and pattern in this guide is documented in
            full and published as code under CC BY-NC-ND 4.0. Read the
            guidelines, then build your service on them.
          </p>
          <div className='mt-10 flex flex-wrap items-center gap-4'>
            <Link
              to='/design/overview'
              className='inline-flex h-11 items-center justify-center gap-2.5 bg-white px-6 font-sans-ed text-sm font-semibold text-ed-navy-ink no-underline transition-colors hover:bg-ed-navy-tint'
            >
              Read the full guidelines <ArrowRightIcon size={15} aria-hidden />
            </Link>
            <a
              href={REPO_URL}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-11 items-center justify-center gap-2.5 border border-white px-6 font-sans-ed text-sm font-semibold text-white no-underline transition-colors hover:bg-white hover:text-ed-navy-ink'
            >
              Get the source on GitHub
            </a>
          </div>
          <div className='mt-14 flex items-center justify-between border-t border-white/25 pt-6 font-mono-ed text-[11px] uppercase tracking-[0.16em] text-white/70'>
            <span>
              {SITE_NAME} · {SITE_OWNER}
            </span>
            <span>2026 Edition · Draft</span>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default BrandGuidePage;
