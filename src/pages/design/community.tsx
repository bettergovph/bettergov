import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import Card from '../../components/v2/ui/Card';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import { DocHeading, DocSection, PageHeader, PagerNav, Prose } from './shared';

const CRITERIA = [
  {
    title: 'Useful',
    body: 'There is evidence more than one page or service needs it. A one-off layout belongs in that page, not in the system.',
  },
  {
    title: 'Unique',
    body: 'It does not duplicate something already here. If an existing component almost fits, improving it beats adding a rival.',
  },
  {
    title: 'Proven',
    body: 'It has been used on a real page and tested with the accessibility checks. The system documents what works, not what might.',
  },
];

const STEPS = [
  {
    title: 'Check what exists',
    body: 'Read the styles, components, and patterns sections. Most proposals turn out to be a composition of pieces already here.',
  },
  {
    title: 'Open an issue',
    body: 'Describe the user problem, where it appears, and how the current system falls short. A screenshot of the real page beats a mockup.',
  },
  {
    title: 'Discuss in the open',
    body: 'Proposals are discussed on GitHub and Discord. Expect questions about evidence — that is the criteria doing their job.',
  },
  {
    title: 'Build and document',
    body: 'Accepted proposals ship as code and documentation together, following the contributing guide. A component without guidance is not done.',
  },
];

const CHANNELS = [
  {
    to: 'https://github.com/bettergovph/bettergov',
    external: true,
    label: 'GitHub repository',
    description: 'The source of every style, component, and pattern here.',
  },
  {
    to: 'https://github.com/bettergovph/bettergov/issues',
    external: true,
    label: 'GitHub issues',
    description: 'Propose components and patterns, report gaps and bugs.',
  },
  {
    to: '/discord',
    external: false,
    label: 'Discord',
    description: 'Where contributors coordinate day to day.',
  },
  {
    to: '/join-us',
    external: false,
    label: 'Join the volunteers',
    description: 'Designers, writers, and engineers are all needed.',
  },
];

const CommunityPage: FC = () => (
  <>
    <Helmet>
      <title>Community — Design System | BetterGov.ph</title>
      <meta
        name='description'
        content='The BetterGov design system is open source and volunteer-built. Learn how to propose components and patterns, contribute changes, and reuse the system in your own service.'
      />
      <link rel='canonical' href='https://bettergov.ph/design/community' />
    </Helmet>

    <PageHeader
      title='Built by the community it serves'
      lede='No agency owns this design system. It is maintained by volunteers, funded by nobody, and released into the public domain — which means it only gets better when people who use it push back on it.'
    />

    <DocSection first id='criteria'>
      <SectionHeader
        label='The contribution criteria'
        meta='All three, always'
      />
      <Prose>
        <p>
          The system stays small on purpose. Before a component or pattern is
          added, it has to clear three bars:
        </p>
      </Prose>
      <div className='mt-8 grid gap-8 md:grid-cols-3'>
        {CRITERIA.map((c, i) => (
          <div key={c.title}>
            <div className='flex items-baseline gap-3 border-b border-ed-navy pb-2'>
              <span className='font-serif-ed text-2xl font-semibold text-ed-ink-4'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className='font-sans-ed text-[15px] font-semibold text-ed-ink'>
                {c.title}
              </h3>
            </div>
            <p className='mt-3 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </DocSection>

    <DocSection id='propose'>
      <SectionHeader label='How to propose a component or pattern' />
      <ol className='max-w-2xl space-y-6'>
        {STEPS.map((s, i) => (
          <li key={s.title} className='flex gap-5'>
            <span className='font-serif-ed text-2xl font-semibold leading-none text-ed-ink-4'>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <DocHeading className='mb-1'>{s.title}</DocHeading>
              <p className='font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </DocSection>

    <DocSection id='channels'>
      <SectionHeader label='Where the work happens' />
      <div className='grid gap-5 md:grid-cols-2'>
        {CHANNELS.map(ch =>
          ch.external ? (
            <a
              key={ch.label}
              href={ch.to}
              target='_blank'
              rel='noreferrer'
              className='block border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors hover:border-ed-ink'
            >
              <Eyebrow tone='navy'>{ch.label}</Eyebrow>
              <p className='mt-3 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
                {ch.description}
              </p>
            </a>
          ) : (
            <Card key={ch.label} to={ch.to}>
              <Eyebrow tone='navy'>{ch.label}</Eyebrow>
              <p className='mt-3 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
                {ch.description}
              </p>
            </Card>
          )
        )}
      </div>
    </DocSection>

    <DocSection id='reuse'>
      <SectionHeader label='Reuse it anywhere' />
      <Prose>
        <p>
          Everything documented here is released under CC0 — public domain. A
          national agency, a city government, a barangay website, or a civic
          project abroad can copy this system in whole or in part, with or
          without credit. If you do reuse it, we would still love to hear about
          it: real-world use is the evidence this system runs on.
        </p>
        <ArrowLink to='https://github.com/bettergovph/bettergov' external>
          Get the source on GitHub
        </ArrowLink>
      </Prose>
    </DocSection>

    <PagerNav />
  </>
);

export default CommunityPage;
