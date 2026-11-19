import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import ArrowLink from '../../../components/v2/ui/ArrowLink';
import { SITE_URL } from '../../../lib/brand';

const BRANCHES = [
  {
    number: '01',
    title: 'Executive',
    summary:
      'Executive power is vested in the President, who serves as both head of State and head of government. The President is elected nationally for a single six-year term.',
    basis: '1987 Constitution · Article VII',
    href: '/government/executive',
    action: 'Browse the executive branch',
  },
  {
    number: '02',
    title: 'Legislative',
    summary:
      'Legislative power is vested in Congress, which consists of the Senate and the House of Representatives. The Constitution provides for 24 senators and district and party-list representation in the House.',
    basis: '1987 Constitution · Article VI',
    href: '/government/legislative',
    action: 'Browse Congress',
  },
  {
    number: '03',
    title: 'Judicial',
    summary:
      'Judicial power is vested in one Supreme Court and in lower courts established by law. The Supreme Court is composed of one Chief Justice and 14 Associate Justices.',
    basis: '1987 Constitution · Article VIII',
    href: '/government/judicial',
    action: 'Browse the judiciary',
  },
] as const;

const COMMISSIONS = [
  {
    acronym: 'CSC',
    name: 'Civil Service Commission',
    href: '/government/constitutional/civil-service-commission-csc',
  },
  {
    acronym: 'COMELEC',
    name: 'Commission on Elections',
    href: '/government/constitutional/commission-on-elections-comelec',
  },
  {
    acronym: 'COA',
    name: 'Commission on Audit',
    href: '/government/constitutional/commission-on-audit-coa',
  },
] as const;

const LOCAL_COUNTS = [
  { value: '18', label: 'Administrative regions' },
  { value: '82', label: 'Provinces' },
  { value: '149', label: 'Cities' },
  { value: '1,493', label: 'Municipalities' },
  { value: '42,010', label: 'Barangays' },
] as const;

const GovernmentOverview: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Government at a Glance | BETTERGOV.PH</title>
      <meta
        name='description'
        content='A plain-language overview of the executive, legislative, and judicial branches of the Philippine government, constitutional commissions, and local government.'
      />
      <link rel='canonical' href={`${SITE_URL}/government/overview`} />
    </Helmet>

    <PageMasthead
      variant='hero'
      title='Government at a glance'
      lede='How the Philippine government is organized under the 1987 Constitution, with direct paths to branch and agency directories.'
    />

    <section className='border-b border-ed-rule py-14 max-md:py-7'>
      <Container>
        <div className='max-w-[760px]'>
          <SectionHeader label='The constitutional structure' />
          <p className='font-serif-ed text-[28px] leading-snug text-ed-navy-ink max-md:text-[21px]'>
            The Philippines is a democratic and republican State. Government
            authority is divided among the executive, legislative, and judicial
            branches so that each can exercise its constitutional role.
          </p>
          <p className='mt-5 max-w-[72ch] text-base leading-relaxed text-ed-ink-2'>
            This page is a general guide to the structure of government. For the
            controlling legal text, consult the 1987 Constitution and the
            official websites linked from each directory entry.
          </p>
        </div>
      </Container>
    </section>

    <section className='py-16 max-md:py-8'>
      <Container>
        <SectionHeader label='The three branches' />
        <div className='grid grid-cols-3 border-l border-t border-ed-rule max-lg:grid-cols-1'>
          {BRANCHES.map(branch => (
            <article
              key={branch.number}
              className='flex min-h-[350px] flex-col border-b border-r border-ed-rule p-7 max-md:min-h-0 max-md:p-5'
            >
              <div className='font-mono-ed text-[11px] uppercase tracking-[0.16em] text-ed-red'>
                {branch.number}
              </div>
              <h2 className='mt-10 font-serif-ed text-[32px] font-semibold text-ed-navy-ink max-md:mt-5 max-md:text-[25px]'>
                {branch.title}
              </h2>
              <p className='mt-4 text-[15px] leading-relaxed text-ed-ink-2'>
                {branch.summary}
              </p>
              <p className='mt-5 font-mono-ed text-[10px] uppercase tracking-[0.11em] text-ed-ink-3'>
                {branch.basis}
              </p>
              <Link
                to={branch.href}
                className='mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-ed-navy no-underline hover:text-ed-red max-md:pt-6'
              >
                {branch.action} <ArrowRightIcon size={14} />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>

    <section className='border-y border-ed-rule bg-ed-paper-2 py-16 max-md:py-8'>
      <Container>
        <div className='grid grid-cols-[1fr_1.15fr] gap-16 max-lg:grid-cols-1 max-lg:gap-10'>
          <div>
            <SectionHeader label='Independent constitutional commissions' />
            <p className='max-w-[62ch] text-base leading-relaxed text-ed-ink-2'>
              Article IX establishes three commissions that operate
              independently within their constitutional mandates: the Civil
              Service Commission, Commission on Elections, and Commission on
              Audit.
            </p>
            <div className='mt-7 border-t-2 border-ed-navy'>
              {COMMISSIONS.map(commission => (
                <Link
                  key={commission.acronym}
                  to={commission.href}
                  className='grid grid-cols-[92px_1fr_auto] items-center gap-4 border-b border-ed-rule py-4 text-ed-ink no-underline transition-colors hover:bg-white max-sm:grid-cols-[72px_1fr_auto]'
                >
                  <span className='font-mono-ed text-[11px] font-semibold tracking-[0.08em] text-ed-red'>
                    {commission.acronym}
                  </span>
                  <span className='font-serif-ed text-lg font-semibold text-ed-navy-ink'>
                    {commission.name}
                  </span>
                  <ArrowRightIcon size={14} className='text-ed-navy' />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              label='National and local government'
              meta='PSGC · 30 June 2026'
            />
            <p className='max-w-[62ch] text-base leading-relaxed text-ed-ink-2'>
              National agencies operate across the country, while local
              government is organized into provinces, cities, municipalities,
              and barangays. Regions group these areas for administration and
              statistics; they are not themselves local government units.
            </p>
            <dl className='mt-7 grid grid-cols-2 border-l border-t border-ed-rule max-sm:grid-cols-1'>
              {LOCAL_COUNTS.map(item => (
                <div
                  key={item.label}
                  className='border-b border-r border-ed-rule bg-white p-5'
                >
                  <dd className='font-serif-ed text-[30px] font-semibold leading-none text-ed-navy-ink'>
                    {item.value}
                  </dd>
                  <dt className='mt-2 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
            <div className='mt-6'>
              <ArrowLink to='/government/local'>
                Browse local government units
              </ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>

    <section className='py-16 max-md:py-8'>
      <Container>
        <div className='grid grid-cols-[1fr_auto] items-end gap-10 border-b-2 border-ed-navy pb-8 max-md:grid-cols-1 max-md:items-start max-md:gap-5'>
          <div>
            <SectionHeader label='Find an office or agency' className='mb-3' />
            <p className='max-w-[68ch] text-base leading-relaxed text-ed-ink-2'>
              Search the full directory for executive departments,
              constitutional bodies, Congress, courts, and diplomatic missions.
            </p>
          </div>
          <ArrowLink to='/government'>Open the government directory</ArrowLink>
        </div>
      </Container>
    </section>

    <section className='border-y border-ed-rule bg-ed-paper-2 py-10 max-md:py-7'>
      <Container>
        <div className='max-w-[900px]'>
          <SectionHeader
            label='Sources'
            meta='Last verified 8 September 2026'
          />
          <p className='max-w-[72ch] text-sm leading-relaxed text-ed-ink-2'>
            Constitutional descriptions are summarized from the 1987
            Constitution. Current geographic counts are from the Philippine
            Statistics Authority&rsquo;s Philippine Standard Geographic Code.
          </p>
          <div className='mt-5 flex flex-wrap gap-x-6 gap-y-3'>
            <ArrowLink
              to='https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/3/353'
              external
            >
              1987 Constitution
            </ArrowLink>
            <ArrowLink
              to='https://econgress.gov.ph/constitutional-mandate/'
              external
            >
              Congressional mandate
            </ArrowLink>
            <ArrowLink
              to='https://psa.gov.ph/classification/psgc/summary'
              external
            >
              PSGC summary
            </ArrowLink>
          </div>
        </div>
      </Container>
    </section>
  </main>
);

export default GovernmentOverview;
