import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const DiplomaticIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('diplomatic'), []);

  return (
    <>
      <Helmet>
        <title>Diplomatic Missions | BetterGov.ph</title>
        <meta
          name='description'
          content='Foreign embassies, consulates, and diplomatic missions accredited to the Republic of the Philippines — with addresses, contacts, and heads of mission.'
        />
      </Helmet>
      <PageMasthead
        eyebrow={`Diplomatic · ${entries.length} missions`}
        title={
          <>
            Missions accredited{' '}
            <em className='italic font-normal'>to the Republic.</em>
          </>
        }
        lede='Embassies, consulates, and diplomatic representations accredited to the Philippines — each with a head of mission, address, and contact of record.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search missions by country or representative'
        countNoun='missions'
      />
    </>
  );
};

export default DiplomaticIndex;
