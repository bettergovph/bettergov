import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import {
  DocHeading,
  DocSection,
  Example,
  PageHeader,
  Prose,
  Swatch,
  PagerNav,
} from './shared';

const TYPE_SCALE = [
  {
    sample: 'Design once, serve everyone',
    classes:
      'font-serif-ed font-bold text-[clamp(32px,5vw,56px)] leading-none tracking-[-0.02em]',
    label: 'Display · Figtree Bold · clamp(32–56px)',
    usage: 'Page titles inside a masthead. One per page.',
  },
  {
    sample: 'Every agency, one directory',
    classes:
      'font-serif-ed text-[24px] font-semibold leading-tight tracking-[-0.01em]',
    label: 'Section heading · Figtree Semibold · 24px',
    usage: 'Section titles — what the section header component renders.',
  },
  {
    sample: 'Requirements before you apply',
    classes: 'font-serif-ed text-lg font-semibold leading-snug',
    label: 'Sub-heading · Figtree Semibold · 18px',
    usage: 'Sub-sections and card titles within a section.',
  },
  {
    sample:
      'The executive branch and its departments, each with a verified head of office, trunkline, and official website.',
    classes: 'font-sans-ed text-lg leading-relaxed text-ed-ink-2',
    label: 'Lede · Inter · 18px',
    usage: 'Introductory paragraph under a page title.',
  },
  {
    sample:
      'Write so a stressed person on a phone can understand you the first time. Short sentences. Front-load the answer.',
    classes: 'font-sans-ed text-[17px] leading-relaxed text-ed-ink-2',
    label: 'Body · Inter · 17px',
    usage: 'Long-form reading: guides, articles, explanations.',
  },
  {
    sample: 'Search by name, acronym, or head of office',
    classes: 'font-sans-ed text-sm text-ed-ink-2',
    label: 'UI text · Inter · 14px',
    usage: 'Interface copy: buttons, forms, navigation, dense listings.',
  },
  {
    sample: 'Section · Government Directory',
    classes:
      'font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-ink-3',
    label: 'Label · JetBrains Mono · 11px caps',
    usage: 'Eyebrows on cards and strips, tags, table headers, metadata.',
  },
];

const StylesPage: FC = () => (
  <>
    <Helmet>
      <title>Styles — Design System | BetterGov.ph</title>
      <meta
        name='description'
        content='Colour, typography, spacing, and layout styles for BetterGov.ph and Philippine government digital services.'
      />
      <link rel='canonical' href='https://bettergov.ph/design/styles' />
    </Helmet>

    <PageHeader
      title='Styles'
      lede='The raw material of every page: two working typefaces plus a mono for labels, a quiet colour palette checked for contrast, and a layout grid that holds it all together.'
    />

    {/* ------------------------------------------------ Typography */}
    <DocSection first id='typography'>
      <SectionHeader label='Typography' meta='Two faces, one label style' />
      <Prose>
        <p>
          The system uses three typefaces, and each one has exactly one job.
          Mixing their roles is the fastest way to make a page stop looking like
          BetterGov.
        </p>
        <ul className='list-disc space-y-2 pl-5'>
          <li>
            <strong className='text-ed-ink'>Figtree</strong> (
            <code className='font-mono-ed text-[13px]'>font-serif-ed</code>) is
            the display face: page titles, section headings, card titles, and
            stat figures — always semibold or bold. The token name is
            historical; it is not a serif.
          </li>
          <li>
            <strong className='text-ed-ink'>Inter</strong> (
            <code className='font-mono-ed text-[13px]'>font-sans-ed</code>)
            carries everything people read and use: body copy, ledes,
            navigation, buttons, and forms.
          </li>
          <li>
            <strong className='text-ed-ink'>JetBrains Mono</strong> (
            <code className='font-mono-ed text-[13px]'>font-mono-ed</code>)
            carries small structural labels: eyebrows on cards and strips, tags,
            table headers, metadata — always small, usually uppercase, always
            letter-spaced. It never appears in mastheads or navigation.
          </li>
        </ul>
      </Prose>

      <div className='mt-8'>
        <DocHeading>Type scale</DocHeading>
        <div className='divide-y divide-ed-rule border-y border-ed-rule'>
          {TYPE_SCALE.map(t => (
            <div key={t.label} className='py-5'>
              <div className={t.classes}>{t.sample}</div>
              <div className='mt-2 font-mono-ed text-[11px] uppercase tracking-[0.08em] text-ed-ink-3'>
                {t.label}
              </div>
              <div className='font-sans-ed text-[13px] text-ed-ink-3'>
                {t.usage}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-8'>
        <DocHeading>Rules</DocHeading>
        <Prose>
          <ul className='list-disc space-y-2 pl-5'>
            <li>One display-size heading per page, inside the masthead.</li>
            <li>
              Titles are plain language, set in the upright weights — never
              italicised for effect.
            </li>
            <li>
              Never skip heading levels — screen reader users navigate by them.
            </li>
            <li>
              Keep body copy under roughly 70 characters per line. Cap prose
              blocks rather than letting them fill wide columns.
            </li>
            <li>
              Do not use the mono label style for sentences. It is a label, not
              a voice.
            </li>
          </ul>
        </Prose>
      </div>
    </DocSection>

    {/* ------------------------------------------------ Colour */}
    <DocSection id='colour'>
      <SectionHeader label='Colour' meta='bg-ed-* · text-ed-* · border-ed-*' />
      <Prose>
        <p>
          The palette is deliberately quiet: near-black ink on paper white,
          ruled lines, and a single working blue. Red is reserved for urgency,
          and the sage and gold accents appear rarely and never for interactive
          elements. Every pair documented for text meets WCAG&nbsp;2.1&nbsp;AA
          contrast; tokens marked decorative-only fail AA and must never carry
          text.
        </p>
      </Prose>

      <div className='mt-8 space-y-10'>
        <div>
          <DocHeading>Ink — text hierarchy</DocHeading>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            <Swatch
              colorClass='bg-ed-ink'
              token='ed-ink'
              hex='#0c1b33'
              role='Headings and primary text'
            />
            <Swatch
              colorClass='bg-ed-ink-2'
              token='ed-ink-2'
              hex='#2b3a55'
              role='Body copy'
            />
            <Swatch
              colorClass='bg-ed-ink-3'
              token='ed-ink-3'
              hex='#252629'
              role='Secondary text and meta'
            />
            <Swatch
              colorClass='bg-ed-ink-4'
              token='ed-ink-4'
              hex='#8a95aa'
              role='Disabled states and decorative marks only — fails AA (3.0:1), never for text'
            />
          </div>
        </div>

        <div>
          <DocHeading>Paper &amp; rules — surfaces and lines</DocHeading>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            <Swatch
              colorClass='bg-ed-paper'
              token='ed-paper'
              hex='#ffffff'
              role='Default page background'
              border
            />
            <Swatch
              colorClass='bg-ed-paper-2'
              token='ed-paper-2'
              hex='#f4f7fc'
              role='Tinted sections, mastheads'
              border
            />
            <Swatch
              colorClass='bg-ed-paper-3'
              token='ed-paper-3'
              hex='#e6ecf5'
              role='Deeper tint, wells'
              border
            />
            <Swatch
              colorClass='bg-ed-rule'
              token='ed-rule'
              hex='#dbe3ef'
              role='Default borders and dividers'
            />
            <Swatch
              colorClass='bg-ed-rule-strong'
              token='ed-rule-strong'
              hex='#9fb2cc'
              role='Emphasised borders'
            />
          </div>
        </div>

        <div>
          <DocHeading>Navy — the working blue</DocHeading>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            <Swatch
              colorClass='bg-ed-navy'
              token='ed-navy'
              hex='#0b4fd9'
              role='Links, primary buttons, active states'
            />
            <Swatch
              colorClass='bg-ed-navy-2'
              token='ed-navy-2'
              hex='#0a44bd'
              role='Hero and masthead bands; hover state of navy'
            />
            <Swatch
              colorClass='bg-ed-navy-ink'
              token='ed-navy-ink'
              hex='#08286e'
              role='Darkest navy — emphasis text and hover surfaces'
            />
            <Swatch
              colorClass='bg-ed-navy-tint'
              token='ed-navy-tint'
              hex='#e8efff'
              role='Subtle navy background, hover tint'
              border
            />
          </div>
        </div>

        <div>
          <DocHeading>Red &amp; editorial accents</DocHeading>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            <Swatch
              colorClass='bg-ed-red'
              token='ed-red'
              hex='#c8102e'
              role='Urgency: advisories, emergency content, hover accents'
            />
            <Swatch
              colorClass='bg-ed-red-ink'
              token='ed-red-ink'
              hex='#8c0a20'
              role='Dark red for text on light backgrounds'
            />
            <Swatch
              colorClass='bg-ed-sage'
              token='ed-sage'
              hex='#4a6b5a'
              role='Sparing editorial accent — never interactive'
            />
            <Swatch
              colorClass='bg-ed-gold'
              token='ed-gold'
              hex='#b8893a'
              role='Sparing editorial accent — never interactive, not for text'
            />
          </div>
        </div>

        <div>
          <DocHeading>Semantic — status only</DocHeading>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            <Swatch
              colorClass='bg-success-700'
              token='success-700'
              hex='#006939'
              role='Success and confirmation states — safe under white text'
            />
            <Swatch
              colorClass='bg-warning-500'
              token='warning-500'
              hex='#ffb900'
              role='Warnings — pair with dark text and an icon'
            />
            <Swatch
              colorClass='bg-error-600'
              token='error-600'
              hex='#b42525'
              role='Errors and destructive actions'
            />
          </div>
        </div>
      </div>

      <div className='mt-10'>
        <DocHeading>Rules</DocHeading>
        <Prose>
          <ul className='list-disc space-y-2 pl-5'>
            <li>
              Never use colour as the only way to convey meaning — pair it with
              a label or icon.
            </li>
            <li>
              Text on white must use <code>ed-ink</code>, <code>ed-ink-2</code>,
              or <code>ed-ink-3</code>. <code>ed-ink-4</code> fails AA for body
              text.
            </li>
            <li>
              Hero and masthead bands use the single flat blue{' '}
              <code>ed-navy-2</code> — no gradients.
            </li>
            <li>
              Red means something is urgent or wrong. If everything is red,
              nothing is.
            </li>
          </ul>
        </Prose>
      </div>
    </DocSection>

    {/* ------------------------------------------------ Layout */}
    <DocSection id='layout'>
      <SectionHeader
        label='Layout'
        meta='Container · max-w-page / max-w-page-narrow'
      />
      <Prose>
        <p>
          Pages are built from full-width horizontal bands — masthead, content
          sections, footer — each containing a centred{' '}
          <code className='font-mono-ed text-[13px]'>Container</code>. Sections
          are separated by hairline rules (
          <code className='font-mono-ed text-[13px]'>border-ed-rule</code>), not
          drop shadows or floating boxes.
        </p>
      </Prose>
      <Example caption='Container widths'>
        <div className='space-y-3'>
          <div className='border border-ed-rule-strong bg-ed-paper-2 px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-2'>
            Default · max-w-page (1504px) — directories, tables, card grids
          </div>
          <div className='mx-auto w-3/4 border border-ed-rule-strong bg-ed-paper-2 px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-2'>
            Narrow · max-w-page-narrow (1040px) — reading pages, guides,
            articles
          </div>
        </div>
      </Example>
      <Prose>
        <ul className='list-disc space-y-2 pl-5'>
          <li>
            The page widths are design tokens:{' '}
            <code className='font-mono-ed text-[13px]'>--container-page</code>{' '}
            (1504px) and{' '}
            <code className='font-mono-ed text-[13px]'>
              --container-page-narrow
            </code>{' '}
            (1040px), defined once in{' '}
            <code className='font-mono-ed text-[13px]'>index.css</code>. Always
            reach them through the Container component — never hardcode a page
            max-width.
          </li>
          <li>
            Gutters are 18px on mobile, 24px on tablet, and 32px on wide screens
            — the Container handles this for you.
          </li>
          <li>
            Spacing follows a 4px base grid. Mastheads use{' '}
            <code className='font-mono-ed text-[13px]'>py-16</code>; standard
            content sections use{' '}
            <code className='font-mono-ed text-[13px]'>py-12</code>, dropping to{' '}
            <code className='font-mono-ed text-[13px]'>py-8</code> on mobile.
          </li>
          <li>
            Corners are square. The style uses rules and borders, not rounded
            cards or shadows.
          </li>
        </ul>
      </Prose>
    </DocSection>

    {/* ------------------------------------------------ Links */}
    <DocSection id='links'>
      <SectionHeader label='Links' />
      <Prose>
        <p>
          Links are navy, and important standalone links carry a trailing arrow
          with a red hover state. Link text must describe the destination —
          never write &ldquo;click here&rdquo; or &ldquo;read more&rdquo; on its
          own, because screen reader users often browse links out of context.
        </p>
      </Prose>
      <Example caption='ArrowLink · inline link'>
        <div className='space-y-4'>
          <div>
            <ArrowLink to='/government'>
              Browse the government directory
            </ArrowLink>
          </div>
          <p className='font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            Inline links sit inside body copy, like this link to the{' '}
            <a
              href='/philippines/hotlines'
              className='text-ed-navy underline underline-offset-2 hover:text-ed-red'
            >
              emergency hotlines directory
            </a>
            , and stay underlined so they are visible without colour.
          </p>
        </div>
      </Example>
    </DocSection>

    <PagerNav />
  </>
);

export default StylesPage;
