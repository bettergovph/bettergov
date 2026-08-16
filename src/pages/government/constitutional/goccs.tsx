import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
} from 'lucide-react';
import constitutionalData from '../../../data/directory/constitutional.json';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { titleCase } from '../../../lib/directory';

type Entity = {
  slug: string;
  name: string;
  office_type?: string;
  address?: string;
  trunklines?: string[];
  website?: string;
};

const GOCCsPage: FC = () => {
  const all = useMemo<Entity[]>(
    () =>
      (constitutionalData as Entity[]).filter(e =>
        (e.office_type ?? '').toLowerCase().includes('owned')
      ),
    []
  );
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(e => e.name.toLowerCase().includes(n));
  }, [all, q]);

  return (
    <>
      <Helmet>
        <title>GOCCs | BetterGov.ph</title>
        <meta
          name='description'
          content='Government-Owned and Controlled Corporations — state corporations with commercial operations, chartered by law to serve public or regulatory purposes.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Government-owned and controlled corporations'
        lede='Government-Owned and Controlled Corporations — state-owned entities chartered to carry out commercial, developmental, or regulatory mandates.'
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {results.length} of {all.length} GOCCs
            </Eyebrow>
            <div className='relative w-full max-w-md'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search GOCCs'
                placeholder='Search by corporation name'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No GOCCs match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map(e => (
                <li
                  key={e.slug}
                  className='grid grid-cols-[1fr_minmax(280px,360px)] gap-6 py-5 max-md:grid-cols-1 max-md:gap-2'
                >
                  <div className='font-serif-ed text-[18px] font-semibold leading-tight text-ed-navy-ink'>
                    {titleCase(e.name)}
                  </div>
                  <div className='flex flex-col gap-1.5 border-l border-ed-rule pl-5 text-[13px] text-ed-ink-2 max-md:border-l-0 max-md:pl-0'>
                    {e.address && (
                      <span className='inline-flex items-start gap-2'>
                        <MapPinIcon
                          size={14}
                          className='mt-0.5 shrink-0 text-ed-ink-3'
                        />
                        <span>{e.address}</span>
                      </span>
                    )}
                    {e.trunklines && e.trunklines[0] && (
                      <span className='inline-flex items-center gap-2'>
                        <PhoneIcon
                          size={14}
                          className='shrink-0 text-ed-ink-3'
                        />
                        <span className='font-mono-ed text-ed-ink'>
                          {e.trunklines[0]}
                        </span>
                      </span>
                    )}
                    {e.website && (
                      <a
                        href={`https://${e.website.replace(/^https?:\/\//, '')}`}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-2 break-all text-ed-navy no-underline hover:text-ed-red'
                      >
                        <ExternalLinkIcon size={14} className='shrink-0' />
                        <span>{e.website.replace(/^https?:\/\//, '')}</span>
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

export default GOCCsPage;
