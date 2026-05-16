import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import salaryScheduleData from './salary-schedule.json';
import plantillaPositionsData from './plantilla-positions.json';

type SalaryRow = {
  grade: number;
  steps: Array<number | null>;
  average: number;
};

const plantilla: Record<number, string> = plantillaPositionsData;

const formatPeso = (amount: number | null) =>
  amount == null ? '—' : `₱${amount.toLocaleString('en-PH')}`;

const SalaryGradePage: FC = () => {
  const schedule = salaryScheduleData as SalaryRow[];
  const { highest, lowest } = useMemo(() => {
    const all = schedule.flatMap(s =>
      s.steps.filter((v): v is number => v != null)
    );
    return { highest: Math.max(...all), lowest: Math.min(...all) };
  }, [schedule]);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Government Salary Grades | BetterGov.ph</title>
        <meta
          name='description'
          content='The Philippine government salary grade schedule (SG 1–33, 8 steps) — based on DBM National Budget Circular 597, effective January 2025.'
        />
      </Helmet>

      <PageMasthead
        variant='hero'
        eyebrow='Government · Compensation'
        title={
          <>
            Salary grades{' '}
            <em className='italic font-normal'>one through thirty-three.</em>
          </>
        }
        lede='The standardized compensation schedule for civilian personnel of the Philippine government — 33 salary grades, each with 8 steps, as published by the Department of Budget and Management.'
      />

      {/* Stat strip */}
      <section className='border-b border-ed-rule bg-white py-10 max-md:py-8'>
        <Container>
          <div className='grid grid-cols-4 divide-x divide-ed-rule max-md:grid-cols-2 max-md:divide-x-0 max-md:divide-y'>
            <Stat label='Highest salary' value={formatPeso(highest)} />
            <Stat label='Lowest salary' value={formatPeso(lowest)} />
            <Stat label='Salary grades' value='1 – 33' />
            <Stat label='Steps per grade' value='1 – 8' />
          </div>
        </Container>
      </section>

      {/* Intro */}
      <section className='py-10'>
        <Container>
          <div className='max-w-3xl border-l-[3px] border-ed-navy pl-6'>
            <Eyebrow>About the system</Eyebrow>
            <p className='mt-3 font-serif-ed text-[17px] leading-relaxed text-ed-ink-2'>
              The Philippine government uses a standardized salary grade system
              (SG 1–33) to determine compensation for civilian employees. Each
              grade has eight steps — step 1 is entry, step 8 is the ceiling
              within that grade. Figures below are gross monthly pay, before tax
              and before location, hazard, or representation allowances.
            </p>
            <p className='mt-3 text-sm text-ed-ink-3'>
              Source: Department of Budget and Management, National Budget
              Circular No. 597, Annex A — Second Tranche Monthly Salary Schedule
              for Civilian Personnel (effective January 1, 2025).{' '}
              <a
                href='https://www.dbm.gov.ph/wp-content/uploads/Issuances/2025/National-Budget-Circular/NBC-No.-597.pdf'
                target='_blank'
                rel='noreferrer'
                className='border-b border-ed-navy pb-0.5 text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
              >
                dbm.gov.ph — NBC No. 597 (2025)
              </a>
            </p>
          </div>
        </Container>
      </section>

      {/* Table */}
      <section className='pb-14 max-md:pb-8'>
        <Container>
          <SectionHeader
            label='Monthly salary schedule'
            meta={`SG 1–33 · 8 steps`}
          />
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse font-sans-ed text-sm'>
              <thead>
                <tr>
                  <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                    SG
                  </th>
                  <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                    Position (examples)
                  </th>
                  <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-right font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                    Average
                  </th>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <th
                      key={i}
                      className='border-y border-ed-ink bg-ed-paper-2 px-3 py-3 text-right font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'
                    >
                      Step {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => (
                  <tr
                    key={row.grade}
                    className='border-b border-ed-rule transition-colors hover:bg-ed-paper-2/60'
                  >
                    <td className='px-4 py-3 font-mono-ed text-[13px] font-medium text-ed-ink'>
                      SG {row.grade}
                    </td>
                    <td className='px-4 py-3 text-[13px] text-ed-ink-2'>
                      {plantilla[row.grade] ?? '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono-ed text-[13px] font-medium text-ed-navy-ink'>
                      {formatPeso(row.average)}
                    </td>
                    {row.steps.map((v, i) => (
                      <td
                        key={i}
                        className='px-3 py-3 text-right font-mono-ed text-[13px] text-ed-ink'
                      >
                        {formatPeso(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </main>
  );
};

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className='px-6 py-2 text-ed-ink-2'>
    <div className='font-serif-ed text-[28px] font-medium leading-none text-ed-navy-ink'>
      {value}
    </div>
    <div className='mt-2 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
      {label}
    </div>
  </div>
);

export default SalaryGradePage;
