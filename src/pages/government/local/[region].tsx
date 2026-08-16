import { FC, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MailIcon, PhoneIcon, SearchIcon } from 'lucide-react';
import {
  City,
  Municipality,
  Province,
  RegionLGU,
  loadRegionLgu,
} from '../../../lib/lgu';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Flag from '../../../components/v2/ui/Flag';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import { titleCase } from '../../../lib/directory';

type Unit = {
  name: string;
  type: 'City' | 'Municipality';
  province: string | null;
  mayor?: { name?: string; contact?: string; email?: string };
  viceMayor?: { name?: string; contact?: string; email?: string };
};

const flattenUnits = (region: RegionLGU): Unit[] => {
  const units: Unit[] = [];

  region.cities?.forEach((c: City) =>
    units.push({
      name: c.city,
      type: 'City',
      province: null,
      mayor: c.mayor,
      viceMayor: c.vice_mayor,
    })
  );
  region.municipalities?.forEach((m: Municipality) =>
    units.push({
      name: m.municipality,
      type: 'Municipality',
      province: null,
      mayor: m.mayor,
      viceMayor: m.vice_mayor,
    })
  );
  region.provinces?.forEach((p: Province) => {
    p.cities?.forEach(c =>
      units.push({
        name: c.city,
        type: 'City',
        province: p.province,
        mayor: c.mayor,
        viceMayor: c.vice_mayor,
      })
    );
    p.municipalities?.forEach(m =>
      units.push({
        name: m.municipality,
        type: 'Municipality',
        province: p.province,
        mayor: m.mayor,
        viceMayor: m.vice_mayor,
      })
    );
  });
  return units;
};

const RegionalLGUPage: FC = () => {
  const { region } = useParams<{ region: string }>();
  const [regionData, setRegionData] = useState<RegionLGU | null>(null);

  useEffect(() => {
    let active = true;
    loadRegionLgu(region).then(data => {
      if (active) setRegionData(data);
    });
    return () => {
      active = false;
    };
  }, [region]);

  const units = useMemo(
    () => (regionData ? flattenUnits(regionData) : []),
    [regionData]
  );

  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const sorted = [...units].sort((a, b) => a.name.localeCompare(b.name));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(u =>
      `${u.name} ${u.province ?? ''} ${u.mayor?.name ?? ''} ${u.viceMayor?.name ?? ''}`
        .toLowerCase()
        .includes(n)
    );
  }, [units, q]);

  if (!regionData) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Local Government', to: '/government/local' },
            { label: region ?? 'Region' },
          ]}
          title='Region not found.'
          lede='The region you are looking for may have been moved or no longer exists.'
        />
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>{titleCase(regionData.region)} · LGUs | BetterGov.ph</title>
      </Helmet>

      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Local Government', to: '/government/local' },
          { label: titleCase(regionData.region) },
        ]}
        title={titleCase(regionData.region)}
      />

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {results.length} of {units.length} LGUs
            </Eyebrow>
            <div className='relative w-full max-w-md'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search LGUs'
                placeholder='Search cities, municipalities, or officials'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {results.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No LGUs match.
            </div>
          ) : (
            <div className='grid grid-cols-2 gap-6 max-md:grid-cols-1'>
              {results.map((u, i) => (
                <div
                  key={`${u.name}-${i}`}
                  className='border border-ed-rule bg-white p-6 transition-colors hover:border-ed-ink'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <h3 className='font-serif-ed text-[22px] font-semibold leading-tight text-ed-navy-ink'>
                        {titleCase(u.name)}
                      </h3>
                      <div className='mt-1 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                        {u.province
                          ? titleCase(u.province)
                          : `Regional ${u.type.toLowerCase()}`}
                      </div>
                    </div>
                    <Flag variant={u.type === 'City' ? 'navy' : 'outline'}>
                      {u.type}
                    </Flag>
                  </div>

                  {u.mayor?.name && (
                    <Official
                      role='Mayor'
                      name={u.mayor.name}
                      contact={u.mayor.contact}
                      email={u.mayor.email}
                    />
                  )}
                  {u.viceMayor?.name && (
                    <Official
                      role='Vice mayor'
                      name={u.viceMayor.name}
                      contact={u.viceMayor.contact}
                      email={u.viceMayor.email}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
};

const Official: FC<{
  role: string;
  name: string;
  contact?: string;
  email?: string;
}> = ({ role, name, contact, email }) => (
  <div className='mt-4 border-t border-ed-rule pt-3'>
    <div className='font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
      {role}
    </div>
    <div className='mt-0.5 font-serif-ed text-[15px] text-ed-ink'>{name}</div>
    {(contact || email) && (
      <div className='mt-1 flex flex-wrap gap-4 text-[12px] text-ed-ink-2'>
        {contact && (
          <span className='inline-flex items-center gap-1.5'>
            <PhoneIcon size={12} className='text-ed-ink-3' aria-hidden />
            <span className='font-mono-ed'>{contact}</span>
          </span>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className='inline-flex items-center gap-1.5 text-ed-navy no-underline hover:text-ed-red'
          >
            <MailIcon size={12} aria-hidden />
            <span>{email}</span>
          </a>
        )}
      </div>
    )}
  </div>
);

export default RegionalLGUPage;
