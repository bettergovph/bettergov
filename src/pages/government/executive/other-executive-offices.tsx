import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const EXCLUDED_SLUGS = new Set([
  'office-of-the-president',
  'office-of-the-vice-president',
  'presidential-communications-office',
]);

const OtherExecutiveOffices: FC = () => {
  const entries = useMemo(
    () => entriesByKind('executive').filter(e => !EXCLUDED_SLUGS.has(e.slug)),
    []
  );

  return (
    <>
      <Helmet>
        <title>Other Executive Offices | BetterGov.ph</title>
        <meta
          name='description'
          content='Authorities, boards, councils, and commissions under the Executive branch of the Philippine government — everything outside the Office of the President, Vice President, and Presidential Communications Office.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title={
          <>
            Other executive offices,{' '}
            <em className='italic font-normal'>boards and councils.</em>
          </>
        }
        lede='The constellation of authorities, boards, councils, and commissions under the Executive branch — independent of the Office of the President.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search offices by name or head'
        countNoun='offices'
      />
    </>
  );
};

export default OtherExecutiveOffices;
