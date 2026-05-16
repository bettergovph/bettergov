import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const DiplomaticMissionsPage: FC = () => {
  const entries = useMemo(() => entriesByKind('diplomatic'), []);

  return (
    <>
      <Helmet>
        <title>Diplomatic Missions | BetterGov.ph</title>
        <meta
          name='description'
          content='Foreign embassies and high commissions accredited to the Republic of the Philippines.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        eyebrow={`Diplomatic · ${entries.length} missions`}
        title={
          <>
            Foreign missions{' '}
            <em className='italic font-normal'>accredited to Manila.</em>
          </>
        }
        lede='Embassies and high commissions of foreign states based in the Philippines — with chief of mission, address, and contact of record.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search missions by country or ambassador'
        countNoun='missions'
      />
    </>
  );
};

export default DiplomaticMissionsPage;
