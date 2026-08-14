import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import Container from '../../components/v2/ui/Container';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import Dropcap from '../../components/v2/ui/Dropcap';
import ArrowLink from '../../components/v2/ui/ArrowLink';

const AccessibilityPage: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Accessibility Statement | BetterGov.ph</title>
      <meta
        name='description'
        content="Learn about BetterGov.ph's commitment to web accessibility, WCAG compliance, and how to request assistance."
      />
      <link rel='canonical' href='https://bettergov.ph/accessibility' />
    </Helmet>

    <PageMasthead
      title='Accessibility Statement'
      lede='Our commitment to inclusive digital access for everyone in the Philippines.'
    />

    <section className='py-12 max-md:py-8'>
      <Container narrow>
        <SectionHeader label='Our Commitment' />
        <div className='space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-w-2xl'>
          <Dropcap>
            BetterGov.ph is committed to ensuring digital accessibility for
            people with disabilities. We continuously improve the user
            experience for everyone and apply the relevant accessibility
            standards to our platform.
          </Dropcap>
          <p>
            We believe that everyone should have equal access to government
            information and services. Our website is designed to be accessible
            to all users, including those who rely on assistive technologies
            such as screen readers, voice recognition software, and keyboard
            navigation.
          </p>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Standards & Compliance' />
          <div className='space-y-0 divide-y divide-ed-rule max-w-2xl'>
            {[
              {
                level: 'WCAG 2.1 Level AA',
                desc: 'We strive to meet WCAG 2.1 Level AA standards for web content accessibility.',
              },
              {
                level: 'Section 508',
                desc: 'Our website follows Section 508 guidelines for federal accessibility requirements.',
              },
              {
                level: 'EN 301 549',
                desc: 'We are working towards full compliance with European accessibility standards.',
              },
            ].map(({ level, desc }) => (
              <div
                key={level}
                className='py-4 flex gap-6 max-sm:flex-col max-sm:gap-1'
              >
                <span className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink w-40 shrink-0 pt-0.5'>
                  {level}
                </span>
                <p className='text-sm text-ed-ink-2 leading-relaxed'>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Accessibility Features' />
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-w-2xl'>
            {[
              {
                title: 'Visual',
                items: [
                  'High-contrast colour schemes',
                  'Scalable text and UI elements',
                  'Alt text on all images',
                  'Screen reader support',
                ],
              },
              {
                title: 'Keyboard Navigation',
                items: [
                  'Full keyboard navigation',
                  'Visible focus indicators',
                  'Logical tab order',
                  'Skip links to main content',
                ],
              },
              {
                title: 'Motor',
                items: [
                  'Large click targets (min. 44 px)',
                  'Drag-and-drop alternatives',
                  'Error prevention and correction',
                  'Multiple ways to complete tasks',
                ],
              },
              {
                title: 'Language & Cognitive',
                items: [
                  'Clear, plain language',
                  'Consistent navigation patterns',
                  'Structured headings',
                  'Help and documentation available',
                ],
              },
            ].map(({ title, items }) => (
              <div key={title}>
                <h3 className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-ink mb-3'>
                  {title}
                </h3>
                <ul className='space-y-1.5'>
                  {items.map(item => (
                    <li
                      key={item}
                      className='flex items-start gap-2 text-sm text-ed-ink-2'
                    >
                      <span className='mt-1.5 h-1 w-1 rounded-full bg-ed-navy shrink-0' />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Keyboard Shortcuts' />
          <div className='max-w-xl divide-y divide-ed-rule'>
            {[
              { action: 'Skip to main content', key: 'Tab' },
              { action: 'Navigate links', key: 'Tab / Shift+Tab' },
              { action: 'Activate link or button', key: 'Enter / Space' },
              { action: 'Open search', key: 'Ctrl+K' },
              { action: 'Close modal or menu', key: 'Escape' },
              { action: 'Navigate menu items', key: '↑ ↓ Arrow keys' },
            ].map(({ action, key }) => (
              <div
                key={action}
                className='flex items-center justify-between py-3'
              >
                <span className='text-sm text-ed-ink-2'>{action}</span>
                <kbd className='font-mono-ed text-[11px] px-2 py-1 border border-ed-rule bg-ed-paper-2 text-ed-ink-3'>
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Feedback & Contact' />
          <div className='max-w-2xl space-y-4 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              We welcome feedback on the accessibility of BetterGov.ph. If you
              encounter barriers or have suggestions for improvement, please
              reach out to us.
            </p>
          </div>
          <div className='mt-6 flex flex-col gap-3'>
            <ArrowLink to='mailto:accessibility@bettergov.ph' external>
              accessibility@bettergov.ph
            </ArrowLink>
          </div>
        </div>

        <p className='mt-16 border-t border-ed-rule pt-5 font-mono-ed text-[11px] text-ed-ink-4'>
          This statement was last reviewed on{' '}
          <time dateTime='2025-09-08'>September 8, 2025</time>.
        </p>
      </Container>
    </section>
  </main>
);

export default AccessibilityPage;
