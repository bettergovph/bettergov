import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const ConstitutionalIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('constitutional'), []);

  return (
    <>
      <Helmet>
        <title>Constitutional Offices | GOV.PH</title>
        <meta
          name='description'
          content='Constitutional commissions and offices created by the 1987 Philippine Constitution — independent bodies with specific mandates.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Independent commissions'
        lede='Constitutional commissions and offices created by the 1987 Constitution to operate independently of the three political branches — the Civil Service Commission, Commission on Elections, Commission on Audit, Office of the Ombudsman, and the Commission on Human Rights.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search constitutional offices by name or head'
        countNoun='offices'
      />
    </>
  );
};

export default ConstitutionalIndex;
