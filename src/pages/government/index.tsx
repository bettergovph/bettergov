import { FC, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';
import {
  DIRECTORY_BRANCHES,
  DirectoryBranch,
  DirectoryEntry,
  loadDirectoryEntries,
} from '../../lib/directory';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import { cn } from '../../lib/utils';

type View = 'list' | 'grid';
type BranchFilter = 'All' | DirectoryBranch;

const BRANCH_FILTERS: readonly BranchFilter[] = ['All', ...DIRECTORY_BRANCHES];

const visitUrl = (web: string) => `https://${web.replace(/^https?:\/\//, '')}`;

const GovernmentDirectory: FC = () => {
  const allEntries = useMemo(() => loadDirectoryEntries(), []);

  const [q, setQ] = useState('');
  const [branch, setBranch] = useState<BranchFilter>('All');
  const [view, setView] = useState<View>('list');

  const results = useMemo(() => {
    let r = allEntries;
    if (branch !== 'All') r = r.filter(a => a.branch === branch);
    if (q) {
      const n = q.toLowerCase();
      r = r.filter(a =>
        `${a.name} ${a.abbr ?? ''} ${a.head ?? ''} ${a.branch}`
          .toLowerCase()
          .includes(n)
      );
    }
    return r.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [allEntries, q, branch]);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Government Directory | BetterGov.ph</title>
        <meta
          name='description'
          content='Every branch of the Philippine government in one directory — executive departments, constitutional bodies, the legislature, and diplomatic missions, with verified hotlines, heads of office, and official domains.'
        />
      </Helmet>

      <PageMasthead
        eyebrow={`The Directory · ${allEntries.length} entries tracked`}
        title={
          <>
            Every agency, <em className='italic font-normal'>one directory.</em>
          </>
        }
        lede='The executive branch and its departments, the constitutional commissions, the legislature, and diplomatic missions accredited to the Philippines — each with a verified head of office, trunkline, and official website.'
      >
        <div className='mt-6 grid grid-cols-[1fr_auto_auto] items-center gap-4 max-lg:grid-cols-1 max-lg:gap-3'>
          <div className='relative'>
            <SearchIcon
              size={16}
              className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
            />
            <input
              type='search'
              aria-label='Search agencies'
              placeholder='Search by name, acronym, or head'
              value={q}
              onChange={e => setQ(e.target.value)}
              className='block w-full border border-ed-ink bg-white py-3 pl-10 pr-4 font-sans-ed text-[15px] text-ed-ink outline-none placeholder:text-ed-ink-4'
            />
          </div>
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
          <div className='inline-flex border border-ed-ink'>
            <button
              type='button'
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={cn(
                'px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] transition-colors',
                view === 'list'
                  ? 'bg-ed-ink text-white'
                  : 'bg-white text-ed-ink hover:bg-ed-paper-2'
              )}
            >
              List
            </button>
            <button
              type='button'
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              className={cn(
                'border-l border-ed-ink px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] transition-colors',
                view === 'grid'
                  ? 'bg-ed-ink text-white'
                  : 'bg-white text-ed-ink hover:bg-ed-paper-2'
              )}
            >
              Grid
            </button>
          </div>
        </div>
      </PageMasthead>

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
              Showing{' '}
              <strong className='text-sm text-ed-ink'>{results.length}</strong>
              {' of '}
              {allEntries.length} entries
              {branch !== 'All' && (
                <>
                  {' · '}
                  <strong className='text-ed-ink'>{branch}</strong>
                </>
              )}
              {q && (
                <>
                  {' for '}
                  <em className='not-italic text-ed-ink'>&ldquo;{q}&rdquo;</em>
                </>
              )}
            </div>
            {(q || branch !== 'All') && (
              <button
                onClick={() => {
                  setQ('');
                  setBranch('All');
                }}
                className='font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy no-underline hover:text-ed-red'
              >
                Clear filters
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyState />
          ) : view === 'list' ? (
            <ListView rows={results} />
          ) : (
            <GridView rows={results} />
          )}
        </Container>
      </section>
    </main>
  );
};

const EmptyState: FC = () => (
  <div className='border border-dashed border-ed-rule py-20 text-center text-ed-ink-3'>
    <div className='font-serif-ed text-[28px] text-ed-ink-2'>
      No agencies match.
    </div>
    <p className='mt-2 text-sm'>Try a different term or branch.</p>
  </div>
);

const ListView: FC<{ rows: DirectoryEntry[] }> = ({ rows }) => (
  <div className='overflow-x-auto'>
    <table className='w-full border-collapse font-sans-ed text-sm'>
      <thead>
        <tr>
          {[
            'Acronym',
            'Agency',
            'Branch',
            'Head of office',
            'Location',
            'Hotline',
            '',
          ].map((h, i) => (
            <th
              key={i}
              className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(a => (
          <tr
            key={`${a.branch}-${a.slug}`}
            className='border-b border-ed-rule transition-colors hover:bg-ed-paper-2/60'
          >
            <td className='px-4 py-3.5 align-top'>
              {a.abbr ? <Flag variant='navy'>{a.abbr}</Flag> : null}
            </td>
            <td className='px-4 py-3.5 align-top font-serif-ed text-base text-ed-ink'>
              <Link
                to={a.detailHref}
                className='text-ed-ink no-underline hover:text-ed-navy'
              >
                {a.name}
              </Link>
            </td>
            <td className='px-4 py-3.5 align-top font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
              {a.branch}
            </td>
            <td className='px-4 py-3.5 align-top text-[13px] text-ed-ink-2'>
              {a.head ? (
                <>
                  {a.headRole ? (
                    <span className='block font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                      {a.headRole}
                    </span>
                  ) : null}
                  {a.head}
                </>
              ) : (
                <span className='text-ed-ink-4'>—</span>
              )}
            </td>
            <td className='px-4 py-3.5 align-top text-[13px] text-ed-ink-2'>
              {a.loc ?? <span className='text-ed-ink-4'>—</span>}
            </td>
            <td className='px-4 py-3.5 align-top font-mono-ed text-[13px] text-ed-ink'>
              {a.hotline ?? <span className='text-ed-ink-4'>—</span>}
            </td>
            <td className='px-4 py-3.5 align-top'>
              {a.web ? (
                <a
                  href={visitUrl(a.web)}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 text-xs font-medium text-ed-navy no-underline hover:text-ed-red'
                >
                  Visit <ExternalLinkIcon size={12} />
                </a>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GridView: FC<{ rows: DirectoryEntry[] }> = ({ rows }) => (
  <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
    {rows.map(a => (
      <Link
        key={`${a.branch}-${a.slug}`}
        to={a.detailHref}
        className='group block border border-ed-rule bg-white p-7 text-ed-ink no-underline transition-colors hover:border-ed-ink'
      >
        <div className='flex items-center justify-between'>
          {a.abbr ? (
            <Flag variant='navy'>{a.abbr}</Flag>
          ) : (
            <span className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
              {a.branch}
            </span>
          )}
          {a.abbr && <Eyebrow>{a.branch}</Eyebrow>}
        </div>
        <h3 className='mt-4 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-navy-ink'>
          {a.name}
        </h3>
        <dl className='mt-4 grid gap-1.5 border-t border-ed-rule pt-3.5 text-[13px] text-ed-ink-2'>
          {a.head && (
            <div className='flex items-start gap-2'>
              <UserIcon
                size={14}
                className='mt-0.5 shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <span>
                {a.headRole && (
                  <span className='mr-1.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    {a.headRole}
                  </span>
                )}
                {a.head}
              </span>
            </div>
          )}
          {a.loc && (
            <div className='flex items-center gap-2'>
              <MapPinIcon
                size={14}
                className='shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <span>{a.loc}</span>
            </div>
          )}
          {a.hotline && (
            <div className='flex items-center gap-2'>
              <PhoneIcon
                size={14}
                className='shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <span className='font-mono-ed'>{a.hotline}</span>
            </div>
          )}
        </dl>
        {a.web && (
          <span className='mt-5 inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy'>
            {a.web}
          </span>
        )}
      </Link>
    ))}
  </div>
);

export default GovernmentDirectory;
