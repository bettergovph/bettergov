import { FC, useMemo, useState } from 'react';
import { PhoneIcon, SearchIcon } from 'lucide-react';
import hotlinesData from '../../data/philippines_hotlines.json';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import ReportHotlineModal from '../../components/ReportHotlineModal';
import { cn } from '../../lib/utils';

interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}

type CategoryId =
  | 'all'
  | 'emergency'
  | 'disaster'
  | 'security'
  | 'transport'
  | 'weather'
  | 'utility'
  | 'social';

const CATEGORY_KEYS: Exclude<CategoryId, 'all'>[] = [
  'emergency',
  'disaster',
  'security',
  'transport',
  'weather',
  'utility',
  'social',
];

const categoryLabel: Record<CategoryId, string> = {
  all: 'All hotlines',
  emergency: 'Emergency',
  disaster: 'Disaster',
  security: 'Security',
  transport: 'Transport',
  weather: 'Weather',
  utility: 'Utilities',
  social: 'Social Services',
};

/** Ids flagged as "critical" — rendered with a red flag on the row. */
const CRITICAL_IDS = new Set<CategoryId>(['emergency', 'disaster', 'security']);

const getListFor = (category: CategoryId): Hotline[] => {
  switch (category) {
    case 'emergency':
      return hotlinesData.emergencyHotlines as Hotline[];
    case 'disaster':
      return hotlinesData.disasterHotlines as Hotline[];
    case 'security':
      return hotlinesData.securityHotlines as Hotline[];
    case 'transport':
      return hotlinesData.transportHotlines as Hotline[];
    case 'weather':
      return hotlinesData.weatherHotlines as Hotline[];
    case 'utility':
      return hotlinesData.utilityHotlines as Hotline[];
    case 'social':
      return hotlinesData.socialServicesHotlines as Hotline[];
    default:
      return [
        ...hotlinesData.emergencyHotlines,
        ...hotlinesData.disasterHotlines,
        ...hotlinesData.securityHotlines,
        ...hotlinesData.transportHotlines,
        ...hotlinesData.weatherHotlines,
        ...hotlinesData.utilityHotlines,
        ...hotlinesData.socialServicesHotlines,
      ] as Hotline[];
  }
};

const Hotlines: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const counts = useMemo(() => {
    const entries = CATEGORY_KEYS.map(
      id => [id, getListFor(id).length] as const
    );
    return {
      all: entries.reduce((sum, [, n]) => sum + n, 0),
      ...Object.fromEntries(entries),
    } as Record<CategoryId, number>;
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = getListFor(activeCategory);
    if (!q) return list;
    return list.filter(
      h =>
        h.name.toLowerCase().includes(q) ||
        h.numbers.some(n => n.toLowerCase().includes(q)) ||
        (h.description?.toLowerCase().includes(q) ?? false)
    );
  }, [activeCategory, searchTerm]);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        eyebrow='§ Philippines · Hotlines'
        title='When you need help now'
        lede='Emergency, disaster, and government hotlines — nationally available and updated from official sources. Tap any number to call directly.'
      >
        <div className='relative max-w-xl'>
          <SearchIcon
            size={16}
            className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
          />
          <input
            type='search'
            aria-label='Search hotlines'
            placeholder='Search by name or number — e.g. NDRRMC, DOH, 911'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='block w-full border border-ed-ink bg-white py-3 pl-10 pr-4 font-sans-ed text-[15px] text-ed-ink outline-none placeholder:text-ed-ink-4'
          />
        </div>
      </PageMasthead>

      {/* Category filter row */}
      <section className='border-b border-ed-rule bg-white py-4'>
        <Container>
          <div className='flex flex-wrap items-center gap-2'>
            <Eyebrow className='mr-1'>Refine</Eyebrow>
            <CategoryPill
              id='all'
              active={activeCategory === 'all'}
              count={counts.all}
              onClick={() => setActiveCategory('all')}
            />
            {CATEGORY_KEYS.map(id => (
              <CategoryPill
                key={id}
                id={id}
                active={activeCategory === id}
                count={counts[id]}
                onClick={() => setActiveCategory(id)}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Results */}
      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between border-b border-ed-ink pb-3.5'>
            <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
              <strong className='text-sm text-ed-ink'>{filtered.length}</strong>{' '}
              hotline{filtered.length === 1 ? '' : 's'}
              {searchTerm ? (
                <>
                  {' '}
                  for{' '}
                  <em className='not-italic text-ed-ink'>
                    &ldquo;{searchTerm}&rdquo;
                  </em>
                </>
              ) : null}
            </div>
            {(searchTerm || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                className='font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy no-underline hover:text-ed-red'
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className='py-20 text-center text-ed-ink-3'>
              <div className='font-serif-ed text-[28px] text-ed-ink-2'>
                No hotlines found.
              </div>
              <p className='mt-2 text-sm'>Try a different term or category.</p>
            </div>
          ) : (
            <ul className='divide-y divide-ed-rule'>
              {filtered.map((h, i) => {
                const cat = (h.category ?? activeCategory) as CategoryId;
                const isCritical = CRITICAL_IDS.has(cat);
                return (
                  <li
                    key={`${h.name}-${i}`}
                    className='grid grid-cols-[60px_1fr_minmax(260px,_320px)] gap-6 py-6 max-md:grid-cols-1 max-md:gap-3 max-md:py-5'
                  >
                    <div className='pt-1 font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-4 max-md:pt-0'>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className='flex flex-wrap items-baseline gap-3'>
                        <Flag variant={isCritical ? 'red' : 'navy'}>
                          {categoryLabel[cat] ?? h.category}
                        </Flag>
                      </div>
                      <h3 className='mt-2.5 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-ink'>
                        {h.name}
                      </h3>
                      {h.description && (
                        <p className='mt-1.5 max-w-[620px] text-sm leading-normal text-ed-ink-2'>
                          {h.description}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col gap-2 border-l border-ed-rule pl-5 max-md:border-l-0 max-md:pl-0 max-md:pt-2'>
                      {h.numbers.map((n, idx) => (
                        <a
                          key={idx}
                          href={`tel:${n.replace(/[^0-9+]/g, '')}`}
                          className={cn(
                            'inline-flex items-center gap-2 font-mono-ed text-[15px] font-medium no-underline',
                            isCritical
                              ? 'text-ed-red hover:text-ed-red-ink'
                              : 'text-ed-navy hover:text-ed-navy-ink'
                          )}
                        >
                          <PhoneIcon size={14} className='shrink-0' />
                          <span>{n}</span>
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className='mt-10 border-t border-ed-rule pt-6'>
            <p className='font-sans-ed text-sm text-ed-ink-3'>
              These hotlines are collected from official government sources. If
              you notice any outdated information, please report it so the
              registry stays useful.
            </p>
            <button
              type='button'
              onClick={() => setIsReportModalOpen(true)}
              className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy hover:text-ed-red'
            >
              Report outdated information →
            </button>
          </div>
        </Container>
      </section>

      <ReportHotlineModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </main>
  );
};

const CategoryPill: FC<{
  id: CategoryId;
  active: boolean;
  count: number;
  onClick: () => void;
}> = ({ id, active, count, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex items-center gap-2 border px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.12em] transition-colors',
      active
        ? 'border-ed-navy bg-ed-navy text-white'
        : 'border-ed-rule-strong bg-white text-ed-ink-2 hover:border-ed-navy hover:text-ed-navy'
    )}
  >
    <span>{categoryLabel[id]}</span>
    <span className={active ? 'text-white/70' : 'text-ed-ink-4'}>{count}</span>
  </button>
);

export default Hotlines;
