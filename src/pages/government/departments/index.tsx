import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { entriesByKind } from '../../../lib/directory';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';

const DepartmentsIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('department'), []);

  return (
    <>
      <Helmet>
        <title>Executive Departments | BetterGov.ph</title>
        <meta
          name='description'
          content='Every cabinet-level executive department of the Philippine government — with the Secretary of record, trunkline, and official domain.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Cabinet departments'
        lede='The executive departments headed by the Cabinet — each the principal administrative arm for a sector of national life, from Education to Foreign Affairs.'
      />
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search departments by name, acronym, or Secretary'
        countNoun='departments'
      />
    </>
  );
};

export default DepartmentsIndex;
