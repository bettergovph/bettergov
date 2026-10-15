import { FC, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  type LucideIcon,
} from 'lucide-react';
import SEO from '../../../components/SEO';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import ArrowLink from '../../../components/v2/ui/ArrowLink';
import executiveOffices from '../../../data/directory/executive.json';
import {
  executiveHeads,
  type ExecutiveHead,
  type ExecutiveHeadSlug,
} from '../../../data/directory/executive-heads';
import { SITE_URL } from '../../../lib/brand';

type Office = {
  slug: string;
  office: string;
  address?: string;
  trunkline?: string;
  website?: string;
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00+08:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });

const normalizeUrl = (w: string) => (w.startsWith('http') ? w : `https://${w}`);
const stripProtocol = (w: string) =>
  w.replace(/^https?:\/\//i, '').replace(/\/$/, '');

/** Superscript links into the numbered source list at the foot of the page. */
const Cite: FC<{ refs?: number[] }> = ({ refs }) =>
  refs && refs.length > 0 ? (
    <sup className='ml-0.5 font-mono-ed text-[10px] tracking-normal'>
      {[...refs]
        .sort((a, b) => a - b)
        .map((n, i) => (
          <Fragment key={n}>
            {i > 0 && ','}
            <a
              href={`#source-${n}`}
              aria-label={`Source ${n}`}
              className='text-ed-navy no-underline hover:underline'
            >
              [{n}]
            </a>
          </Fragment>
        ))}
    </sup>
  ) : null;

const ContactLine: FC<{ icon: LucideIcon; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <div className='flex items-start gap-2.5'>
    <Icon size={16} className='mt-0.5 shrink-0 text-ed-ink-3' aria-hidden />
    <div>{children}</div>
  </div>
);

function personJsonLd(head: ExecutiveHead) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: head.name,
    alternateName: head.fullName,
    jobTitle: head.title,
    image: `${SITE_URL}${head.portrait.src}`,
    url: `${SITE_URL}/government/executive/${head.slug}`,
    worksFor: {
      '@type': 'GovernmentOrganization',
      name: head.officeName,
    },
  };
}

const ExecutiveHeadPage: FC<{ slug: ExecutiveHeadSlug }> = ({ slug }) => {
  const head = executiveHeads[slug];
  const other = executiveHeads[head.counterpart];
  const office = (executiveOffices as Office[]).find(
    o => o.slug === head.officeSlug
  );
  const pageUrl = `/government/executive/${head.slug}`;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <SEO
        title={`${head.name}, ${head.title}`}
        description={head.lede}
        ogImage={head.portrait.src}
        ogType='article'
        jsonLd={personJsonLd(head)}
        breadcrumbs={[
          { name: 'Directory', url: `${SITE_URL}/government` },
          { name: 'Executive', url: `${SITE_URL}/government/executive` },
          { name: head.shortTitle, url: `${SITE_URL}${pageUrl}` },
        ]}
      />

      <header className='border-b border-ed-ink bg-ed-paper-2 py-12 max-md:py-6'>
        <Container>
          <nav
            aria-label='Breadcrumb'
            className='mb-6 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-md:mb-4 max-md:text-[10px]'
          >
            <Link
              to='/government'
              className='text-ed-ink-3 no-underline hover:text-ed-navy'
            >
              Directory
            </Link>
            {' / '}
            <Link
              to='/government/executive'
              className='text-ed-ink-3 no-underline hover:text-ed-navy'
            >
              Executive
            </Link>
            {' / '}
            <span className='text-ed-ink'>{head.shortTitle}</span>
          </nav>

          <div className='grid grid-cols-[minmax(0,1fr)_280px] items-start gap-12 max-lg:grid-cols-[minmax(0,1fr)_220px] max-lg:gap-8 max-md:grid-cols-1 max-md:gap-6'>
            <div className='min-w-0'>
              <Eyebrow tone='red'>{head.ordinal}</Eyebrow>
              <h1 className='mt-3 font-serif-ed text-[clamp(34px,5.4vw,64px)] font-bold leading-[1.02] tracking-[-0.025em] text-ed-ink max-md:text-[30px]'>
                {head.name}
              </h1>
              <p className='mt-2 font-serif-ed text-xl text-ed-ink-2 max-md:text-[17px]'>
                {head.title}
              </p>
              <p className='mt-6 max-w-[680px] text-lg leading-relaxed text-ed-ink-2 max-md:mt-4 max-md:text-[15px] max-md:leading-snug'>
                {head.lede}
                <Cite refs={head.ledeCite} />
              </p>

              <dl className='mt-8 grid max-w-[720px] grid-cols-3 border-y border-ed-rule max-md:mt-6 max-md:grid-cols-1'>
                {head.keyFacts.map(f => (
                  <div
                    key={f.label}
                    className='border-r border-ed-rule py-4 pr-4 last:border-r-0 max-md:border-r-0 max-md:border-b max-md:py-3 max-md:last:border-b-0 md:pl-4 md:first:pl-0'
                  >
                    <dt className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                      {f.label}
                    </dt>
                    <dd className='mt-1.5 font-serif-ed text-[17px] font-semibold leading-snug text-ed-ink'>
                      {f.value}
                      <Cite refs={f.cite} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <figure className='m-0 max-md:order-first max-md:max-w-[200px]'>
              <img
                src={head.portrait.src}
                alt={head.portrait.alt}
                width={head.portrait.width}
                height={head.portrait.height}
                className='block h-auto w-full border border-ed-rule bg-ed-paper-3'
              />
              <figcaption className='mt-2 text-[11px] leading-snug text-ed-ink-3'>
                {head.portrait.credit}.{' '}
                <a
                  href={head.portrait.sourceUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-ed-ink-3 underline hover:text-ed-navy'
                >
                  {head.portrait.license}
                </a>
              </figcaption>
            </figure>
          </div>
        </Container>
      </header>

      <Container className='grid grid-cols-[minmax(0,1fr)_300px] items-start gap-14 py-12 max-lg:grid-cols-1 max-lg:gap-10 max-md:py-6'>
        <div className='min-w-0 max-w-[760px] space-y-12 max-md:space-y-8'>
          {head.notice && (
            <section
              aria-labelledby='status-heading'
              className='border-l-4 border-ed-navy bg-ed-navy-tint px-6 py-5 max-md:px-4 max-md:py-4'
            >
              <h2
                id='status-heading'
                className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-navy-ink'
              >
                {head.notice.heading}
              </h2>
              <p className='mt-2 text-[15px] leading-relaxed text-ed-ink-2'>
                {head.notice.text}
                <Cite refs={head.notice.cite} />
              </p>
            </section>
          )}

          <section aria-labelledby='role-heading'>
            <SectionHeader label={<span id='role-heading'>The role</span>} />
            <ul className='space-y-4'>
              {head.role.map(r => (
                <li
                  key={r.text}
                  className='border-l-2 border-ed-rule pl-5 text-[16px] leading-relaxed text-ed-ink-2 max-md:pl-4 max-md:text-[15px]'
                >
                  {r.text}
                  <Cite refs={r.cite} />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby='profile-heading'>
            <SectionHeader label={<span id='profile-heading'>Profile</span>} />
            <dl className='divide-y divide-ed-rule border-y border-ed-rule'>
              {head.profile.map(f => (
                <div
                  key={f.label}
                  className='grid grid-cols-[200px_1fr] gap-6 py-3.5 max-md:grid-cols-1 max-md:gap-1'
                >
                  <dt className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 md:pt-0.5'>
                    {f.label}
                  </dt>
                  <dd className='text-[15px] leading-relaxed text-ed-ink'>
                    {f.value}
                    <Cite refs={f.cite} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby='service-heading'>
            <SectionHeader
              label={<span id='service-heading'>Public service</span>}
            />
            <ol className='divide-y divide-ed-rule border-y border-ed-rule'>
              {head.career.map(c => (
                <li
                  key={`${c.office}-${c.period}`}
                  className='grid grid-cols-[200px_1fr] gap-6 py-3.5 max-md:grid-cols-1 max-md:gap-1'
                >
                  <span className='font-mono-ed text-[12px] tracking-[0.04em] text-ed-ink-3 md:pt-0.5'>
                    {c.period}
                  </span>
                  <span className='text-[15px] leading-relaxed text-ed-ink'>
                    {c.office}
                    <Cite refs={c.cite} />
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby='sources-heading'>
            <SectionHeader
              label={<span id='sources-heading'>Sources</span>}
              meta={`Last checked ${formatDate(head.verifiedOn)}`}
            />
            <ol className='space-y-2.5 text-[13px] leading-snug text-ed-ink-2'>
              {head.sources.map((s, i) => (
                <li
                  key={s.url}
                  id={`source-${i + 1}`}
                  className='grid scroll-mt-24 grid-cols-[32px_1fr]'
                >
                  <span className='font-mono-ed text-ed-ink-3'>[{i + 1}]</span>
                  <span>
                    <a
                      href={s.url}
                      target='_blank'
                      rel='noreferrer'
                      className='text-ed-navy underline decoration-ed-rule-strong underline-offset-2 hover:decoration-ed-navy'
                    >
                      {s.title}
                    </a>
                    {' — '}
                    {s.publisher}
                    {s.date && `, ${formatDate(s.date)}`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className='space-y-8 lg:sticky lg:top-8'>
          <div className='border-t-2 border-ed-navy pt-4'>
            <Eyebrow tone='navy'>Contact</Eyebrow>
            <h2 className='mt-2 font-serif-ed text-xl font-semibold text-ed-ink'>
              {head.officeName}
            </h2>
            <div className='mt-4 space-y-3 text-sm text-ed-ink-2'>
              {office?.address && (
                <ContactLine icon={MapPinIcon}>{office.address}</ContactLine>
              )}
              {office?.trunkline && (
                <ContactLine icon={PhoneIcon}>
                  <span className='font-mono-ed'>{office.trunkline}</span>
                </ContactLine>
              )}
              {head.channels.map(c => (
                <ContactLine key={c.url} icon={ExternalLinkIcon}>
                  <span className='block text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
                    {c.label}
                  </span>
                  <a
                    href={normalizeUrl(c.url)}
                    target='_blank'
                    rel='noreferrer'
                    className='break-all text-ed-navy underline decoration-ed-rule-strong underline-offset-2 hover:decoration-ed-navy'
                  >
                    {stripProtocol(c.url)}
                  </a>
                </ContactLine>
              ))}
            </div>
            <div className='mt-5'>
              <ArrowLink to={`/government/executive/${head.officeSlug}`}>
                Officials of the {head.officeName}
              </ArrowLink>
            </div>
          </div>

          <Link
            to={`/government/executive/${other.slug}`}
            className='group block border border-ed-rule bg-white p-5 text-ed-ink no-underline transition-colors hover:border-ed-navy'
          >
            <Eyebrow>Also in the Executive</Eyebrow>
            <div className='mt-2 font-serif-ed text-lg font-semibold leading-snug text-ed-ink group-hover:text-ed-navy'>
              {other.title}
            </div>
            <div className='mt-1 text-sm text-ed-ink-2'>{other.name}</div>
          </Link>
        </aside>
      </Container>
    </main>
  );
};

export default ExecutiveHeadPage;
