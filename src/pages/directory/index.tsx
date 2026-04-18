import { FC, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DownloadIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from 'lucide-react';
import agencies from '../../data/agencies.json';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import { cn } from '../../lib/utils';

type Agency = (typeof agencies)[number];
type View = 'list' | 'grid';

const visitUrl = (web: string) => `https://${web.replace(/^https?:\/\//, '')}`;

const DirectoryPage: FC = () => {
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState<string>('All');
  const [view, setView] = useState<View>('list');

  const branches = useMemo(
    () => ['All', ...Array.from(new Set(agencies.map(a => a.branch)))],
    []
  );

  const results = useMemo(() => {
    let r = agencies.slice();
    if (branch !== 'All') r = r.filter(a => a.branch === branch);
    if (q) {
      const n = q.toLowerCase();
      r = r.filter(a =>
        (a.name + ' ' + a.abbr + ' ' + a.head).toLowerCase().includes(n)
      );
    }
    return r.sort((a, b) => a.name.localeCompare(b.name));
  }, [q, branch]);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Agency Directory | BetterGov.ph</title>
        <meta
          name='description'
          content='Every national Philippine government agency, GOCC, and constitutional body — with verified hotlines, heads of office, and official domains.'
        />
      </Helmet>

      <PageMasthead
        eyebrow={`The Directory · ${agencies.length} agencies tracked`}
        title={
          <>
            Every agency, <em className='italic font-normal'>one directory.</em>
          </>
        }
        lede='Every national government agency, GOCC, constitutional body, and major LGU — with verified hotlines, heads of office, and official domains. Updated weekly.'
      >
        {/* Search + branch filter + view toggle */}
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
          <div className='inline-flex'>
            {branches.map((b, i) => (
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
          <div className='mb-6 flex items-center justify-between'>
            <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
              Showing{' '}
              <strong className='text-sm text-ed-ink'>{results.length}</strong>
              {' of '}
              {agencies.length} agencies
            </div>
            <a
              href='/agencies.csv'
              className='inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy no-underline transition-colors hover:border-ed-red hover:text-ed-red'
              onClick={e => e.preventDefault()}
              aria-disabled
              title='CSV export coming soon'
            >
              Download CSV <DownloadIcon size={14} />
            </a>
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

const ListView: FC<{ rows: Agency[] }> = ({ rows }) => (
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
            key={a.abbr}
            className='border-b border-ed-rule transition-colors hover:bg-ed-paper-2/60'
          >
            <td className='px-4 py-3.5 align-top'>
              <Flag variant='navy'>{a.abbr}</Flag>
            </td>
            <td className='px-4 py-3.5 align-top font-serif-ed text-base text-ed-ink'>
              {a.name}
            </td>
            <td className='px-4 py-3.5 align-top font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
              {a.branch}
            </td>
            <td className='px-4 py-3.5 align-top text-[13px] text-ed-ink-2'>
              {a.head}
            </td>
            <td className='px-4 py-3.5 align-top text-[13px] text-ed-ink-2'>
              {a.loc}
            </td>
            <td className='px-4 py-3.5 align-top font-mono-ed text-[13px] text-ed-ink'>
              {a.hotline}
            </td>
            <td className='px-4 py-3.5 align-top'>
              <a
                href={visitUrl(a.web)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-xs font-medium text-ed-navy no-underline hover:text-ed-red'
              >
                Visit <ExternalLinkIcon size={12} />
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const GridView: FC<{ rows: Agency[] }> = ({ rows }) => (
  <div className='grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
    {rows.map(a => (
      <div
        key={a.abbr}
        className='border border-ed-rule bg-white p-7 transition-colors hover:border-ed-ink'
      >
        <div className='flex items-center justify-between'>
          <Flag variant='navy'>{a.abbr}</Flag>
          <Eyebrow>{a.branch}</Eyebrow>
        </div>
        <h3 className='mt-4 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-navy-ink'>
          {a.name}
        </h3>
        <dl className='mt-4 grid gap-1.5 border-t border-ed-rule pt-3.5 text-[13px] text-ed-ink-2'>
          <div className='flex items-center gap-2'>
            <UserIcon size={14} className='shrink-0 text-ed-ink-3' />
            <span>{a.head}</span>
          </div>
          <div className='flex items-center gap-2'>
            <MapPinIcon size={14} className='shrink-0 text-ed-ink-3' />
            <span>{a.loc}</span>
          </div>
          <div className='flex items-center gap-2'>
            <PhoneIcon size={14} className='shrink-0 text-ed-ink-3' />
            <span className='font-mono-ed'>{a.hotline}</span>
          </div>
        </dl>
        <a
          href={visitUrl(a.web)}
          target='_blank'
          rel='noreferrer'
          className='mt-5 inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
        >
          {a.web} <ExternalLinkIcon size={12} />
        </a>
      </div>
    ))}
  </div>
);

export default DirectoryPage;
