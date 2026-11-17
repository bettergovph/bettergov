import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const LegislativeIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('legislative'), []);

  return (
    <>
      <Helmet>
        <title>Legislative Branch | BETTERGOV.PH</title>
        <meta
          name='description'
          content='The Senate of the Philippines and the House of Representatives — the two chambers of the Philippine Congress.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Congress'
        lede='The bicameral Philippine Congress — a Senate of 24 members elected at-large, and a House of Representatives of 318 seats: 254 district and 64 party-list members in the 20th Congress.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search chambers by name or leader'
        countNoun='chambers'
      />
    </>
  );
};

export default LegislativeIndex;
