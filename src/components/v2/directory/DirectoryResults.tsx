import { FC, ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import Flag from '../ui/Flag';
import { cn } from '../../../lib/utils';
import type { DirectoryEntry } from '../../../lib/directory';

type View = 'list' | 'grid';

type Props = {
  entries: DirectoryEntry[];
  /** Rendered on the right of the results header. Useful for custom filters. */
  headerExtras?: ReactNode;
  /** Placeholder shown inside the search input. */
  searchPlaceholder?: string;
  /** Noun used in the result count ("agencies", "departments", …). */
  countNoun?: string;
  /** Initial view mode. Defaults to 'list'. */
  initialView?: View;
  /** When true, callers can provide external filters via entries already filtered. */
  onClearFilters?: () => void;
  /** Whether the Clear filters button should show when query is set. */
  showClear?: boolean;
};

const visitUrl = (web: string) => `https://${web.replace(/^https?:\/\//, '')}`;

const DirectoryResults: FC<Props> = ({
  entries,
  headerExtras,
  searchPlaceholder = 'Search by name, acronym, or head',
  countNoun = 'entries',
  initialView = 'list',
  onClearFilters,
  showClear,
}) => {
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>(initialView);

  const results = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (!q.trim()) return sorted;
    const n = q.toLowerCase();
    return sorted.filter(e =>
      `${e.name} ${e.abbr ?? ''} ${e.head ?? ''} ${e.branch}`
        .toLowerCase()
        .includes(n)
    );
  }, [entries, q]);

  return (
    <section className='py-10 max-md:py-6'>
      <Container>
        <div className='mb-6 grid grid-cols-[1fr_auto_auto] items-center gap-4 max-lg:grid-cols-1 max-lg:gap-3'>
          <div className='relative'>
            <SearchIcon
              size={16}
              className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
            />
            <input
              type='search'
              aria-label='Search directory'
              placeholder={searchPlaceholder}
              value={q}
              onChange={e => setQ(e.target.value)}
              className='block w-full border border-ed-ink bg-white py-3 pl-10 pr-4 font-sans-ed text-[15px] text-ed-ink outline-none placeholder:text-ed-ink-4'
            />
          </div>
          {headerExtras}
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

        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
            Showing{' '}
            <strong className='text-sm text-ed-ink'>{results.length}</strong>
            {' of '}
            {entries.length} {countNoun}
            {q && (
              <>
                {' for '}
                <em className='not-italic text-ed-ink'>&ldquo;{q}&rdquo;</em>
              </>
            )}
          </div>
          {((q || showClear) && onClearFilters) || q ? (
            <button
              onClick={() => {
                setQ('');
                onClearFilters?.();
              }}
              className='font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy no-underline hover:text-ed-red'
            >
              Clear filters
            </button>
          ) : null}
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
  );
};

const EmptyState: FC = () => (
  <div className='border border-dashed border-ed-rule py-20 text-center text-ed-ink-3'>
    <div className='font-serif-ed text-[28px] text-ed-ink-2'>
      No entries match.
    </div>
    <p className='mt-2 text-sm'>Try a different term.</p>
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
              className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left max-md:px-3 max-md:py-2 font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(a => (
          <tr
            key={`${a.kind}-${a.slug}`}
            className='border-b border-ed-rule transition-colors hover:bg-ed-paper-2/60'
          >
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5'>
              {a.abbr ? <Flag variant='navy'>{a.abbr}</Flag> : null}
            </td>
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5 font-serif-ed text-base text-ed-ink'>
              <Link
                to={a.detailHref}
                className='text-ed-ink no-underline hover:text-ed-navy'
              >
                {a.name}
              </Link>
            </td>
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
              {a.branch}
            </td>
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5 text-[13px] text-ed-ink-2'>
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
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5 text-[13px] text-ed-ink-2'>
              {a.loc ?? <span className='text-ed-ink-4'>—</span>}
            </td>
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5 font-mono-ed text-[13px] text-ed-ink'>
              {a.hotline ?? <span className='text-ed-ink-4'>—</span>}
            </td>
            <td className='px-4 py-3.5 align-top max-md:px-3 max-md:py-2.5'>
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
  <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:gap-3 max-sm:grid-cols-1'>
    {rows.map(a => (
      <Link
        key={`${a.kind}-${a.slug}`}
        to={a.detailHref}
        className='group block border border-ed-rule bg-white p-7 text-ed-ink no-underline transition-colors hover:border-ed-ink max-md:p-4'
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
        <h3 className='mt-4 font-serif-ed text-[22px] font-semibold leading-tight tracking-[-0.005em] text-ed-navy-ink max-md:mt-2.5 max-md:text-[18px]'>
          {a.name}
        </h3>
        <dl className='mt-4 grid gap-1.5 border-t border-ed-rule pt-3.5 text-[13px] text-ed-ink-2 max-md:mt-2.5 max-md:gap-1 max-md:pt-2.5 max-md:text-xs'>
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
          <span className='mt-5 inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy max-md:mt-3 max-md:text-[13px]'>
            {a.web}
          </span>
        )}
      </Link>
    ))}
  </div>
);

export default DirectoryResults;
