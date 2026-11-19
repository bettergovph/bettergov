import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckIcon, MinusIcon } from 'lucide-react';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import Container from '../../components/v2/ui/Container';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import { ISSUES_URL, SITE_NAME, SITE_URL } from '../../lib/brand';
import {
  ACCESSIBILITY_CHECKLIST,
  ACCESSIBILITY_REVIEW,
  ACCESSIBILITY_SAMPLE,
  AccessibilityStatus,
} from '../../data/accessibility';

const STATUS: Record<AccessibilityStatus, { label: string; style: string }> = {
  supported: {
    label: 'Supported',
    style: 'border-ed-sage bg-ed-sage text-white',
  },
  improve: {
    label: 'Needs improvement',
    style: 'border-ed-red-ink text-ed-red-ink',
  },
  unverified: {
    label: 'Not yet verified',
    style: 'border-ed-ink-3 text-ed-ink-3',
  },
};

const AccessibilityPage: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Accessibility Checklist | {SITE_NAME}</title>
      <meta
        name='description'
        content='Our accessibility checklist: what BETTERGOV.PH supports in tested pages, known barriers, and the work still needed towards WCAG 2.2 Level AA.'
      />
      <link rel='canonical' href={`${SITE_URL}/accessibility`} />
    </Helmet>

    <PageMasthead
      title='Accessibility checklist'
      lede='Government information should be usable by everyone. Here is what we have checked, where barriers remain, and what we want to achieve.'
    />

    <Container narrow className='py-10 md:py-14'>
      <section aria-labelledby='commitment-heading'>
        <p className='mb-3 font-mono-ed text-xs text-ed-ink-2'>
          Last reviewed{' '}
          <time dateTime={ACCESSIBILITY_REVIEW.date}>
            {ACCESSIBILITY_REVIEW.label}
          </time>
        </p>
        <h2
          id='commitment-heading'
          className='font-serif-ed text-2xl font-semibold'
        >
          Our goal: {ACCESSIBILITY_REVIEW.target}
        </h2>
        <p className='mt-4 max-w-3xl text-base leading-relaxed text-ed-ink-2'>
          We are working towards the{' '}
          <a
            className='text-ed-navy underline underline-offset-4'
            href='https://www.w3.org/TR/WCAG22/'
          >
            Web Content Accessibility Guidelines
          </a>
          . We have not yet established full conformance. A checked item means
          the specific check passed within the review scope below; it is not a
          certification of the whole website.
        </p>

        <dl className='mt-8 grid divide-y divide-ed-rule border-y border-ed-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
          {ACCESSIBILITY_CHECKLIST.map(group => (
            <div
              key={group.id}
              className='flex items-baseline gap-3 py-5 sm:block sm:px-5 first:sm:pl-0'
            >
              <dt className='order-2 text-sm text-ed-ink-2 sm:mb-2'>
                {STATUS[group.id].label}
              </dt>
              <dd className='font-serif-ed text-3xl font-semibold tabular-nums'>
                {group.items.length}
                <span className='ml-2 font-sans-ed text-xs font-normal text-ed-ink-2'>
                  items
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className='mt-3 text-sm text-ed-ink-2'>
          These counts track this checklist, not a percentage of WCAG
          compliance.
        </p>
      </section>

      <nav
        aria-label='Accessibility checklist sections'
        className='my-8 flex flex-wrap gap-x-6 gap-y-3 text-sm'
      >
        <a
          className='text-ed-navy underline underline-offset-4'
          href='#supported'
        >
          Supported
        </a>
        <a
          className='text-ed-navy underline underline-offset-4'
          href='#improve'
        >
          Needs improvement
        </a>
        <a
          className='text-ed-navy underline underline-offset-4'
          href='#unverified'
        >
          Still to verify
        </a>
        <a className='text-ed-navy underline underline-offset-4' href='#review'>
          Review scope
        </a>
      </nav>

      <div className='space-y-14'>
        {ACCESSIBILITY_CHECKLIST.map(group => (
          <section key={group.id} id={group.id} className='scroll-mt-6'>
            <SectionHeader label={group.label} />
            <p className='mb-6 max-w-3xl text-[15px] leading-relaxed text-ed-ink-2'>
              {group.description}
            </p>
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {group.items.map(item => (
                <li
                  key={item.id}
                  id={item.id}
                  className='flex scroll-mt-6 gap-4 py-6 md:gap-5'
                >
                  <span
                    aria-hidden='true'
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-2 ${STATUS[group.id].style}`}
                  >
                    {group.id === 'supported' && (
                      <CheckIcon size={16} strokeWidth={3} />
                    )}
                    {group.id === 'improve' && <MinusIcon size={14} />}
                  </span>
                  <div className='min-w-0 max-w-3xl'>
                    <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-ed-ink-2'>
                      {STATUS[group.id].label}
                    </p>
                    <h3 className='font-serif-ed text-lg font-semibold leading-snug'>
                      {item.title}
                    </h3>
                    <p className='mt-2 text-[15px] leading-relaxed text-ed-ink-2'>
                      {item.detail}
                    </p>
                    {item.next && (
                      <p className='mt-3 text-[15px] leading-relaxed text-ed-ink-2'>
                        <strong className='font-semibold text-ed-ink'>
                          Next step:{' '}
                        </strong>
                        {item.next}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section
        id='review'
        className='mt-14 scroll-mt-6 border-t-2 border-ed-ink pt-8'
      >
        <SectionHeader label='What this review covers' />
        <div className='max-w-3xl space-y-4 text-[15px] leading-relaxed text-ed-ink-2'>
          <p>
            On {ACCESSIBILITY_REVIEW.label}, we tested nine pages in the local
            development build using Chromium, Playwright, and axe-core.
            Automated scans covered desktop (1440 × 1000) and mobile-sized (390
            × 844) viewports, with separate layout checks at 320 and 720 CSS
            pixels. These are browser simulations, not tests on physical phones.
          </p>
          <p>
            The review checks default page states, page titles, image markup,
            search labels, and selected keyboard and motion behaviours.
            Automated checks still find barriers on Home, Services, Government
            directory, Search, and Contact. The Coming soon, Accessibility,
            Design accessibility, and About pages have no detected axe
            violations in these default states.
          </p>
          <p>
            Weather, currency, and search data were unavailable in the local
            review. Their fully loaded states still need testing.
          </p>
        </div>
        <ul
          className='mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm'
          aria-label='Pages included in the review'
        >
          {ACCESSIBILITY_SAMPLE.map(sample => (
            <li key={sample.path}>
              <Link
                className='text-ed-navy underline underline-offset-4'
                to={sample.path}
              >
                {sample.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className='mt-6 max-w-3xl text-[15px] leading-relaxed text-ed-ink-2'>
          Automated tools cannot establish accessibility on their own. Some
          contrast checks, including off-screen directory cells, require human
          review. We have not completed screen-reader testing, a full WCAG
          evaluation, or testing of linked agency sites, documents, and every
          interactive state. A live site may differ from this build.
        </p>
        <div className='mt-5'>
          <ArrowLink to='/design/accessibility'>
            Testing guidance for contributors
          </ArrowLink>
        </div>
      </section>

      <section className='mt-14 border-t border-ed-rule pt-8'>
        <SectionHeader label='Report a barrier or ask for help' />
        <p className='max-w-3xl text-[15px] leading-relaxed text-ed-ink-2'>
          Tell us which page you were using, what you were trying to do, and
          what got in the way. Include your browser and assistive technology if
          you can. Please leave personal or sensitive information out of public
          reports.
        </p>
        <div className='mt-5 flex flex-col items-start gap-4'>
          <ArrowLink to={ISSUES_URL} external>
            Report an accessibility barrier on GitHub
          </ArrowLink>
          <ArrowLink to='/contact'>
            Find contact and assistance options
          </ArrowLink>
        </div>
      </section>
    </Container>
  </main>
);

export default AccessibilityPage;
