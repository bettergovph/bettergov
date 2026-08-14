import { FC, useMemo, useState } from 'react';
import Container from '../../../components/v2/ui/Container';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import SectionHeader from '../../../components/v2/ui/SectionHeader';

interface HolidayDef {
  event: string;
  monthIndex: number; // 0-based
  dayOfMonth: number;
  type: 'regular' | 'special';
}

const HOLIDAYS: HolidayDef[] = [
  { event: "New Year's Day", monthIndex: 0, dayOfMonth: 1, type: 'regular' },
  { event: 'Maundy Thursday', monthIndex: 3, dayOfMonth: 2, type: 'regular' },
  { event: 'Good Friday', monthIndex: 3, dayOfMonth: 3, type: 'regular' },
  {
    event: 'Araw ng Kagitingan',
    monthIndex: 3,
    dayOfMonth: 9,
    type: 'regular',
  },
  { event: 'Labor Day', monthIndex: 4, dayOfMonth: 1, type: 'regular' },
  { event: 'Independence Day', monthIndex: 5, dayOfMonth: 12, type: 'regular' },
  {
    event: 'National Heroes Day',
    monthIndex: 7,
    dayOfMonth: 31,
    type: 'regular',
  },
  { event: 'Bonifacio Day', monthIndex: 10, dayOfMonth: 30, type: 'regular' },
  { event: 'Christmas Day', monthIndex: 11, dayOfMonth: 25, type: 'regular' },
  { event: 'Rizal Day', monthIndex: 11, dayOfMonth: 30, type: 'regular' },
  { event: 'Chinese New Year', monthIndex: 1, dayOfMonth: 17, type: 'special' },
  { event: 'Black Saturday', monthIndex: 3, dayOfMonth: 4, type: 'special' },
  { event: 'Ninoy Aquino Day', monthIndex: 7, dayOfMonth: 21, type: 'special' },
  { event: "All Saints' Day", monthIndex: 10, dayOfMonth: 1, type: 'special' },
  { event: "All Souls' Day", monthIndex: 10, dayOfMonth: 2, type: 'special' },
  {
    event: 'Feast of the Immaculate Conception',
    monthIndex: 11,
    dayOfMonth: 8,
    type: 'special',
  },
  { event: 'Christmas Eve', monthIndex: 11, dayOfMonth: 24, type: 'special' },
  {
    event: 'Last Day of the Year',
    monthIndex: 11,
    dayOfMonth: 31,
    type: 'special',
  },
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const YEARS = [2025, 2026, 2027];

interface ResolvedHoliday {
  event: string;
  monthIndex: number;
  dayOfMonth: number;
  dayName: string;
  date: Date;
  type: 'regular' | 'special';
}

function resolveHolidays(year: number): ResolvedHoliday[] {
  return HOLIDAYS.map(h => {
    const date = new Date(year, h.monthIndex, h.dayOfMonth);
    return {
      ...h,
      dayName: DAY_NAMES[date.getDay()],
      date,
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

const PublicHolidays: FC = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);

  const holidays = useMemo(() => resolveHolidays(year), [year]);

  const upcoming = useMemo(
    () =>
      year === currentYear
        ? holidays.filter(h => h.date >= today).slice(0, 4)
        : [],
    [holidays, year, currentYear, today]
  );

  const byMonth = useMemo(() => {
    const map = new Map<number, ResolvedHoliday[]>();
    holidays.forEach(h => {
      if (!map.has(h.monthIndex)) map.set(h.monthIndex, []);
      map.get(h.monthIndex)!.push(h);
    });
    return map;
  }, [holidays]);

  const monthsWithHolidays = Array.from(byMonth.keys()).sort((a, b) => a - b);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title={`Public Holidays ${year}`}
        lede='Official regular and special non-working holidays declared by the Philippine government under Malacañang proclamations and Republic Act 9492.'
      >
        {/* Year switcher */}
        <div className='flex items-center gap-2'>
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={
                y === year
                  ? 'border border-white bg-white px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy-ink'
                  : 'border border-white/40 px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-white/70 hover:border-white hover:text-white transition-colors'
              }
            >
              {y}
            </button>
          ))}
        </div>
      </PageMasthead>

      <section className='py-14 max-md:py-8'>
        <Container>
          <div className='grid grid-cols-[1fr_280px] gap-12 max-lg:grid-cols-1'>
            {/* Main: holiday table */}
            <div>
              {/* Upcoming strip */}
              {upcoming.length > 0 && (
                <div className='mb-10'>
                  <SectionHeader label='Upcoming' />
                  <div className='grid grid-cols-2 gap-4 max-sm:grid-cols-1'>
                    {upcoming.map(h => (
                      <div
                        key={h.event}
                        className='border border-ed-rule bg-ed-paper-2 p-4'
                      >
                        <div className='mb-1.5'>
                          <Flag
                            variant={h.type === 'regular' ? 'navy' : 'default'}
                          >
                            {h.type === 'regular' ? 'Regular' : 'Special'}
                          </Flag>
                        </div>
                        <div className='font-serif-ed text-[17px] font-semibold leading-snug text-ed-ink'>
                          {h.event}
                        </div>
                        <div className='mt-1 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                          {MONTH_NAMES[h.monthIndex]} {h.dayOfMonth} ·{' '}
                          {h.dayName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Month-by-month table */}
              <SectionHeader label={`Full calendar · ${year}`} />

              {/* Column headers */}
              <div className='grid grid-cols-[100px_60px_60px_1fr_100px] border-b border-ed-rule pb-2 max-sm:hidden'>
                {['Month', 'Date', 'Day', 'Holiday', 'Type'].map(h => (
                  <div
                    key={h}
                    className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div>
                {monthsWithHolidays.map(monthIdx => {
                  const monthHolidays = byMonth.get(monthIdx)!;
                  return (
                    <div key={monthIdx}>
                      {monthHolidays.map((h, i) => (
                        <div
                          key={h.event}
                          className='grid grid-cols-[100px_60px_60px_1fr_100px] items-baseline border-b border-ed-rule py-3 max-sm:grid-cols-1 max-sm:gap-0.5 max-sm:py-4'
                        >
                          {/* Month label — only on first row of each month */}
                          <div className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-sm:hidden'>
                            {i === 0 ? MONTH_NAMES[monthIdx] : ''}
                          </div>
                          <div className='font-serif-ed text-[17px] font-semibold text-ed-ink max-sm:hidden'>
                            {h.dayOfMonth}
                          </div>
                          <div className='text-[12px] text-ed-ink-3 max-sm:hidden'>
                            {h.dayName.slice(0, 3)}
                          </div>
                          <div className='font-serif-ed text-[16px] font-semibold leading-snug text-ed-ink max-sm:text-[15px]'>
                            {h.event}
                          </div>
                          <div className='max-sm:hidden'>
                            <Flag
                              variant={
                                h.type === 'regular' ? 'navy' : 'default'
                              }
                            >
                              {h.type === 'regular' ? 'Regular' : 'Special'}
                            </Flag>
                          </div>
                          {/* Mobile summary line */}
                          <div className='font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3 sm:hidden'>
                            {MONTH_NAMES[monthIdx]} {h.dayOfMonth} ·{' '}
                            {h.dayName.slice(0, 3)} ·{' '}
                            {h.type === 'regular' ? 'Regular' : 'Special'}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar: source notes + legend */}
            <aside className='max-lg:border-t max-lg:border-ed-rule max-lg:pt-8'>
              {/* Legend */}
              <div className='mb-8'>
                <SectionHeader label='Legend' />
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <Flag variant='navy'>Regular</Flag>
                    <p className='text-[12px] text-ed-ink-2 leading-normal'>
                      Employees entitled to 200% of daily rate if required to
                      work.
                    </p>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Flag variant='default'>Special</Flag>
                    <p className='text-[12px] text-ed-ink-2 leading-normal'>
                      Employees entitled to 130% if required to work.
                    </p>
                  </div>
                </div>
              </div>

              {/* Source notes */}
              <div className='border border-ed-rule p-5'>
                <div className='mb-3 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  Sources
                </div>
                <ul className='space-y-2.5 text-[12px] text-ed-ink-2 leading-normal'>
                  <li>
                    <span className='font-medium text-ed-ink'>
                      Republic Act 9492
                    </span>{' '}
                    — rationalises the observance of national public holidays.
                  </li>
                  <li>
                    <span className='font-medium text-ed-ink'>
                      Malacañang Proclamations
                    </span>{' '}
                    — annual adjustments issued by the Office of the President.
                  </li>
                  <li>
                    <span className='font-medium text-ed-ink'>
                      DOLE Labour Advisory
                    </span>{' '}
                    — guidelines on pay rules for holidays.
                  </li>
                </ul>
              </div>

              {/* Stats */}
              <div className='mt-6 grid grid-cols-2 divide-x divide-ed-rule border border-ed-rule'>
                <div className='p-4'>
                  <div className='font-serif-ed text-[28px] font-semibold text-ed-ink'>
                    {holidays.filter(h => h.type === 'regular').length}
                  </div>
                  <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    Regular
                  </div>
                </div>
                <div className='p-4'>
                  <div className='font-serif-ed text-[28px] font-semibold text-ed-ink'>
                    {holidays.filter(h => h.type === 'special').length}
                  </div>
                  <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    Special
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default PublicHolidays;
