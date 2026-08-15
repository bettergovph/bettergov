import { FC, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import { DocHeading, DocSection, PageHeader, PagerNav, Prose } from './shared';

type Pattern = {
  title: string;
  body: ReactNode;
  howItWorks: string[];
  liveTo: string;
  liveLabel: string;
};

const PatternEntry: FC<Pattern> = ({
  title,
  body,
  howItWorks,
  liveTo,
  liveLabel,
}) => (
  <article className='grid gap-8 border-b border-ed-rule py-10 first:pt-0 last:border-b-0 last:pb-0 lg:grid-cols-[1fr_260px]'>
    <div>
      <h3 className='font-serif-ed text-[24px] font-semibold leading-snug text-ed-ink'>
        {title}
      </h3>
      <Prose className='mt-3'>{body}</Prose>
      <div className='mt-5'>
        <DocHeading>How it works</DocHeading>
        <ol className='max-w-2xl space-y-2 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
          {howItWorks.map((step, i) => (
            <li key={i} className='flex gap-3'>
              <span className='font-mono-ed text-[11px] leading-6 text-ed-ink-4'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
    <aside className='lg:pt-1'>
      <div className='border border-ed-rule bg-ed-paper-2 p-5'>
        <DocHeading>See it live</DocHeading>
        <ArrowLink to={liveTo}>{liveLabel}</ArrowLink>
      </div>
    </aside>
  </article>
);

const TASK_PATTERNS: Pattern[] = [
  {
    title: 'Help people find a service',
    body: (
      <p>
        Most people arrive with a task, not an org chart. Lead with a big search
        field and the handful of most-requested services, and let the agency
        structure come second. Never make someone guess which department owns
        their problem.
      </p>
    ),
    howItWorks: [
      'Open with a big search field and an example query as the placeholder.',
      'Surface the most-requested services as direct links below the search.',
      'Group everything else by task ("travel", "business") before by agency.',
      'On results, show the owning agency as metadata, not as the headline.',
    ],
    liveTo: '/services',
    liveLabel: 'Services index',
  },
  {
    title: 'Help people contact an agency',
    body: (
      <p>
        Publishing a wrong number is worse than publishing none. Contact details
        follow a fixed block — trunkline, email, website, address — and every
        entry must be verified against an official source before it ships.
      </p>
    ),
    howItWorks: [
      'Show trunkline, email, website, and address in that order, each with an icon and a label.',
      'Make phone numbers and emails tappable links.',
      'Strip protocol clutter from displayed URLs ("dfa.gov.ph", not "https://…").',
      'Record where and when each detail was verified; drop details you cannot verify.',
    ],
    liveTo: '/government/departments',
    liveLabel: 'Department directory',
  },
  {
    title: 'Help people in an emergency',
    body: (
      <p>
        Someone using this pattern may be in danger, panicking, on a weak
        connection. Numbers come first, in large type, dialable with one tap.
        Everything decorative is stripped away, and the national 911 line is
        never more than one glance away.
      </p>
    ),
    howItWorks: [
      'Put the national emergency number first, biggest, always visible.',
      'Group remaining hotlines by situation (fire, flood, medical), not by agency.',
      'Use red flags for urgency — this is the one place red is spent freely.',
      'Keep the page light enough to load on 2G.',
    ],
    liveTo: '/philippines/hotlines',
    liveLabel: 'Emergency hotlines',
  },
  {
    title: 'Help people follow a process',
    body: (
      <p>
        Applying for a document is a journey with prerequisites, costs, and
        waiting. A guide states who it is for, what it costs, and how long it
        takes — before anything else — then walks the steps in order, one action
        per step.
      </p>
    ),
    howItWorks: [
      'Answer the three questions up front: am I eligible, what will it cost, how long will it take.',
      'List requirements as a checklist people can complete before starting.',
      'Number the steps; start each with a verb; one action per step.',
      'End with what happens next and where to get help if it goes wrong.',
    ],
    liveTo: '/guides/passport',
    liveLabel: 'Passport guide',
  },
];

const PAGE_PATTERNS: Pattern[] = [
  {
    title: 'Directory listing page',
    body: (
      <p>
        A listing page holds a collection people filter and search: agencies,
        hotlines, projects. It declares its scope and count honestly — if the
        directory tracks 480 entries, say so — and filtering never navigates
        away from the page.
      </p>
    ),
    howItWorks: [
      'Masthead states what the collection is and how many entries it tracks.',
      'A search field and flat filter buttons sit above the results.',
      'Results render as ruled rows or a card grid — pick one, not both.',
      'An empty result offers a one-click way to clear filters.',
    ],
    liveTo: '/government',
    liveLabel: 'Government directory',
  },
  {
    title: 'Agency detail page',
    body: (
      <p>
        One page per agency, everything verified. The detail header carries the
        breadcrumb, name, mandate, and the standard contact block; below it,
        officials appear in the officials table and related agencies link onward
        — a dead-end page is a failure.
      </p>
    ),
    howItWorks: [
      'Breadcrumb shows where the agency sits in government.',
      'The lede states the mandate in one plain sentence.',
      'The contact strip uses the standard verified block.',
      'Officials, bureaus, and related agencies follow in ruled sections.',
    ],
    liveTo: '/government/departments',
    liveLabel: 'A department page',
  },
  {
    title: 'Long-form reading page',
    body: (
      <p>
        History, culture, explainers — pages meant to be read, not scanned. They
        keep a narrow measure, relaxed Inter body text, and generous display
        headings. Reading pages earn attention with restraint: no cards, no
        sidebars competing with the text.
      </p>
    ),
    howItWorks: [
      'Keep lines under ~70 characters with a narrow content column.',
      'Break the text with section headings, pull quotes, or a single image — sparingly.',
      'A drop cap may open the first paragraph of a major section.',
    ],
    liveTo: '/philippines/history',
    liveLabel: 'History of the Philippines',
  },
];

const PatternsPage: FC = () => (
  <>
    <Helmet>
      <title>Patterns — Design System | BetterGov.ph</title>
      <meta
        name='description'
        content='Design patterns for common government service problems: helping people find services, contact agencies, follow processes, and get help in emergencies.'
      />
      <link rel='canonical' href='https://bettergov.ph/design/patterns' />
    </Helmet>

    <PageHeader
      title='Patterns'
      lede='Best-practice solutions to problems every government service shares. Each pattern has been shaped by real use on BetterGov.ph — follow it before inventing a new one.'
    />

    <DocSection first id='task-patterns'>
      <SectionHeader
        label='Help people to…'
        meta='Task patterns · 4 documented'
      />
      {TASK_PATTERNS.map(p => (
        <PatternEntry key={p.title} {...p} />
      ))}
    </DocSection>

    <DocSection id='page-types'>
      <SectionHeader label='Page types' meta='Page patterns · 3 documented' />
      {PAGE_PATTERNS.map(p => (
        <PatternEntry key={p.title} {...p} />
      ))}
    </DocSection>

    <DocSection id='propose'>
      <SectionHeader label='Propose a pattern' />
      <Prose>
        <p>
          Patterns are added when the same problem keeps being solved the same
          way. If you have solved something these patterns do not cover — and
          you can show it working — propose it through the community process.
        </p>
        <ArrowLink to='/design/community'>How to propose a pattern</ArrowLink>
      </Prose>
    </DocSection>

    <PagerNav />
  </>
);

export default PatternsPage;
