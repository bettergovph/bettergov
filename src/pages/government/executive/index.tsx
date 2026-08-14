import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const ExecutiveIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('executive'), []);

  return (
    <>
      <Helmet>
        <title>Executive Offices | BetterGov.ph</title>
        <meta
          name='description'
          content='Offices, bureaus, and councils under the Executive branch of the Philippine government — from the Office of the President to independent boards and commissions.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title={
          <>
            Executive offices,{' '}
            <em className='italic font-normal'>under the President.</em>
          </>
        }
        lede='The Office of the President, the Office of the Vice President, the Presidential Communications Office, and the constellation of boards, councils, authorities, and commissions under the Executive branch.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search executive offices by name or head'
        countNoun='offices'
      />
    </>
  );
};

export default ExecutiveIndex;
