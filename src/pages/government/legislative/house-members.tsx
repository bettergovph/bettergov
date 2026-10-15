import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PhoneIcon, SearchIcon } from 'lucide-react';
import legislativeData from '../../../data/directory/legislative.json';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';

type HouseMember = {
  name: string;
  province_city: string;
  district: string;
  contact?: string;
  /** Present when the seat is vacant; `name` is then "VACANT". */
  vacancy?: string;
};

const HouseMembersPage: FC = () => {
  const members = useMemo<HouseMember[]>(() => {
    const house = (
      legislativeData as Array<{
        chamber: string;
        house_members?: HouseMember[];
      }>
    ).find(l => l.chamber.includes('House of Representatives'));
    return house?.house_members ?? [];
  }, []);

  const [q, setQ] = useState('');
  const [province, setProvince] = useState<string>('All');

  const provinces = useMemo(() => {
    const set = new Set(members.map(m => m.province_city));
    return ['All', ...Array.from(set).sort()];
  }, [members]);

  const results = useMemo(() => {
    let r = [...members];
    if (province !== 'All') r = r.filter(m => m.province_city === province);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(m =>
        `${m.name} ${m.district} ${m.province_city}`.toLowerCase().includes(n)
      );
    }
    return r.sort(
      (a, b) =>
        Number(!!a.vacancy) - Number(!!b.vacancy) ||
        a.name.localeCompare(b.name)
    );
  }, [members, q, province]);

  const seated = members.filter(m => !m.vacancy).length;
  const shown = results.filter(m => !m.vacancy).length;
  const vacant = members.length - seated;

  return (
    <>
      <Helmet>
        <title>House of Representatives · District Members | GOV.PH</title>
        <meta
          name='description'
          content='District representatives of the Philippine House of Representatives — sortable by province/city and searchable by name.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='District members'
        lede='Members of the House of Representatives elected by congressional district — one seat for each of the 254 districts in the 20th Congress.'
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
                aria-label='Search representatives'
                placeholder='Search by name, district, or province'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
            <select
              aria-label='Filter by province/city'
              value={province}
              onChange={e => setProvince(e.target.value)}
              className='border border-ed-ink bg-white px-4 py-2.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink'
            >
              {provinces.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className='mb-4'>
            <Eyebrow>
              {shown} of {seated} representatives
              {vacant > 0 &&
                ` · ${vacant} vacant ${vacant === 1 ? 'seat' : 'seats'}`}
            </Eyebrow>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No representatives match.
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
              {results.map((m, i) => (
                <li
                  key={`${m.name}-${i}`}
                  className='grid grid-cols-[200px_1fr_minmax(220px,260px)] gap-5 py-4 max-md:grid-cols-1 max-md:gap-1.5'
                >
                  <div>
                    <Flag variant='navy'>{m.district}</Flag>
                    <div className='mt-1.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                      {m.province_city}
                    </div>
                  </div>
                  {m.vacancy ? (
                    <div>
                      <div className='font-serif-ed text-[17px] italic text-ed-ink-3'>
                        Vacant seat
                      </div>
                      <p className='mt-1 text-[13px] leading-snug text-ed-ink-2'>
                        {m.vacancy}
                      </p>
                    </div>
                  ) : (
                    <div className='font-serif-ed text-[17px] text-ed-ink'>
                      {m.name}
                    </div>
                  )}
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

export default HouseMembersPage;
