import { FC, ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircleIcon, ArrowRightIcon, SearchIcon } from 'lucide-react';
import visaData from '../../../data/visa/philippines_visa_types.json';
import { VisaType } from '@/types/visa.ts';
import { getCategoryIcon } from './visa.util';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';

type VisaCategory = {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  visaTypes: VisaType[];
};

const VisaTypesPage: FC = () => {
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<string>('non-immigrant');

  const categories: VisaCategory[] = useMemo(
    () =>
      visaData.categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: getCategoryIcon(category.id),
        visaTypes: category.visaTypes,
      })),
    []
  );

  const filteredCategories = useMemo(() => {
    if (!q.trim()) return categories;
    const n = q.toLowerCase();
    return categories
      .map(c => ({
        ...c,
        visaTypes: c.visaTypes.filter(
          v =>
            v.name.toLowerCase().includes(n) ||
            v.description.toLowerCase().includes(n)
        ),
      }))
      .filter(c => c.visaTypes.length > 0);
  }, [categories, q]);

  const isSearching = q.trim().length > 0;
  const allResults = isSearching
    ? filteredCategories.flatMap(c => c.visaTypes)
    : [];

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Philippine Visa Types | BetterGov.ph</title>
        <meta
          name='description'
          content='Visa categories for travel to the Philippines — tourist, non-immigrant, immigrant, and special visas.'
        />
      </Helmet>

      <PageMasthead
        variant='hero'
        title={
          <>
            Philippine visa types,{' '}
            <em className='italic font-normal'>by category.</em>
          </>
        }
        lede='Explore the different types of visas available for travel to the Philippines — grouped by category, each linking to the specific requirements, fees, and validity.'
      />

      {/* Search bar */}
      <section className='border-b border-ed-rule bg-white'>
        <Container className='py-5'>
          <div className='relative max-w-xl'>
            <SearchIcon
              size={16}
              className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
            />
            <input
              type='search'
              aria-label='Search visa types'
              placeholder='Search visa types…'
              value={q}
              onChange={e => setQ(e.target.value)}
              className='block w-full border border-ed-ink bg-white py-3 pl-10 pr-4 font-sans-ed text-[15px] text-ed-ink outline-none placeholder:text-ed-ink-4'
            />
          </div>
        </Container>
      </section>

      <section className='py-10 max-md:py-6'>
        <Container>
          {isSearching ? (
            <>
              <div className='mb-6'>
                <Eyebrow>
                  {allResults.length} results for &ldquo;{q}&rdquo;
                </Eyebrow>
              </div>
              {allResults.length === 0 ? (
                <div className='border border-dashed border-ed-rule py-16 text-center font-serif-ed text-lg text-ed-ink-3'>
                  No visa types match. Try another term.
                </div>
              ) : (
                <div className='grid grid-cols-3 gap-0 border-t-2 border-ed-navy max-lg:grid-cols-2 max-sm:grid-cols-1'>
                  {allResults.map(v => (
                    <VisaCard key={v.id} visa={v} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className='grid grid-cols-[260px_1fr] gap-12 max-lg:grid-cols-1 max-lg:gap-6'>
              {/* Sidebar categories */}
              <aside>
                <div className='mb-3'>
                  <Eyebrow>Categories</Eyebrow>
                </div>
                <nav className='flex flex-col border border-ed-rule bg-white max-lg:flex-row max-lg:flex-wrap max-lg:border-0'>
                  {categories.map(c => {
                    const active = c.id === selectedCategory;
                    return (
                      <button
                        key={c.id}
                        type='button'
                        onClick={() => setSelectedCategory(c.id)}
                        className={cn(
                          'flex items-center gap-3 border-b border-ed-rule px-4 py-3 text-left font-serif-ed text-[15px] transition-colors last:border-b-0 max-lg:border-b-0 max-lg:border-r max-lg:last:border-r-0',
                          active
                            ? 'bg-ed-navy text-white'
                            : 'text-ed-ink hover:bg-ed-navy-tint'
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0',
                            active ? 'text-white' : 'text-ed-navy'
                          )}
                          aria-hidden
                        >
                          {c.icon}
                        </span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Category panel */}
              <div>
                {categories
                  .filter(c => c.id === selectedCategory)
                  .map(c => (
                    <div key={c.id}>
                      <div className='border-b border-ed-navy pb-3'>
                        <div className='flex items-center gap-3'>
                          <span className='text-ed-navy' aria-hidden>
                            {c.icon}
                          </span>
                          <h2 className='m-0 font-serif-ed text-[32px] font-semibold leading-tight tracking-[-0.01em] text-ed-navy-ink'>
                            {c.name}
                          </h2>
                        </div>
                        <p className='mt-3 max-w-2xl font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                          {c.description}
                        </p>
                      </div>
                      <div className='mt-6 grid grid-cols-2 gap-0 max-sm:grid-cols-1'>
                        {c.visaTypes.map(v => (
                          <VisaCard key={v.id} visa={v} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Source notice */}
          <aside className='mt-12 border border-ed-rule-strong bg-ed-paper-2 p-7'>
            <div className='flex items-start gap-3'>
              <AlertCircleIcon
                size={18}
                className='mt-0.5 shrink-0 text-ed-navy'
                aria-hidden
              />
              <div>
                <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy'>
                  Source note
                </div>
                <p className='mt-1.5 text-sm leading-relaxed text-ed-ink-2'>
                  This information is provided for reference only. For the most
                  accurate and up-to-date visa requirements, consult the
                  official{' '}
                  <a
                    href='https://immigration.gov.ph/visas/'
                    target='_blank'
                    rel='noreferrer'
                    className='border-b border-ed-navy pb-0.5 text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
                  >
                    Philippine Bureau of Immigration
                  </a>{' '}
                  or{' '}
                  <a
                    href='https://dfa.gov.ph/'
                    target='_blank'
                    rel='noreferrer'
                    className='border-b border-ed-navy pb-0.5 text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
                  >
                    Department of Foreign Affairs
                  </a>
                  .
                </p>
                <p className='mt-2 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                  Last updated · {visaData.sourceInfo.lastUpdated}
                </p>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
};

const VisaCard: FC<{ visa: VisaType }> = ({ visa }) => (
  <Link
    to={`/travel/visa-types/${visa.id}`}
    className='group block border border-ed-rule bg-white p-5 text-ed-ink no-underline transition-colors hover:border-ed-ink [.grid-cols-2_&]:border-r-0 [.grid-cols-2_&:nth-child(odd)]:border-r [.grid-cols-2_&:not(:last-child):not(:nth-last-child(2))]:border-b [.grid-cols-2_&]:last:border-b-0 [.grid-cols-3_&]:border-r-0 [.grid-cols-3_&:not(:nth-child(3n))]:border-r [.grid-cols-3_&:not(:nth-last-child(-n+3))]:border-b'
  >
    <div className='flex items-start justify-between gap-3'>
      <h3 className='font-serif-ed text-[18px] font-semibold leading-tight text-ed-navy-ink'>
        {visa.name}
      </h3>
      <ArrowRightIcon
        size={14}
        className='mt-1 shrink-0 text-ed-navy transition-transform group-hover:translate-x-1'
      />
    </div>
    <p className='mt-2 line-clamp-3 text-sm leading-normal text-ed-ink-2'>
      {visa.description}
    </p>
  </Link>
);

export default VisaTypesPage;
