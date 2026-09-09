import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRightIcon, ExternalLinkIcon, MapPinIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import Dropcap from '../../components/v2/ui/Dropcap';
import { cn } from '../../lib/utils';

type Situation = {
  id: string;
  label: string;
  days: string;
  fee: string;
};

const SITUATIONS: Situation[] = [
  {
    id: 'first',
    label: 'First-time applicant',
    days: '15 working days',
    fee: '₱950 (regular) / ₱1,200 (express)',
  },
  {
    id: 'renewal',
    label: 'Renewal',
    days: '10 working days',
    fee: '₱950 (regular) / ₱1,200 (express)',
  },
  {
    id: 'lost',
    label: 'Lost or damaged',
    days: '15 days + 15-day clearing',
    fee: '₱1,200 + ₱350 penalty',
  },
  {
    id: 'minor',
    label: 'Minor (below 18)',
    days: '15 working days',
    fee: '₱950 / ₱1,200',
  },
  {
    id: 'senior',
    label: 'Senior citizen / PWD',
    days: 'Priority lane',
    fee: '₱950 / ₱1,200 · 20% discount',
  },
  {
    id: 'ofw',
    label: 'OFW / overseas',
    days: 'Varies by post',
    fee: 'Set by consulate',
  },
];

const REQUIREMENTS = [
  {
    doc: 'Confirmed online appointment',
    req: 'Always',
    note: 'Book at passport.gov.ph',
  },
  {
    doc: 'Personal appearance',
    req: 'Always',
    note: 'Biometrics must be captured in person',
  },
  {
    doc: 'Accomplished application form',
    req: 'Always',
    note: 'Auto-generated during booking',
  },
  {
    doc: 'PSA Birth Certificate',
    req: 'First-time / lost',
    note: 'Original + photocopy',
  },
  {
    doc: 'Expiring passport',
    req: 'Renewal',
    note: 'Must be within 1 year of expiration',
  },
  {
    doc: 'Affidavit of Loss',
    req: 'Lost passport',
    note: 'Notarized + police blotter',
  },
  {
    doc: 'Marriage Certificate (PSA)',
    req: 'If name changed',
    note: 'Original + photocopy',
  },
];

const FEES = [
  {
    type: 'Manila / Consular Offices',
    regular: '₱950',
    express: '₱1,200',
    release: '12 / 6 working days',
  },
  {
    type: 'Provincial DFA Offices',
    regular: '₱950',
    express: '₱1,200',
    release: '15 / 7 working days',
  },
  {
    type: 'Lost passport penalty',
    regular: '₱350',
    express: '—',
    release: '+ 15-day clearing',
    mergeFirstTwo: true,
  },
  {
    type: 'Delivery (optional)',
    regular: '₱150',
    express: '—',
    release: '3–10 days',
    mergeFirstTwo: true,
  },
] as const;

const TOC = [
  'What happens',
  'Requirements',
  'Fees & timing',
  'Common mistake',
  'Where to apply',
  'Related services',
] as const;

const OFFICES = [
  'DFA Aseana (Main)',
  'DFA Ali Mall Cubao',
  'DFA SM Manila',
  'DFA SM Megamall',
  'DFA Robinsons Las Piñas',
  'DFA Alabang Town Center',
];

const RELATED = [
  { name: 'NBI Clearance', href: '/services?q=NBI' },
  { name: 'PSA Birth Certificate', href: '/services?q=PSA' },
  { name: 'Visa applications', href: '/travel/visa' },
  { name: 'Authentication / Apostille', href: '/services?q=apostille' },
];

const PassportGuide: FC = () => {
  const [situation, setSituation] = useState('renewal');
  const current = SITUATIONS.find(s => s.id === situation)!;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Philippine Passport — a step-by-step guide | BetterGov.ph</title>
        <meta
          name='description'
          content='Apply for or renew a Philippine passport. Every requirement, fee, and waiting period explained — in plain language.'
        />
      </Helmet>

      {/* Breadcrumb */}
      <div className='border-b border-ed-rule bg-white'>
        <Container className='py-5'>
          <nav
            aria-label='Breadcrumb'
            className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'
          >
            <Link
              to='/'
              className='text-ed-ink-3 no-underline hover:text-ed-navy'
            >
              Home
            </Link>{' '}
            /{' '}
            <Link
              to='/guides'
              className='text-ed-ink-3 no-underline hover:text-ed-navy'
            >
              Guides
            </Link>{' '}
            /{' '}
            <Link
              to='/services?category=passport-travel'
              className='text-ed-ink-3 no-underline hover:text-ed-navy'
            >
              Travel &amp; Identification
            </Link>{' '}
            / <span className='text-ed-ink'>Philippine Passport</span>
          </nav>
        </Container>
      </div>

      <article>
        {/* Article header with quick facts */}
        <header className='border-b border-ed-ink bg-ed-paper-2 py-12 max-md:py-6'>
          <Container>
            <div className='grid grid-cols-[1.6fr_1fr] items-end gap-16 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-5'>
              <div>
                <div className='mb-4 flex flex-wrap items-center gap-3'>
                  <Flag variant='navy'>Department of Foreign Affairs</Flag>
                  <Flag variant='red'>Most requested</Flag>
                </div>
                <h1 className='font-serif-ed text-[clamp(42px,6vw,72px)] font-bold leading-none tracking-[-0.03em] text-ed-ink max-md:text-[30px]'>
                  The Philippine passport
                </h1>
                <p className='mt-6 max-w-[560px] font-sans-ed text-xl leading-snug text-ed-ink-2 max-md:mt-3 max-md:text-[15px]'>
                  Whether you&rsquo;re applying for the first time, renewing an
                  expiring booklet, or replacing one that was lost — this page
                  walks you through exactly what happens, what to bring, and
                  what you&rsquo;ll pay.
                </p>
                <div className='mt-6 flex flex-wrap gap-6 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-md:mt-4 max-md:gap-4'>
                  <span>
                    By <span className='text-ed-ink'>The Editors</span>
                  </span>
                  <span>
                    Published Feb 2024 ·{' '}
                    <span className='text-ed-ink'>Updated Apr 9, 2026</span>
                  </span>
                  <span>15 min read</span>
                </div>
              </div>

              {/* Quick facts card */}
              <aside className='bg-ed-navy p-8 text-white max-md:p-4'>
                <Eyebrow tone='onDark'>Quick facts</Eyebrow>
                <dl className='mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-3.5 text-sm'>
                  <dt className='pt-0.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/60'>
                    Agency
                  </dt>
                  <dd>Department of Foreign Affairs (DFA)</dd>
                  <dt className='pt-0.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/60'>
                    Processing
                  </dt>
                  <dd>{current.days}</dd>
                  <dt className='pt-0.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/60'>
                    Fee
                  </dt>
                  <dd>{current.fee}</dd>
                  <dt className='pt-0.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/60'>
                    Validity
                  </dt>
                  <dd>10 years (adult), 5 years (minor)</dd>
                  <dt className='pt-0.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/60'>
                    Where
                  </dt>
                  <dd>Any DFA Consular Office — appointment required</dd>
                </dl>
                <a
                  href='#what-happens'
                  className='mt-6 flex w-full items-center justify-center gap-2 border border-white bg-white px-5 py-3 font-sans-ed text-sm font-medium text-ed-navy no-underline transition-colors hover:bg-transparent hover:text-white'
                >
                  Start the step-by-step guide <ArrowRightIcon size={14} />
                </a>
                <a
                  href='https://passport.gov.ph'
                  target='_blank'
                  rel='noreferrer'
                  className='mt-3.5 inline-flex items-center gap-1.5 border-b border-white/40 pb-0.5 text-[12px] text-white no-underline'
                >
                  Go to passport.gov.ph <ExternalLinkIcon size={12} />
                </a>
              </aside>
            </div>
          </Container>
        </header>

        {/* Situation selector */}
        <section className='pt-12 max-md:pt-6'>
          <Container>
            <SectionHeader
              label='Pick your situation'
              meta='Rules change depending on your case.'
            />
            <div className='grid grid-cols-6 border border-ed-ink max-lg:grid-cols-3 max-sm:grid-cols-2'>
              {SITUATIONS.map((s, i) => {
                const active = situation === s.id;
                return (
                  <button
                    key={s.id}
                    type='button'
                    onClick={() => setSituation(s.id)}
                    className={cn(
                      'cursor-pointer border-0 border-ed-ink p-5 text-left font-serif-ed text-base',
                      i < SITUATIONS.length - 1 &&
                        'border-r max-lg:[&:nth-child(3n)]:border-r-0 max-sm:[&:nth-child(2n)]:border-r-0',
                      i < SITUATIONS.length - 3 && 'max-lg:border-b',
                      i < SITUATIONS.length - 2 && 'max-sm:border-b',
                      active
                        ? 'bg-ed-ink text-white'
                        : 'bg-white text-ed-ink hover:bg-ed-paper-2'
                    )}
                  >
                    <div
                      className={cn(
                        'mb-2 font-mono-ed text-[10px] uppercase tracking-[0.14em]',
                        active ? 'text-white/60' : 'text-ed-ink-4'
                      )}
                    >
                      Case 0{i + 1}
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Two-column body */}
        <section className='py-14 max-md:py-6'>
          <Container>
            <div className='grid grid-cols-[1.6fr_1fr] gap-16 max-lg:grid-cols-1 max-lg:gap-10'>
              <div>
                <div id='what-happens' className='scroll-mt-24'>
                  <SectionHeader label='What happens' />
                </div>
                <Dropcap className='font-sans-ed text-lg leading-[1.65] text-ed-ink-2'>
                  The Philippine passport is issued by the Department of Foreign
                  Affairs. Every applicant — new or returning — must appear in
                  person at a DFA Consular Office for biometrics and document
                  verification. There are no walk-ins. Bring your appointment
                  slip, application form, and the documents listed below;
                  everything gets reviewed at the first window, photographed and
                  fingerprinted at the second, and you pay at the cashier before
                  you leave.
                </Dropcap>
                <p className='mt-5 font-sans-ed text-lg leading-[1.65] text-ed-ink-2'>
                  The booklet is printed at the DFA&rsquo;s central facility in
                  Pasay and couriered to the address you provide, or released at
                  the same office if you pick that option. Adult passports are
                  valid for ten years; minors&rsquo; for five.
                </p>

                <h2
                  id='requirements'
                  className='mt-12 mb-4 scroll-mt-24 font-serif-ed text-[32px] font-semibold leading-tight text-ed-ink'
                >
                  Requirements
                </h2>
                <div className='border border-ed-rule bg-white'>
                  {REQUIREMENTS.map((r, i) => (
                    <div
                      key={r.doc}
                      className={cn(
                        'grid grid-cols-[1.5fr_1fr_2fr] items-baseline gap-4 px-5 py-3.5 max-md:grid-cols-1 max-md:gap-1 max-md:py-3',
                        i < REQUIREMENTS.length - 1 && 'border-b border-ed-rule'
                      )}
                    >
                      <div className='font-serif-ed text-base text-ed-ink'>
                        {r.doc}
                      </div>
                      <div>
                        <Flag variant='outline'>{r.req}</Flag>
                      </div>
                      <div className='text-[13px] text-ed-ink-3'>{r.note}</div>
                    </div>
                  ))}
                </div>

                <h2
                  id='fees-timing'
                  className='mt-12 mb-4 scroll-mt-24 font-serif-ed text-[32px] font-semibold leading-tight text-ed-ink'
                >
                  Fees &amp; timing
                </h2>
                <div className='overflow-x-auto'>
                  <table className='w-full border-collapse font-sans-ed text-sm'>
                    <thead>
                      <tr>
                        {['Fee type', 'Regular', 'Express', 'Release'].map(
                          h => (
                            <th
                              key={h}
                              className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {FEES.map((row, i) => (
                        <tr
                          key={i}
                          className='border-b border-ed-rule last:border-b-0'
                        >
                          <td className='px-4 py-3 align-top'>{row.type}</td>
                          {row.mergeFirstTwo ? (
                            <td
                              className='px-4 py-3 align-top font-mono-ed'
                              colSpan={2}
                            >
                              {row.regular}
                            </td>
                          ) : (
                            <>
                              <td className='px-4 py-3 align-top font-mono-ed'>
                                {row.regular}
                              </td>
                              <td className='px-4 py-3 align-top font-mono-ed'>
                                {row.express}
                              </td>
                            </>
                          )}
                          <td className='px-4 py-3 align-top'>{row.release}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  id='common-mistake'
                  className='mt-12 scroll-mt-24 border border-ed-rule-strong bg-ed-paper-2 p-7'
                >
                  <Eyebrow tone='red'>Common mistake</Eyebrow>
                  <h3 className='mt-2 font-serif-ed text-[22px] font-semibold leading-tight text-ed-ink'>
                    Don&rsquo;t show up at the office with an appointment
                    screenshot only.
                  </h3>
                  <p className='mt-3 text-sm leading-normal text-ed-ink-2'>
                    The DFA requires the printed, signed Application Form
                    (auto-generated in your confirmation email) and a readable
                    copy of your e-receipt. Phones will not be accepted at the
                    first window. We see this issue in roughly 12% of feedback
                    submissions.
                  </p>
                </div>
              </div>

              {/* Sticky sidebar */}
              <aside>
                <div className='sticky top-6 flex flex-col gap-6'>
                  <div className='border border-ed-ink bg-white p-6'>
                    <Eyebrow>On this page</Eyebrow>
                    <ul className='m-0 mt-4 list-none border-t border-ed-rule p-0'>
                      {TOC.map((t, i) => (
                        <li
                          key={t}
                          className='border-b border-ed-rule last:border-b-0'
                        >
                          <a
                            href={`#${t.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                            className='flex justify-between py-2.5 text-[13px] text-ed-ink-2 no-underline hover:text-ed-navy'
                          >
                            <span>{t}</span>
                            <span className='font-mono-ed text-[10px] text-ed-ink-4'>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    id='where-to-apply'
                    className='scroll-mt-24 border border-ed-rule bg-white p-6'
                  >
                    <Eyebrow>Where to apply</Eyebrow>
                    <h4 className='mt-2 font-serif-ed text-base font-semibold text-ed-ink'>
                      13 Consular Offices in Metro Manila
                    </h4>
                    <ul className='m-0 mt-3.5 list-none p-0 text-[13px]'>
                      {OFFICES.map(o => (
                        <li
                          key={o}
                          className='flex justify-between border-t border-ed-rule py-2'
                        >
                          <span>{o}</span>
                          <MapPinIcon
                            size={14}
                            className='text-ed-ink-3'
                            aria-hidden
                          />
                        </li>
                      ))}
                    </ul>
                    <div className='mt-4'>
                      <Link
                        to='/directory'
                        className='inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
                      >
                        All 46 offices nationwide <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </div>

                  <div
                    id='related-services'
                    className='scroll-mt-24 border border-ed-rule bg-white p-6'
                  >
                    <Eyebrow>Related</Eyebrow>
                    {RELATED.map((r, i) => (
                      <Link
                        key={r.name}
                        to={r.href}
                        className={cn(
                          'block py-2.5 font-serif-ed text-[15px] text-ed-ink no-underline hover:text-ed-navy',
                          i > 0 && 'border-t border-ed-rule'
                        )}
                      >
                        {r.name} →
                      </Link>
                    ))}
                  </div>

                  <div className='font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3'>
                    Sources · DFA Memorandum Circular 2024-07 · R.A. 8239 · R.A.
                    11983
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </article>
    </main>
  );
};

export default PassportGuide;
