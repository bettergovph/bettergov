import { FC, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import departmentsData from '../../../data/directory/departments.json';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import OfficialsTable, {
  type OfficialRow,
} from '../../../components/v2/directory/OfficialsTable';
import { titleCase } from '../../../lib/directory';

type Secretary = {
  name?: string;
  contact?: string;
  email?: string;
};

type Undersecretary = OfficialRow;

type Department = {
  slug: string;
  office_name: string;
  address?: string;
  trunkline?: string;
  website?: string;
  email?: string;
  secretary?: Secretary;
  undersecretaries?: Undersecretary[];
  /** Fallback bucket for anything else the JSON happens to carry. */
  [key: string]: unknown;
};

const humanKey = (k: string) =>
  k
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Render an arbitrary value — used for the long tail of keys below
 * the known secretary/undersecretaries. Arrays of {name,role,...}
 * turn into an OfficialsTable; scalars become a short text row.
 */
const RenderValue: FC<{ value: unknown; label: string }> = ({
  value,
  label,
}) => {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) {
    const allObj = value.every(v => v && typeof v === 'object');
    if (allObj) {
      return (
        <OfficialsTable
          officials={value as OfficialRow[]}
          groupLabel={`${label} · ${value.length}`}
        />
      );
    }
    return (
      <div className='mb-8'>
        <div className='mb-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-2'>
          {label}
        </div>
        <ul className='ml-6 list-disc text-[15px] text-ed-ink-2'>
          {value.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <div className='mb-8'>
        <div className='mb-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-2'>
          {label}
        </div>
        <dl className='grid grid-cols-[180px_1fr] gap-x-4 gap-y-1 text-sm max-md:grid-cols-1'>
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <Fragment key={k}>
              <dt className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                {humanKey(k)}
              </dt>
              <dd className='text-ed-ink-2'>{String(v)}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className='mb-4 text-sm text-ed-ink-2'>
      <span className='mr-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
        {label}
      </span>
      {String(value)}
    </div>
  );
};

const DepartmentDetail: FC = () => {
  const { department: param } = useParams<{ department: string }>();
  const department = (departmentsData as Department[]).find(
    d => d.slug === decodeURIComponent(param || '')
  );

  if (!department) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Departments', to: '/government/departments' },
            { label: 'Not found' },
          ]}
          title='Department not found.'
          lede='Please pick a department from the directory.'
        />
      </main>
    );
  }

  const {
    office_name,
    address,
    trunkline,
    website,
    email,
    secretary,
    undersecretaries,
    slug,
    ...rest
  } = department;
  void slug;

  const displayName = titleCase(office_name);
  const secretaryRow: OfficialRow[] = secretary?.name
    ? [
        {
          role: 'Secretary',
          name: secretary.name,
          contact: secretary.contact,
          email: secretary.email,
        },
      ]
    : [];

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Departments', to: '/government/departments' },
          { label: displayName },
        ]}
        title={displayName}
        address={address}
        trunkline={trunkline}
        website={website}
        email={email}
      />

      <section className='py-12 max-md:py-6'>
        <Container>
          {secretaryRow.length > 0 && (
            <>
              <SectionHeader label='Head of department' />
              <OfficialsTable officials={secretaryRow} />
            </>
          )}

          {undersecretaries && undersecretaries.length > 0 && (
            <>
              <SectionHeader
                label='Undersecretaries'
                meta={`${undersecretaries.length} officials`}
              />
              <OfficialsTable officials={undersecretaries} />
            </>
          )}

          {Object.entries(rest).map(([key, value]) => (
            <div key={key} className='mt-10 first:mt-0'>
              <h2 className='mb-5 border-b border-ed-navy pb-2 font-serif-ed text-[26px] font-semibold text-ed-navy-ink max-md:mb-3 max-md:text-[21px]'>
                {humanKey(key)}
              </h2>
              <RenderValue value={value} label={humanKey(key)} />
            </div>
          ))}
        </Container>
      </section>
    </main>
  );
};

export default DepartmentDetail;
