import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const JudicialIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('judicial'), []);

  return (
    <>
      <Helmet>
        <title>Judicial Branch | BETTERGOV.PH</title>
        <meta
          name='description'
          content='The Supreme Court of the Philippines, the Court of Appeals, and the Sandiganbayan — the courts of the Philippine Judicial branch and their justices.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='The Judiciary'
        lede='Judicial power is vested in one Supreme Court and in the lower courts established by law. The Supreme Court is composed of a Chief Justice and 14 Associate Justices.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search courts by name or presiding justice'
        countNoun='courts'
      />
    </>
  );
};

export default JudicialIndex;
