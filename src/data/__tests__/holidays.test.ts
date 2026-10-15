import { describe, it, expect } from 'vitest';
import {
  HOLIDAY_YEARS,
  holidayParts,
  holidaysInYear,
  manilaToday,
  upcomingHolidays,
} from '../holidays';

/** Gregorian Easter Sunday (anonymous Gregorian algorithm), as YYYY-MM-DD. */
function easter(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const shift = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 864e5)
    .toISOString()
    .slice(0, 10);

const find = (year: number, name: string) =>
  HOLIDAY_YEARS.find(y => y.year === year)!.holidays.find(h => h.name === name)
    ?.date;

describe('holiday data', () => {
  it.each(HOLIDAY_YEARS)('$year lists valid dates in order', y => {
    const dates = y.holidays.map(h => h.date);
    expect([...dates].sort()).toEqual(dates);
    for (const d of dates) {
      expect(d.startsWith(`${y.year}-`)).toBe(true);
      expect(Number.isNaN(Date.parse(d))).toBe(false);
    }
    expect(y.sources.length).toBeGreaterThan(0);
  });

  it.each(HOLIDAY_YEARS)('$year Holy Week matches Easter', ({ year }) => {
    const e = easter(year);
    expect(find(year, 'Maundy Thursday')).toBe(shift(e, -3));
    expect(find(year, 'Good Friday')).toBe(shift(e, -2));
    expect(find(year, 'Black Saturday')).toBe(shift(e, -1));
  });

  it.each(HOLIDAY_YEARS)(
    '$year National Heroes Day is the last Monday of August',
    ({ year }) => {
      const date = find(year, 'National Heroes Day')!;
      expect(holidayParts({ date }).weekday).toBe('Monday');
      expect(Number(date.slice(8))).toBeGreaterThan(24);
    }
  );

  it('matches the weekdays printed in the 2026 Eid proclamations', () => {
    expect(
      holidayParts({ date: find(2026, "Eid'l Fitr (Feast of Ramadhan)")! })
        .weekday
    ).toBe('Friday');
    expect(
      holidayParts({ date: find(2026, "Eid'l Adha (Feast of Sacrifice)")! })
        .weekday
    ).toBe('Wednesday');
  });
});

describe('holiday helpers', () => {
  it('reads today in Manila, not UTC', () => {
    // 20:00 UTC on 31 Dec is already 1 Jan in Manila (UTC+8).
    expect(manilaToday(new Date('2026-12-31T20:00:00Z'))).toBe('2027-01-01');
  });

  it('lists upcoming days off across the year boundary and skips working days', () => {
    const next = upcomingHolidays('2026-12-30', 3).map(h => h.date);
    expect(next).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(upcomingHolidays('2027-02-20', 1).map(h => h.name)).not.toContain(
      'EDSA People Power Revolution Anniversary (41st)'
    );
  });

  it('counts only days off', () => {
    expect(holidaysInYear(2026).every(h => h.type !== 'special-working')).toBe(
      true
    );
  });
});
