import { FC, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { executiveOffices as executiveData } from '../../../data/cms';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import OfficialsTable, {
  type OfficialRow,
} from '../../../components/v2/directory/OfficialsTable';
import { titleCase } from '../../../lib/directory';

type FlatOfficial = {
  name: string;
  role?: string;
  contact?: string;
  email?: string;
};
type Division = {
  office_division: string;
  personnel: Array<{
    name?: string;
    role?: string;
    contact?: string;
    email?: string;
    other_office?: string;
  }>;
};
type OfficeEntry = FlatOfficial | Division;

type Office = {
  slug: string;
  office: string;
  address?: string;
  trunkline?: string;
  website?: string;
  officials?: OfficeEntry[];
};

type Props = {
  officeSlug: string;
};

const ExecutiveOfficePage: FC<Props> = ({ officeSlug }) => {
  const office = useMemo(
    () => (executiveData as Office[]).find(o => o.slug === officeSlug),
    [officeSlug]
  );
  const [q, setQ] = useState('');

  if (!office) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Executive', to: '/government/executive' },
            { label: 'Not found' },
          ]}
          title='Office not found.'
          lede='Please pick an office from the directory.'
        />
      </main>
    );
  }

  const name = titleCase(office.office);
  const flat: OfficialRow[] = (office.officials ?? [])
    .filter((e): e is FlatOfficial => 'name' in e)
    .filter(o =>
      q
        ? (o.name + ' ' + (o.role ?? ''))
            .toLowerCase()
            .includes(q.toLowerCase())
        : true
    );
  const divisions = (office.officials ?? [])
    .filter((e): e is Division => 'office_division' in e)
    .map(d => ({
      ...d,
      personnel: d.personnel.filter(p =>
        q
          ? (
              (p.name ?? '') +
              ' ' +
              (p.role ?? '') +
              ' ' +
              (p.other_office ?? '')
            )
              .toLowerCase()
              .includes(q.toLowerCase())
          : true
      ),
    }))
    .filter(d => d.personnel.length > 0);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Executive', to: '/government/executive' },
          { label: name },
        ]}
        title={name}
        address={office.address}
        trunkline={office.trunkline}
        website={office.website}
      />

      <section className='py-12 max-md:py-8'>
        <Container>
          <div className='mb-8 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch'>
            <Eyebrow>
              {flat.length +
                divisions.reduce((s, d) => s + d.personnel.length, 0)}{' '}
              officials · {divisions.length} divisions
            </Eyebrow>
            <div className='relative w-full max-w-sm'>
              <SearchIcon
                size={16}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
              />
              <input
                type='search'
                aria-label='Search officials'
                placeholder='Search officials…'
                value={q}
                onChange={e => setQ(e.target.value)}
                className='block w-full border border-ed-ink bg-white py-2.5 pl-10 pr-4 font-sans-ed text-[14px] text-ed-ink outline-none placeholder:text-ed-ink-4'
              />
            </div>
          </div>

          {flat.length > 0 && (
            <>
              <SectionHeader label='Leadership' />
              <OfficialsTable officials={flat} />
            </>
          )}

          {divisions.map((d, i) => (
            <div key={d.office_division} className='mt-10'>
              <SectionHeader
                num={`0${i + (flat.length > 0 ? 2 : 1)}`}
                label={titleCase(d.office_division)}
                meta={`${d.personnel.length} ${d.personnel.length === 1 ? 'person' : 'people'}`}
              />
              <OfficialsTable officials={d.personnel as OfficialRow[]} />
            </div>
          ))}

          {flat.length === 0 && divisions.length === 0 && (
            <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
              No officials match &ldquo;{q}&rdquo;.
            </div>
          )}
        </Container>
      </section>
    </main>
  );
};

export default ExecutiveOfficePage;
