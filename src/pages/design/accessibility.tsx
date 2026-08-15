import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import { DocHeading, DocSection, PageHeader, PagerNav, Prose } from './shared';

const SYSTEM_PROVIDES = [
  {
    title: 'Contrast-checked colour',
    body: 'Every documented text/background pair meets WCAG 2.1 AA. Stay inside the palette roles and contrast takes care of itself.',
  },
  {
    title: 'Visible focus states',
    body: 'Interactive components ship with focus styles, so keyboard users can always see where they are.',
  },
  {
    title: 'Semantic structure',
    body: 'Components render real HTML — buttons are <button>, links are <a>, navigation is <nav> — so assistive technology gets meaning for free.',
  },
  {
    title: 'Honest weight',
    body: 'No heavy frameworks of images or effects. Pages stay usable on slow connections and older phones, which is an accessibility feature in the Philippines.',
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
    body: 'Nothing should overlap, truncate, or require horizontal scrolling at double zoom on a laptop screen.',
  },
  {
    title: 'Throttled connection',
    body: 'Load the page on a simulated slow 3G connection. It should be readable in seconds, not minutes.',
  },
];

const DesignAccessibilityPage: FC = () => (
  <>
    <Helmet>
      <title>Accessibility — Design System | BetterGov.ph</title>
      <meta
        name='description'
        content='How the BetterGov design system supports WCAG 2.1 AA, what service teams still need to do, and how to test that everyone can use your service.'
      />
      <link rel='canonical' href='https://bettergov.ph/design/accessibility' />
    </Helmet>

    <PageHeader
      title='Accessibility'
      lede='Government services are for everyone, including the roughly one in seven Filipinos living with a disability. WCAG 2.1 AA is our floor. The system gets you part of the way; your content and testing do the rest.'
    />

    <DocSection first id='system'>
      <SectionHeader label='What the system does for you' />
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
      <SectionHeader label='How to test' meta='Four checks before shipping' />
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
          Automated checkers catch perhaps a third of real barriers; the four
          manual checks above catch most of the rest. When they disagree with
          this documentation, fix the page first and then report the gap so the
          system improves too.
        </p>
        <ArrowLink to='/accessibility'>
          Read the BetterGov.ph accessibility statement
        </ArrowLink>
      </Prose>
    </DocSection>

    <PagerNav />
  </>
);

export default DesignAccessibilityPage;
