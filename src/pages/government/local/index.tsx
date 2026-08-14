import { FC, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRightIcon, SearchIcon } from 'lucide-react';
import type { RegionLGU } from '../../../lib/lgu';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { titleCase } from '../../../lib/directory';

const modules = import.meta.glob<{ default: RegionLGU }>(
  '../../../data/directory/lgu/*.json',
  { eager: true }
);
const lguData: RegionLGU[] = Object.values(modules).map(m => m.default);

type RegionSummary = {
  name: string;
  slug: string;
  cityCount: number;
  provinceCount: number;
};

const countLGUs = (regionData: RegionLGU): RegionSummary => {
  let cityCount = 0;
  if (regionData.cities) cityCount += regionData.cities.length;
  if (regionData.municipalities) cityCount += regionData.municipalities.length;
  if (regionData.provinces) {
    cityCount += regionData.provinces.reduce(
      (
        total: number,
        province: { cities?: unknown[]; municipalities?: unknown[] }
      ) =>
        total +
        (province.cities?.length ?? 0) +
        (province.municipalities?.length ?? 0),
      0
    );
  }
  return {
    name: regionData.region,
    slug: regionData.slug,
    cityCount,
    provinceCount: regionData.provinces?.length ?? 0,
  };
};

const LocalGovernmentIndex: FC = () => {
  const regions = useMemo(() => lguData.map(countLGUs), []);
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const sorted = [...regions].sort((a, b) => a.name.localeCompare(b.name));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(r => r.name.toLowerCase().includes(n));
  }, [regions, q]);

  return (
    <>
      <Helmet>
        <title>Local Government Units | BetterGov.ph</title>
        <meta
          name='description'
          content='Local government units of the Philippines — regions, provinces, cities, and municipalities.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Local government'
        lede='The Philippines is divided into 18 administrative regions, subdivided into 82 provinces, 149 cities, and 1,493 municipalities. Pick a region to browse its LGUs.'
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {results.length} of {regions.length} regions
            </Eyebrow>
            <div className='relative w-full max-w-md'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search regions'
                placeholder='Search regions'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No regions match.
            </div>
          ) : (
            <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
              {results.map(r => (
                <Link
                  key={r.slug}
                  to={`/government/local/${r.slug}`}
                  state={{ scrollToContent: true }}
                  className='group block border border-ed-rule bg-white p-7 text-ed-ink no-underline transition-colors hover:border-ed-ink'
                >
                  <div className='flex items-center justify-between'>
                    <Flag variant='navy'>Region</Flag>
                    <span className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                      {r.cityCount} cities / munis
                    </span>
                  </div>
                  <h3 className='mt-4 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-navy-ink'>
                    {titleCase(r.name)}
                  </h3>
                  {r.provinceCount > 0 && (
                    <p className='mt-2 text-[13px] text-ed-ink-3'>
                      {r.provinceCount}{' '}
                      {r.provinceCount === 1 ? 'province' : 'provinces'}
                    </p>
                  )}
                  <div className='mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ed-navy'>
                    Browse LGUs <ArrowRightIcon size={14} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
};

export default LocalGovernmentIndex;
