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
const Cite: FC<{ refs?: number[]; onDark?: boolean }> = ({ refs, onDark }) =>
  refs && refs.length > 0 ? (
    <sup className='ml-0.5 whitespace-nowrap font-mono-ed text-[10px] tracking-normal'>
      {[...refs]
        .sort((a, b) => a - b)
        .map((n, i) => (
          <Fragment key={n}>
            {i > 0 && ','}
            <a
              href={`#source-${n}`}
              aria-label={`Source ${n}`}
              className={
                onDark
                  ? 'text-white/55 no-underline hover:text-white hover:underline'
                  : 'text-ed-navy no-underline hover:underline'
              }
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
  const ordinalNumber = head.ordinal.match(/^\d+/)?.[0];

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

      <header className='relative isolate overflow-hidden bg-primary-900 text-white'>
        {/* Flag-colour rule across the top of the band. */}
        <div aria-hidden className='flex h-1.5'>
          <span className='flex-1 bg-ed-navy' />
          <span className='flex-1 bg-ed-red' />
          <span className='flex-1 bg-ed-gold' />
        </div>
        <div
          aria-hidden
          className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_28%_40%,rgba(11,79,217,0.45),transparent_62%)]'
        />
        {ordinalNumber && (
          <span
            aria-hidden
            className='pointer-events-none absolute -bottom-[0.18em] right-[-0.1em] -z-10 select-none font-serif-ed text-[clamp(220px,34vw,520px)] font-bold leading-none tracking-[-0.06em] text-white/[0.045] max-md:hidden'
          >
            {ordinalNumber}
          </span>
        )}

        <Container>
          <nav
            aria-label='Breadcrumb'
            className='pt-8 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-white/60 max-md:pt-5 max-md:text-[10px]'
          >
            <Link
              to='/government'
              className='text-white/60 no-underline hover:text-white'
            >
              Directory
            </Link>
            {' / '}
            <Link
              to='/government/executive'
              className='text-white/60 no-underline hover:text-white'
            >
              Executive
            </Link>
            {' / '}
            <span className='text-white'>{head.shortTitle}</span>
          </nav>

          <div className='mt-8 grid grid-cols-[minmax(260px,420px)_minmax(0,1fr)] items-end gap-14 max-lg:grid-cols-[minmax(220px,320px)_minmax(0,1fr)] max-lg:gap-10 max-md:mt-6 max-md:grid-cols-1 max-md:gap-7'>
            <figure className='relative m-0 max-md:max-w-[300px]'>
              <img
                src={head.portrait.src}
                alt={head.portrait.alt}
                width={head.portrait.width}
                height={head.portrait.height}
                fetchPriority='high'
                className='block aspect-[4/5] w-full bg-primary-800 object-cover object-top shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]'
              />
              <figcaption className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-[10px] leading-snug text-white/75'>
                {head.portrait.credit}.{' '}
                <a
                  href={head.portrait.sourceUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='text-white/75 underline hover:text-white'
                >
                  {head.portrait.license}
                </a>
              </figcaption>
            </figure>

            <div className='min-w-0 pb-14 max-md:pb-10'>
              <p className='font-mono-ed text-[12px] font-medium uppercase tracking-[0.2em] text-ed-gold max-md:text-[11px]'>
                {head.ordinal} of the Philippines
              </p>
              <h1 className='mt-4 font-serif-ed text-balance text-[clamp(44px,6vw,88px)] font-bold leading-[0.98] tracking-[-0.035em] text-white max-md:text-[38px]'>
                {head.name}
              </h1>
              <p className='mt-6 max-w-[620px] text-lg leading-relaxed text-white/80 max-md:mt-4 max-md:text-[15px] max-md:leading-snug'>
                {head.lede}
                <Cite refs={head.ledeCite} onDark />
              </p>

              <dl className='mt-10 grid max-w-[640px] grid-cols-3 border-t border-white/20 max-md:mt-7 max-sm:grid-cols-1'>
                {head.keyFacts.map(f => (
                  <div
                    key={f.label}
                    className='border-white/20 pt-4 pr-4 max-sm:border-b max-sm:py-3 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0'
                  >
                    <dt className='font-mono-ed text-[10px] uppercase tracking-[0.16em] text-white/60'>
                      {f.label}
                    </dt>
                    <dd className='mt-2 font-serif-ed text-[22px] font-semibold leading-tight text-white max-md:text-[19px]'>
                      {f.value}
                      <Cite refs={f.cite} onDark />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
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
