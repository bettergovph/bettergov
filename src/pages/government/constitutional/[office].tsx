import { FC } from 'react';
import { useParams } from 'react-router-dom';
import constitutionalData from '../../../data/directory/constitutional.json';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import OfficialsTable, {
  type OfficialRow,
} from '../../../components/v2/directory/OfficialsTable';
import { titleCase } from '../../../lib/directory';

type Constitutional = {
  slug: string;
  name: string;
  office_type?: string;
  description?: string;
  address?: string;
  trunklines?: string[];
  website?: string;
  email?: string;
  officials?: OfficialRow[];
};

const ConstitutionalOfficePage: FC = () => {
  const { office: param } = useParams<{ office: string }>();
  const office = (constitutionalData as Constitutional[]).find(
    c => c.slug === decodeURIComponent(param || '')
  );

  if (!office) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Constitutional', to: '/government/constitutional' },
            { label: 'Not found' },
          ]}
          title='Office not found.'
          lede='Please pick an office from the directory.'
        />
      </main>
    );
  }

  const displayName = titleCase(office.name);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Constitutional', to: '/government/constitutional' },
          { label: displayName },
        ]}
        eyebrow={office.office_type ?? 'Constitutional office'}
        title={displayName}
        lede={office.description}
        address={office.address}
        trunkline={office.trunklines?.[0]}
        website={office.website}
        email={office.email}
      />

      <section className='py-12 max-md:py-8'>
        <Container>
          {office.officials && office.officials.length > 0 && (
            <>
              <SectionHeader
                num='§ 01'
                label='Officials'
                meta={`${office.officials.length} people`}
              />
              <OfficialsTable officials={office.officials} />
            </>
          )}
        </Container>
      </section>
    </main>
  );
};

export default ConstitutionalOfficePage;
