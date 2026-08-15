import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import Card from '../../components/v2/ui/Card';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import { DocSection, PageHeader, Prose } from './shared';

const SECTIONS = [
  {
    to: '/design/styles',
    title: 'Styles',
    description:
      'Colour, typography, spacing, and layout — the raw material every BetterGov page is built from.',
  },
  {
    to: '/design/components',
    title: 'Components',
    description:
      'Ready-made, accessible building blocks such as buttons, cards, tables, and search — with guidance on when to use each one.',
  },
  {
    to: '/design/patterns',
    title: 'Patterns',
    description:
      'Proven solutions to problems every government service shares: helping people find a service, contact an agency, or follow a process.',
  },
  {
    to: '/design/accessibility',
    title: 'Accessibility',
    description:
      'What the design system does for you, what your team still has to do, and how to test that everyone can use your service.',
  },
  {
    to: '/design/community',
    title: 'Community',
    description:
      'The design system is open source and volunteer-built. Learn how to propose, discuss, and contribute changes.',
  },
];

const PRINCIPLES = [
  {
    title: 'Start with citizen needs',
    body: 'Design from what people are trying to do — renew a passport, find a hotline, check who is in charge — not from how government is organised internally.',
  },
  {
    title: 'Plain language, in both languages',
    body: 'Write so a stressed person on a phone can understand you the first time. Say "apply" not "avail", "get" not "secure". Serve English and Filipino as equals.',
  },
  {
    title: 'Accessible by default',
    body: 'WCAG 2.1 AA is the floor, not the ceiling. Every colour, component, and pattern here is meant to work with keyboards, screen readers, and slow connections.',
  },
  {
    title: 'Consistent, not uniform',
    body: 'Use the same styles and patterns wherever the problem is the same, and adapt them where context genuinely differs. To the public, government is one service.',
  },
  {
    title: 'Open by default',
    body: 'Everything here is public domain (CC0) and built in the open. Any agency, LGU, or civic project can copy, adapt, and improve it — no permission needed.',
  },
  {
    title: 'Prove it with use',
    body: 'Components and patterns earn their place by working on real pages for real people. If something here is not working, report it so the system can improve.',
  },
];

const LIVE_EXAMPLES = [
  { to: '/government', label: 'Government directory' },
  { to: '/philippines/hotlines', label: 'Emergency hotlines' },
  { to: '/guides/passport', label: 'Passport guide' },
  { to: '/services', label: 'Services index' },
];

const DesignSystemHome: FC = () => (
  <>
    <Helmet>
      <title>Design System | BetterGov.ph</title>
      <meta
        name='description'
        content='Styles, components, and patterns for designing consistent, accessible digital government services for the Philippines. Open source and free for any agency or civic project to use.'
      />
      <link rel='canonical' href='https://bettergov.ph/design' />
    </Helmet>

    <PageHeader
      title='Design once, serve everyone'
      lede='Styles, components, and patterns for building consistent, accessible digital services for the Philippine government — so every service looks and feels like part of one government, because to the public, it is.'
    />

    <DocSection first>
      <SectionHeader
        label='Start here'
        meta='Everything here is in production on BetterGov.ph'
      />
      <div className='grid gap-5 md:grid-cols-2'>
        {SECTIONS.map(s => (
          <Card key={s.to} to={s.to}>
            <Eyebrow tone='navy'>{s.title}</Eyebrow>
            <p className='mt-3 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {s.description}
            </p>
          </Card>
        ))}
      </div>
    </DocSection>

    <DocSection>
      <SectionHeader label='Design principles' meta='Six rules we build by' />
      <ol className='grid gap-x-10 gap-y-8 md:grid-cols-2'>
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className='max-w-md'>
            <div className='flex items-baseline gap-3 border-b border-ed-rule pb-2'>
              <span className='font-serif-ed text-2xl font-semibold text-ed-ink-4'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className='font-sans-ed text-[15px] font-semibold text-ed-ink'>
                {p.title}
              </h3>
            </div>
            <p className='mt-3 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {p.body}
            </p>
          </li>
        ))}
      </ol>
    </DocSection>

    <DocSection>
      <SectionHeader label='Use it in your service' />
      <div className='grid gap-10 lg:grid-cols-2'>
        <Prose>
          <p>
            This design system exists so that teams do not have to solve the
            same problems twice. It is the working style guide for BetterGov.ph,
            and it is released into the public domain under CC0 — any national
            agency, local government unit, or civic technology project may use
            it, in whole or in part, without asking.
          </p>
          <p>
            The fastest way to adopt it is to start from the source. Every
            style, component, and pattern documented here ships as code in the
            open-source BetterGov repository.
          </p>
          <ArrowLink to='https://github.com/bettergovph/bettergov' external>
            View the source on GitHub
          </ArrowLink>
        </Prose>
        <div>
          <h3 className='mb-4 font-serif-ed text-[17px] font-semibold text-ed-ink'>
            See it live
          </h3>
          <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
            {LIVE_EXAMPLES.map(e => (
              <li key={e.to} className='py-3'>
                <ArrowLink to={e.to} className='border-b-0'>
                  {e.label}
                </ArrowLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DocSection>
  </>
);

export default DesignSystemHome;
