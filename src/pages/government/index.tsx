import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DIRECTORY_BRANCHES,
  DirectoryBranch,
  loadDirectoryEntries,
} from '../../lib/directory';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../components/v2/directory/DirectoryResults';
import { cn } from '../../lib/utils';

type BranchFilter = 'All' | DirectoryBranch;

const BRANCH_FILTERS: readonly BranchFilter[] = ['All', ...DIRECTORY_BRANCHES];

const GovernmentDirectory: FC = () => {
  const allEntries = useMemo(() => loadDirectoryEntries(), []);
  const [branch, setBranch] = useState<BranchFilter>('All');

  const filtered = useMemo(
    () =>
      branch === 'All'
        ? allEntries
        : allEntries.filter(e => e.branch === branch),
    [allEntries, branch]
  );

  return (
    <>
      <Helmet>
        <title>Government Directory | GOV.PH</title>
        <meta
          name='description'
          content='Every branch of the Philippine government in one directory — executive departments, constitutional bodies, the legislature, and diplomatic missions, with verified hotlines, heads of office, and official domains.'
        />
      </Helmet>

      <PageMasthead
        variant='hero'
        title='Government directory'
        lede='The executive branch and its departments, the constitutional commissions, the legislature, and diplomatic missions accredited to the Philippines — each with a verified head of office, trunkline, and official website.'
      />

      <DirectoryResults
        entries={filtered}
        searchPlaceholder='Search by name, acronym, or head'
        countNoun='entries'
        onClearFilters={() => setBranch('All')}
        showClear={branch !== 'All'}
        headerExtras={
          <div className='inline-flex flex-wrap'>
            {BRANCH_FILTERS.map((b, i) => (
              <button
                key={b}
                type='button'
                onClick={() => setBranch(b)}
                className={cn(
                  'border border-ed-ink px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] transition-colors',
                  i > 0 && '-ml-px',
                  branch === b
                    ? 'bg-ed-ink text-white'
                    : 'bg-white text-ed-ink hover:bg-ed-paper-2'
                )}
              >
                {b}
              </button>
            ))}
          </div>
        }
      />
    </>
  );
};

export default GovernmentDirectory;
