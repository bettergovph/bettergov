import { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import SEO from '../../../components/SEO';
import judicialData from '../../../data/directory/judicial.json';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import OfficialsTable, {
  type OfficialRow,
} from '../../../components/v2/directory/OfficialsTable';
import { SITE_URL } from '../../../lib/brand';

type Court = {
  slug: string;
  name: string;
  description?: string;
  address?: string;
  website?: string;
  officials?: Array<{
    name: string;
    role?: string;
    date_of_appointment?: string;
  }>;
};

const courts = judicialData as Court[];

const JudicialCourt: FC = () => {
  const { court: slug } = useParams<{ court: string }>();
  const court = courts.find(c => c.slug === slug);

  if (!court) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Judicial', to: '/government/judicial' },
            { label: 'Not found' },
          ]}
          title='Court not found.'
          lede='Please pick a court from the directory.'
        />
      </main>
    );
  }

  const justices: OfficialRow[] = (court.officials ?? []).map(j => ({
    role: j.role,
    name: j.name,
    office: j.date_of_appointment
      ? `Appointed ${j.date_of_appointment}`
      : undefined,
  }));
  const others = courts.filter(c => c.slug !== court.slug);
  const url = `${SITE_URL}/government/judicial/${court.slug}`;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <SEO
        title={`${court.name} | Judicial Branch`}
        description={
          court.description ??
          `The ${court.name} and its justices, in the GOV.PH directory.`
        }
        canonical={url}
        breadcrumbs={[
          { name: 'Directory', url: `${SITE_URL}/government` },
          { name: 'Judicial', url: `${SITE_URL}/government/judicial` },
          { name: court.name, url },
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'GovernmentOrganization',
          name: court.name,
          url,
          ...(court.address && { address: court.address }),
        }}
      />
      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Judicial', to: '/government/judicial' },
          { label: court.name },
        ]}
        title={court.name}
        lede={court.description}
        address={court.address}
        website={court.website}
      />

      <section className='py-12 max-md:py-6'>
        <Container>
          {justices.length > 0 && (
            <>
              <SectionHeader
                label={justices.length > 1 ? 'Justices' : 'Presiding justice'}
                meta={
                  justices.length > 1
                    ? `${justices.length} incumbent justices`
                    : undefined
                }
              />
              <OfficialsTable officials={justices} />
            </>
          )}

          {others.length > 0 && (
            <div className='mt-10 grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-3'>
              {others.map(o => (
                <Link
                  key={o.slug}
                  to={`/government/judicial/${o.slug}`}
                  className='group block border border-ed-rule bg-white p-7 text-ed-ink no-underline transition-colors hover:border-ed-ink max-md:p-5'
                >
                  <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                    Other court
                  </div>
                  <h3 className='mt-2 font-serif-ed text-[22px] font-semibold text-ed-navy-ink max-md:text-[18px]'>
                    {o.name}
                  </h3>
                  {o.description && (
                    <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>
                      {o.description}
                    </p>
                  )}
                  <span className='mt-4 inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 text-sm font-medium text-ed-navy group-hover:border-ed-red group-hover:text-ed-red'>
                    View court <ArrowRightIcon size={14} aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
};

export default JudicialCourt;
