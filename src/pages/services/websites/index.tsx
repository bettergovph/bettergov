import { ChangeEvent, FC, useMemo, useState } from 'react';
import { ExternalLinkIcon, SearchIcon, XIcon } from 'lucide-react';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import websitesData from '../../../data/websites.json';

interface Website {
  name: string;
  slug: string;
  email: string | string[] | null;
  website: string | null;
  address: string | null;
  contact: string | null;
  type: string;
  parent_department: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  departments: 'Department',
  executive: 'Executive Office',
  legislative: 'Legislative',
  constitutional: 'Constitutional / SUC',
  bureau: 'Bureau',
  'attached-agencies': 'Attached Agency',
  diplomatic: 'Diplomatic',
  'foreign-service': 'Foreign Service',
  'regional-office': 'Regional Office',
  'under-administrative_supervision': 'Admin. Supervision',
  'under-supervision_and_control': 'Supervision & Control',
};

const TOP_TYPES = [
  'departments',
  'executive',
  'constitutional',
  'bureau',
  'attached-agencies',
  'legislative',
];

const formatUrl = (url: string | null) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
};

const typeLabel = (t: string) => TYPE_LABELS[t] ?? t.replace(/-/g, ' ');

const WebsitesDirectory: FC = () => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const allTypes = useMemo(() => {
    const set = new Set<string>();
    (websitesData as Website[]).forEach(w => set.add(w.type));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (websitesData as Website[]).filter(w => {
      const matchSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        (w.website && w.website.toLowerCase().includes(q)) ||
        (w.parent_department && w.parent_department.toLowerCase().includes(q));
      const matchType = !selectedType || w.type === selectedType;
      return matchSearch && matchType;
    });
  }, [search, selectedType]);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (websitesData as Website[]).forEach(w => {
      map[w.type] = (map[w.type] ?? 0) + 1;
    });
    return map;
  }, []);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title='Government Websites'
        lede='Official online presence of Philippine government agencies, bureaus, SUCs, and diplomatic posts.'
      />

      <section className='py-14 max-md:py-8'>
        <Container>
          <div className='grid grid-cols-[220px_1fr] gap-10 max-lg:grid-cols-1'>
            {/* Sidebar: category filter */}
            <aside className='max-lg:order-last'>
              <div className='sticky top-6'>
                <div className='mb-4 border-t-2 border-ed-navy pt-4'>
                  <Eyebrow tone='navy'>Filter by type</Eyebrow>
                </div>
                <div className='space-y-0.5'>
                  <button
                    onClick={() => setSelectedType('')}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      selectedType === ''
                        ? 'bg-ed-navy text-white'
                        : 'text-ed-ink hover:bg-ed-paper-2'
                    }`}
                  >
                    <span>All agencies</span>
                    <span
                      className={`font-mono-ed text-[10px] ${selectedType === '' ? 'text-white/70' : 'text-ed-ink-3'}`}
                    >
                      {(websitesData as Website[]).length}
                    </span>
                  </button>
                  {allTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                        selectedType === t
                          ? 'bg-ed-navy text-white'
                          : 'text-ed-ink hover:bg-ed-paper-2'
                      }`}
                    >
                      <span>{typeLabel(t)}</span>
                      <span
                        className={`font-mono-ed text-[10px] ${selectedType === t ? 'text-white/70' : 'text-ed-ink-3'}`}
                      >
                        {typeCounts[t] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main: search + listing */}
            <div>
              {/* Search bar */}
              <div className='mb-6 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start'>
                <div className='relative flex-1 max-w-md'>
                  <SearchIcon
                    size={14}
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-ed-ink-3'
                  />
                  <input
                    type='text'
                    placeholder='Search agencies or websites…'
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                    className='w-full border border-ed-rule bg-white py-2.5 pl-8 pr-8 font-sans-ed text-sm text-ed-ink placeholder:text-ed-ink-4 focus:border-ed-ink focus:outline-none'
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-ed-ink-3 hover:text-ed-ink'
                    >
                      <XIcon size={13} />
                    </button>
                  )}
                </div>
                <div className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Table header */}
              <div className='grid grid-cols-[1fr_180px_120px] border-b border-ed-rule pb-2 max-md:hidden'>
                {['Agency', 'Website', 'Type'].map(h => (
                  <div
                    key={h}
                    className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'
                  >
                    {h}
                  </div>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className='py-16 text-center'>
                  <p className='text-sm text-ed-ink-3'>
                    No agencies match{' '}
                    {search ? <>&ldquo;{search}&rdquo;</> : 'this filter'}.
                  </p>
                  {(search || selectedType) && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedType('');
                      }}
                      className='mt-3 text-[13px] font-medium text-ed-navy hover:underline'
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className='divide-y divide-ed-rule'>
                  {filtered.map((w, i) => {
                    const url = formatUrl(w.website);
                    return (
                      <div
                        key={`${w.slug}-${i}`}
                        className='grid grid-cols-[1fr_180px_120px] items-center py-3.5 max-md:grid-cols-1 max-md:gap-1 max-md:py-4'
                      >
                        {/* Agency name */}
                        <div>
                          <div className='text-[14px] font-medium leading-snug text-ed-ink'>
                            {w.name
                              .split(' ')
                              .map(
                                word =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
                              .join(' ')}
                          </div>
                          {w.parent_department && (
                            <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3'>
                              {w.parent_department
                                .split(' ')
                                .map(
                                  word =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(' ')}
                            </div>
                          )}
                        </div>

                        {/* Website */}
                        <div className='max-md:hidden'>
                          {url ? (
                            <a
                              href={url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center gap-1 font-mono-ed text-[11px] text-ed-navy hover:underline'
                            >
                              {w.website}
                              <ExternalLinkIcon size={10} />
                            </a>
                          ) : (
                            <span className='font-mono-ed text-[10px] text-ed-ink-4'>
                              —
                            </span>
                          )}
                        </div>

                        {/* Type flag */}
                        <div className='max-md:hidden'>
                          <Flag
                            variant={
                              TOP_TYPES.includes(w.type) ? 'navy' : 'default'
                            }
                          >
                            {typeLabel(w.type)}
                          </Flag>
                        </div>

                        {/* Mobile summary */}
                        <div className='md:hidden'>
                          <div className='flex items-center gap-2'>
                            <Flag
                              variant={
                                TOP_TYPES.includes(w.type) ? 'navy' : 'default'
                              }
                            >
                              {typeLabel(w.type)}
                            </Flag>
                            {url && (
                              <a
                                href={url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1 font-mono-ed text-[10px] text-ed-navy hover:underline'
                              >
                                {w.website}
                                <ExternalLinkIcon size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default WebsitesDirectory;
