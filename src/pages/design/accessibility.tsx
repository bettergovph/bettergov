import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import { DocHeading, DocSection, PageHeader, PagerNav, Prose } from './shared';
import { ACCESSIBILITY_REVIEW } from '../../data/accessibility';

const SYSTEM_PROVIDES = [
  {
    title: 'Colour roles to build on',
    body: 'The palette provides consistent roles, but a token is not a contrast guarantee. The current audit found failures in secondary text. Check the rendered foreground, background, opacity, size, and state together.',
  },
  {
    title: 'Keyboard behaviour to verify',
    body: 'Some components include focus styles, but the services search field lacks a visible indicator. Skip navigation and mobile-menu dismissal also need work. Test each complete interaction with a keyboard.',
  },
  {
    title: 'Semantic structure',
    body: 'Use native buttons, links, and navigation landmarks. Check the assembled page too: the current directory has a missing main landmark and an empty table header, and some pages skip heading levels.',
  },
  {
    title: 'Responsive layouts',
    body: 'The nine sampled pages fit 320 and 720 CSS-pixel viewports without page-level horizontal scrolling. Text resizing, browser zoom, assistive technology, and slow connections still need separate testing.',
  },
];

const TEAM_MUST_DO = [
  'Keep a logical heading order: one h1 per page, no skipped levels.',
  'Write alt text that says what an image means, or mark it decorative.',
  'Write link text that describes the destination — never bare "click here".',
  'Label every form field; never rely on placeholder text as the label.',
  'Use plain language, and serve Filipino and English as equals.',
  'Never convey meaning with colour alone — pair it with a label or icon.',
];

const TESTS = [
  {
    title: 'Keyboard only',
    body: 'Unplug the mouse. Tab through the whole page. Can you reach, see, and operate everything, in a sensible order?',
  },
  {
    title: 'Screen reader',
    body: 'Walk the page with VoiceOver (macOS/iOS), TalkBack (Android), or NVDA (Windows). Do headings, links, and labels make sense out of context?',
  },
  {
    title: 'Zoom to 200%',
    body: 'Check 200% text resizing and 400% browser zoom, as well as custom text spacing. Look for clipped content, overlap, lost controls, and unnecessary horizontal scrolling.',
  },
  {
    title: 'Throttled connection',
    body: 'Load the page on a simulated slow 3G connection. It should be readable in seconds, not minutes.',
  },
];

const DesignAccessibilityPage: FC = () => (
  <>
    <Helmet>
      <title>Accessibility — Design System | GOV.PH</title>
      <meta
        name='description'
        content='The GOV.PH accessibility target, known design-system gaps, and the automated and manual checks contributors need to run.'
      />
      <link rel='canonical' href='https://www.gov.ph/design/accessibility' />
    </Helmet>

    <PageHeader
      title='Accessibility'
      lede='Government services are for everyone. Our target is WCAG 2.2 Level AA; full conformance has not been established. Use the public checklist to see verified support, known barriers, and the checks still to do.'
    />

    <DocSection first id='system'>
      <SectionHeader label='What the system provides today' />
      <Prose className='mb-8'>
        <p>
          Reviewed on {ACCESSIBILITY_REVIEW.label}. Automated checks found
          barriers in the current build. Component reuse does not replace
          testing the page and the complete task.
        </p>
        <ArrowLink to='/accessibility'>
          Read the accessibility checklist and review scope
        </ArrowLink>
      </Prose>
      <div className='grid gap-x-10 gap-y-8 md:grid-cols-2'>
        {SYSTEM_PROVIDES.map(item => (
          <div key={item.title} className='max-w-md'>
            <DocHeading>{item.title}</DocHeading>
            <p className='font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </DocSection>

    <DocSection id='your-team'>
      <SectionHeader label='What your team still has to do' />
      <Prose>
        <p>
          Components cannot make content accessible. Using this system does not
          exempt a page from the basics:
        </p>
      </Prose>
      <ul className='mt-6 max-w-2xl divide-y divide-ed-rule border-y border-ed-rule'>
        {TEAM_MUST_DO.map((rule, i) => (
          <li key={i} className='flex gap-4 py-3'>
            <span className='font-mono-ed text-[11px] leading-6 text-ed-ink-3'>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className='font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {rule}
            </span>
          </li>
        ))}
      </ul>
    </DocSection>

    <DocSection id='testing'>
      <SectionHeader label='How to test' meta='Automation plus human review' />
      <Prose className='mb-8'>
        <p>
          Run <code>npm run test:a11y</code> for the repeatable desktop and
          mobile-sized Chromium audit. It checks nine default page states with
          axe-core and exercises layout, labels, keyboard behaviour, and reduced
          motion. Known failures remain failures in the report.
        </p>
        <p>
          See <code>docs/accessibility-audit.md</code> in the repository for
          findings, reproduction steps, and the follow-up checklist. When a fix
          passes, update the public checklist with its evidence and review date.
          Keep untested features marked as unverified.
        </p>
      </Prose>
      <div className='grid gap-x-10 gap-y-8 md:grid-cols-2'>
        {TESTS.map(t => (
          <div key={t.title} className='max-w-md'>
            <DocHeading>{t.title}</DocHeading>
            <p className='font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
              {t.body}
            </p>
          </div>
        ))}
      </div>
      <Prose className='mt-10'>
        <p>
          Automated checks cannot establish WCAG conformance. Review findings
          marked as incomplete, test interactive and error states, and include
          people with disabilities in task-based testing. Use the{' '}
          <a
            className='text-ed-navy underline underline-offset-4'
            href='https://www.w3.org/WAI/test-evaluate/preliminary/'
          >
            W3C accessibility checks
          </a>{' '}
          as a starting point, then evaluate the applicable success criteria.
        </p>
        <ArrowLink to='/accessibility'>
          Read the GOV.PH accessibility checklist
        </ArrowLink>
      </Prose>
    </DocSection>

    <PagerNav />
  </>
);

export default DesignAccessibilityPage;
