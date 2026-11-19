import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MailIcon, PhoneIcon, SearchIcon } from 'lucide-react';
import diplomaticData from '../../../data/directory/diplomatic.json';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { titleCase } from '../../../lib/directory';

type Consulate = {
  country: string;
  office_name: string;
  address?: string;
  contact?: string;
  email?: string;
  representative?: string;
  title?: string;
};

const ConsulatesPage: FC = () => {
  const all = useMemo<Consulate[]>(
    () =>
      (diplomaticData as unknown as { Consulate?: Consulate[] }).Consulate ??
      [],
    []
  );
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...all].sort((a, b) => a.country.localeCompare(b.country));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(c =>
      `${c.country} ${c.office_name} ${c.representative ?? ''}`
        .toLowerCase()
        .includes(n)
    );
  }, [all, q]);

  return (
    <>
      <Helmet>
        <title>Consulates | BETTERGOV.PH</title>
        <meta
          name='description'
          content='Consulates and honorary consulates in the Philippines — representation of foreign states outside the main embassy, often ad honorem.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Consulates'
        lede='Consulates and honorary consulates representing foreign states in the Philippines — typically for citizen services, notarial acts, and trade promotion.'
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {results.length} of {all.length} consulates
            </Eyebrow>
            <div className='relative w-full max-w-md'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search consulates'
                placeholder='Search by country, office, or consul'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No consulates match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map((c, i) => (
                <li
                  key={`${c.country}-${i}`}
                  className='grid grid-cols-[200px_1fr_minmax(260px,320px)] gap-6 py-6 max-md:grid-cols-1 max-md:gap-2'
                >
                  <div>
                    <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                      {titleCase(c.country)}
                    </div>
                    {c.representative && (
                      <div className='mt-1 font-serif-ed text-[15px] text-ed-ink'>
                        {c.representative}
                      </div>
                    )}
                    {c.title && (
                      <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-4'>
                        {c.title}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className='font-serif-ed text-[18px] font-semibold leading-tight text-ed-navy-ink'>
                      {c.office_name}
                    </div>
                    {c.address && (
                      <p className='mt-1.5 text-[13px] leading-normal text-ed-ink-2'>
                        {c.address}
                      </p>
                    )}
                  </div>
                  <div className='flex flex-col gap-2 border-l border-ed-rule pl-5 text-[13px] max-md:border-l-0 max-md:pl-0'>
                    {c.contact && (
                      <span className='inline-flex items-center gap-2'>
                        <PhoneIcon
                          size={14}
                          className='shrink-0 text-ed-ink-3'
                        />
                        <span className='font-mono-ed text-ed-ink'>
                          {c.contact}
                        </span>
                      </span>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email.split(/[;,]/)[0].trim()}`}
                        className='inline-flex items-center gap-2 break-all text-ed-navy no-underline hover:text-ed-red'
                      >
                        <MailIcon size={14} className='shrink-0' />
                        <span>{c.email}</span>
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

export default ConsulatesPage;
