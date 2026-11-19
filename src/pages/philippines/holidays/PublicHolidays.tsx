import { FC, useMemo, useState } from 'react';
import Container from '../../../components/v2/ui/Container';
import Flag from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import {
  HOLIDAY_PAY,
  HOLIDAY_TYPE_LABEL,
  HOLIDAY_YEARS,
  HOLIDAYS_VERIFIED_ON,
  holidayParts,
  isDayOff,
  manilaToday,
  type Holiday,
  type HolidayType,
} from '../../../data/holidays';

const FLAG_VARIANT: Record<HolidayType, 'navy' | 'default' | 'outline'> = {
  regular: 'navy',
  'special-non-working': 'default',
  'special-working': 'outline',
};

const TypeFlag: FC<{ type: HolidayType }> = ({ type }) => (
  <Flag variant={FLAG_VARIANT[type]}>{HOLIDAY_TYPE_LABEL[type]}</Flag>
);

const formatVerified = (iso: string) =>
  new Date(`${iso}T00:00:00+08:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });

const PublicHolidays: FC = () => {
  const today = useMemo(() => manilaToday(), []);
  const currentYear = Number(today.slice(0, 4));
  const years = HOLIDAY_YEARS.map(y => y.year);
  const [year, setYear] = useState(
    years.includes(currentYear) ? currentYear : years[years.length - 1]
  );
  const entry = HOLIDAY_YEARS.find(y => y.year === year)!;

  const upcoming = useMemo(
    () =>
      year === currentYear
        ? entry.holidays.filter(h => h.date >= today && isDayOff(h)).slice(0, 4)
        : [],
    [entry, year, currentYear, today]
  );

  const byMonth = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const h of entry.holidays) {
      const { month } = holidayParts(h);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(h);
    }
    return [...map.entries()];
  }, [entry]);

  const count = (type: HolidayType) =>
    entry.holidays.filter(h => h.type === type).length;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title={`Public holidays ${year}`}
        lede='Regular holidays and special days declared nationwide under Republic Act No. 9492 and the proclamations of the Office of the President.'
      >
        <div className='flex items-center gap-2'>
          {years.map(y => (
            <button
              key={y}
              type='button'
              aria-pressed={y === year}
              onClick={() => setYear(y)}
              className={
                y === year
                  ? 'border border-white bg-white px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy-ink'
                  : 'border border-white/40 px-3 py-1.5 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-white hover:text-white'
              }
            >
              {y}
            </button>
          ))}
        </div>
      </PageMasthead>

      <section className='py-14 max-md:py-6'>
        <Container>
          <div className='grid grid-cols-[1fr_300px] gap-12 max-lg:grid-cols-1'>
            <div>
              {entry.note && (
                <p className='mb-10 border-l-4 border-ed-navy bg-ed-navy-tint px-5 py-4 text-[14px] leading-relaxed text-ed-ink-2'>
                  {entry.note}
                </p>
              )}

              {upcoming.length > 0 && (
                <div className='mb-10'>
                  <SectionHeader label='Upcoming' />
                  <div className='grid grid-cols-2 gap-4 max-sm:grid-cols-1'>
                    {upcoming.map(h => {
                      const p = holidayParts(h);
                      return (
                        <div
                          key={h.date + h.name}
                          className='border border-ed-rule bg-ed-paper-2 p-4'
                        >
                          <div className='mb-1.5'>
                            <TypeFlag type={h.type} />
                          </div>
                          <div className='font-serif-ed text-[17px] font-semibold leading-snug text-ed-ink'>
                            {h.name}
                          </div>
                          <div className='mt-1 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                            {p.month} {p.day} · {p.weekday}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <SectionHeader label={`Full calendar · ${year}`} />

              <div className='grid grid-cols-[100px_60px_60px_1fr_150px] border-b border-ed-rule pb-2 max-sm:hidden'>
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
                {byMonth.map(([month, list]) => (
                  <div key={month}>
                    {list.map((h, i) => {
                      const p = holidayParts(h);
                      return (
                        <div
                          key={h.date + h.name}
                          className='grid grid-cols-[100px_60px_60px_1fr_150px] items-baseline border-b border-ed-rule py-3 max-sm:grid-cols-1 max-sm:gap-0.5 max-sm:py-4'
                        >
                          <div className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-sm:hidden'>
                            {i === 0 ? month : ''}
                          </div>
                          <div className='font-serif-ed text-[17px] font-semibold text-ed-ink max-sm:hidden'>
                            {p.day}
                          </div>
                          <div className='text-[12px] text-ed-ink-3 max-sm:hidden'>
                            {p.weekday.slice(0, 3)}
                          </div>
                          <div>
                            <div className='font-serif-ed text-[16px] font-semibold leading-snug text-ed-ink max-sm:text-[15px]'>
                              {h.name}
                            </div>
                            <div className='mt-0.5 text-[12px] leading-snug text-ed-ink-3'>
                              {h.basis}
                              {h.note && ` · ${h.note}`}
                            </div>
                          </div>
                          <div className='max-sm:hidden'>
                            <TypeFlag type={h.type} />
                          </div>
                          <div className='font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3 sm:hidden'>
                            {p.month} {p.day} · {p.weekday.slice(0, 3)} ·{' '}
                            {HOLIDAY_TYPE_LABEL[h.type]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <aside className='max-lg:border-t max-lg:border-ed-rule max-lg:pt-8'>
              <div className='mb-8'>
                <SectionHeader label='Pay rules' />
                <div className='space-y-3'>
                  {(Object.keys(HOLIDAY_PAY) as HolidayType[]).map(type => (
                    <div key={type} className='flex items-start gap-3'>
                      <span className='w-[136px] shrink-0'>
                        <TypeFlag type={type} />
                      </span>
                      <p className='text-[12px] leading-normal text-ed-ink-2'>
                        {HOLIDAY_PAY[type]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='border border-ed-rule p-5'>
                <div className='mb-3 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                  Sources · {year}
                </div>
                <ul className='space-y-2.5 text-[12px] leading-normal text-ed-ink-2'>
                  {entry.sources.map(s => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target='_blank'
                        rel='noreferrer'
                        className='text-ed-navy underline decoration-ed-rule-strong underline-offset-2 hover:decoration-ed-navy'
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className='mt-4 text-[11px] text-ed-ink-3'>
                  Last checked {formatVerified(HOLIDAYS_VERIFIED_ON)}.
                </p>
              </div>

              <div className='mt-6 grid grid-cols-2 divide-x divide-ed-rule border border-ed-rule'>
                <div className='p-4'>
                  <div className='font-serif-ed text-[28px] font-semibold text-ed-ink'>
                    {count('regular')}
                  </div>
                  <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    Regular
                  </div>
                </div>
                <div className='p-4'>
                  <div className='font-serif-ed text-[28px] font-semibold text-ed-ink'>
                    {count('special-non-working')}
                  </div>
                  <div className='mt-0.5 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                    Special non-working
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
