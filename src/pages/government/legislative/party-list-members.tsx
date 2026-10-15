import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PhoneIcon, SearchIcon } from 'lucide-react';
import legislativeData from '../../../data/directory/legislative.json';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';

type PartyListMember = {
  name: string;
  party_list: string;
  contact?: string;
};

const PartyListMembersPage: FC = () => {
  const members = useMemo<PartyListMember[]>(() => {
    const house = (
      legislativeData as Array<{
        chamber: string;
        party_list_representatives?: PartyListMember[];
      }>
    ).find(l => l.chamber.includes('House of Representatives'));
    return house?.party_list_representatives ?? [];
  }, []);

  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(m =>
      `${m.name} ${m.party_list}`.toLowerCase().includes(n)
    );
  }, [members, q]);

  return (
    <>
      <Helmet>
        <title>House of Representatives · Party-list Members | GOV.PH</title>
        <meta
          name='description'
          content='Party-list representatives of the Philippine House of Representatives — marginalized and underrepresented sectors, up to 20 percent of House seats.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Party-list members'
        lede='Representatives of marginalized and underrepresented sectors, elected through the party-list system to up to 20 percent of seats in the House of Representatives.'
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
                aria-label='Search party-list members'
                placeholder='Search by name or party-list'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          <div className='mb-4'>
            <Eyebrow>
              {results.length} of {members.length} party-list members
            </Eyebrow>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No members match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map((m, i) => (
                <li
                  key={`${m.name}-${i}`}
                  className='grid grid-cols-[220px_1fr_minmax(220px,260px)] gap-5 py-4 max-md:grid-cols-1 max-md:gap-1.5'
                >
                  <div>
                    <Flag variant='navy'>{m.party_list}</Flag>
                  </div>
                  <div className='font-serif-ed text-[17px] text-ed-ink'>
                    {m.name}
                  </div>
                  <div className='flex items-center gap-2 border-l border-ed-rule pl-5 text-[13px] max-md:border-l-0 max-md:pl-0'>
                    {m.contact && (
                      <>
                        <PhoneIcon
                          size={12}
                          className='shrink-0 text-ed-ink-3'
                        />
                        <span className='font-mono-ed text-ed-ink'>
                          {m.contact}
                        </span>
                      </>
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

export default PartyListMembersPage;
