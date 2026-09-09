import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { SearchIcon } from 'lucide-react';
import { legislativeChambers as legislativeData } from '../../../data/cms';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { titleCase } from '../../../lib/directory';

type Committee = {
  committee: string;
  chairperson: string;
};

const SenateCommitteesPage: FC = () => {
  const committees = useMemo<Committee[]>(() => {
    const senate = (
      legislativeData as Array<{
        chamber: string;
        permanent_committees?: Committee[];
      }>
    ).find(l => l.chamber.includes('Senate'));
    return senate?.permanent_committees ?? [];
  }, []);

  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...committees].sort((a, b) =>
      a.committee.localeCompare(b.committee)
    );
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(c =>
      `${c.committee} ${c.chairperson}`.toLowerCase().includes(n)
    );
  }, [committees, q]);

  return (
    <>
      <Helmet>
        <title>Senate · Permanent Committees | BetterGov.ph</title>
        <meta
          name='description'
          content='Permanent committees of the Philippine Senate and their chairpersons.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Senate committees'
        lede='The Senate divides its legislative work across permanent committees — each led by a chairperson who steers deliberation on a specific policy area.'
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center gap-4 max-lg:flex-col max-lg:items-stretch'>
            <div className='relative flex-1'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search committees'
                placeholder='Search by committee or chair'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          <div className='mb-4'>
            <Eyebrow>
              {results.length} of {committees.length} committees
            </Eyebrow>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No committees match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map((c, i) => (
                <li
                  key={`${c.committee}-${i}`}
                  className='grid grid-cols-[1fr_minmax(260px,320px)] gap-6 py-5 max-md:grid-cols-1 max-md:gap-1.5'
                >
                  <div className='font-serif-ed text-[18px] font-semibold leading-tight text-ed-navy-ink'>
                    {titleCase(c.committee)}
                  </div>
                  <div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                      Chairperson
                    </div>
                    <div className='mt-0.5 font-serif-ed text-[15px] text-ed-ink'>
                      {c.chairperson}
                    </div>
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

export default SenateCommitteesPage;
