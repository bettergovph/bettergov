import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ExternalLinkIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
} from 'lucide-react';
import {
  diplomaticEntities,
  type DiplomaticOrganization,
} from '../../../data/cms';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { titleCase } from '../../../lib/directory';

const OrganizationsPage: FC = () => {
  const all = useMemo<DiplomaticOrganization[]>(
    () => diplomaticEntities['International Organization'],
    []
  );
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...all].sort((a, b) =>
      a.organization_name.localeCompare(b.organization_name)
    );
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(o =>
      `${o.organization_name} ${o.head ?? ''}`.toLowerCase().includes(n)
    );
  }, [all, q]);

  return (
    <>
      <Helmet>
        <title>International Organizations | GOV.PH</title>
        <meta
          name='description'
          content='Offices of the United Nations, multilateral banks, and other international organizations hosted in the Philippines.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='International organizations'
        lede='Offices of the United Nations, the Asian Development Bank, and other international bodies hosted in the Philippines — with resident representative and contact.'
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {results.length} of {all.length} organizations
            </Eyebrow>
            <div className='relative w-full max-w-md'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search organizations'
                placeholder='Search by organization or head'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No organizations match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map((o, i) => (
                <li
                  key={`${o.organization_name}-${i}`}
                  className='grid grid-cols-[1fr_minmax(280px,360px)] gap-6 py-6 max-md:grid-cols-1 max-md:gap-2'
                >
                  <div>
                    <div className='font-serif-ed text-[20px] font-semibold leading-tight text-ed-navy-ink'>
                      {titleCase(o.organization_name)}
                    </div>
                    {o.head && (
                      <div className='mt-2 text-[14px] text-ed-ink-2'>
                        <span className='mr-2 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                          {o.title ?? 'Head'}
                        </span>
                        {o.head}
                      </div>
                    )}
                    {o.address && (
                      <p className='mt-1.5 max-w-[600px] text-[13px] leading-normal text-ed-ink-3'>
                        {o.address}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-col gap-2 border-l border-ed-rule pl-5 text-[13px] max-md:border-l-0 max-md:pl-0'>
                    {o.contact && (
                      <span className='inline-flex items-center gap-2'>
                        <PhoneIcon
                          size={14}
                          className='shrink-0 text-ed-ink-3'
                        />
                        <span className='font-mono-ed text-ed-ink'>
                          {o.contact}
                        </span>
                      </span>
                    )}
                    {o.email && (
                      <a
                        href={`mailto:${o.email.split(/[;,]/)[0].trim()}`}
                        className='inline-flex items-center gap-2 break-all text-ed-navy no-underline hover:text-ed-red'
                      >
                        <MailIcon size={14} className='shrink-0' />
                        <span>{o.email}</span>
                      </a>
                    )}
                    {o.website && (
                      <a
                        href={`https://${o.website.replace(/^https?:\/\//, '')}`}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-2 break-all text-ed-navy no-underline hover:text-ed-red'
                      >
                        <ExternalLinkIcon size={14} className='shrink-0' />
                        <span>{o.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
};

export default OrganizationsPage;
