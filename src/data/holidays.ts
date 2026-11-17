/**
 * National holidays as proclaimed by Malacañang, one explicit list per year.
 * Moveable dates (Holy Week, Chinese New Year, National Heroes Day, both
 * Eids) differ every year, so nothing here is derived from a template.
 * Sources are the annual proclamation plus any later proclamation that sets
 * or adds a nationwide day; local declarations are left out. Commemorative
 * "special working holidays" created by statute alone are left out too:
 * they are not in the proclamations and give no day off.
 */

export type HolidayType = 'regular' | 'special-non-working' | 'special-working';

export type Holiday = {
  /** YYYY-MM-DD */
  date: string;
  name: string;
  type: HolidayType;
  /** The proclamation or law that sets this date. */
  basis: string;
  note?: string;
};

export type HolidayYear = {
  year: number;
  /** Shown above the calendar, e.g. dates still to be proclaimed. */
  note?: string;
  holidays: Holiday[];
  sources: { label: string; url: string }[];
};

export const HOLIDAYS_VERIFIED_ON = '2026-10-15';

export const HOLIDAY_YEARS: HolidayYear[] = [
  {
    year: 2025,
    holidays: [
      {
        date: '2025-01-01',
        name: "New Year's Day",
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-01-29',
        name: 'Chinese New Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-02-25',
        name: 'EDSA People Power Revolution Anniversary (39th)',
        type: 'special-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-04-01',
        name: "Eid'l Fitr (Feast of Ramadhan)",
        type: 'regular',
        basis: 'Proclamation No. 839, s. 2025',
      },
      {
        date: '2025-04-09',
        name: 'Araw ng Kagitingan',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-04-17',
        name: 'Maundy Thursday',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-04-18',
        name: 'Good Friday',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-04-19',
        name: 'Black Saturday',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-05-01',
        name: 'Labor Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-05-12',
        name: '2025 National and Local Elections',
        type: 'special-non-working',
        basis: 'Proclamation No. 878, s. 2025',
      },
      {
        date: '2025-06-06',
        name: "Eid'l Adha (Feast of Sacrifice)",
        type: 'regular',
        basis: 'Proclamation No. 911, s. 2025',
      },
      {
        date: '2025-06-12',
        name: 'Independence Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-07-27',
        name: 'Iglesia ni Cristo Founding Anniversary',
        type: 'special-non-working',
        basis: 'Proclamation No. 729, s. 2024',
      },
      {
        date: '2025-08-21',
        name: 'Ninoy Aquino Day',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-08-25',
        name: 'National Heroes Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-10-31',
        name: "All Saints' Day Eve",
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-11-01',
        name: "All Saints' Day",
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-11-30',
        name: 'Bonifacio Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-12-08',
        name: 'Feast of the Immaculate Conception of Mary',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-12-24',
        name: 'Christmas Eve',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-12-25',
        name: 'Christmas Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-12-30',
        name: 'Rizal Day',
        type: 'regular',
        basis: 'Proclamation No. 727, s. 2024',
      },
      {
        date: '2025-12-31',
        name: 'Last Day of the Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 727, s. 2024',
      },
    ],
    sources: [
      {
        label: 'Proclamation No. 727, s. 2024 — holidays for 2025',
        url: 'https://lawphil.net/executive/proc/proc2024/proc_727_2024.html',
      },
      {
        label: 'Proclamation No. 729, s. 2024 — Iglesia ni Cristo anniversary',
        url: 'https://lawphil.net/executive/proc/proc2024/proc_729_2024.html',
      },
      {
        label: "Proclamation No. 839, s. 2025 — Eid'l Fitr",
        url: 'https://lawphil.net/executive/proc/proc2025/proc_839_2025.html',
      },
      {
        label: 'Proclamation No. 878, s. 2025 — Election Day (GMA News)',
        url: 'https://www.gmanetwork.com/news/topstories/nation/945111/may-12-election-day-is-a-holiday-palace/story/',
      },
      {
        label: "Proclamation No. 911, s. 2025 — Eid'l Adha",
        url: 'https://lawphil.net/executive/proc/proc2025/proc_911_2025.html',
      },
    ],
  },
  {
    year: 2026,
    holidays: [
      {
        date: '2026-01-01',
        name: "New Year's Day",
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-02-17',
        name: 'Chinese New Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-02-25',
        name: 'EDSA People Power Revolution Anniversary (40th)',
        type: 'special-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-03-20',
        name: "Eid'l Fitr (Feast of Ramadhan)",
        type: 'regular',
        basis: 'Proclamation No. 1189, s. 2026',
      },
      {
        date: '2026-04-02',
        name: 'Maundy Thursday',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-04-03',
        name: 'Good Friday',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-04-04',
        name: 'Black Saturday',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-04-09',
        name: 'Araw ng Kagitingan',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-05-01',
        name: 'Labor Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-05-27',
        name: "Eid'l Adha (Feast of Sacrifice)",
        type: 'regular',
        basis: 'Proclamation No. 1264, s. 2026',
      },
      {
        date: '2026-06-12',
        name: 'Independence Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-08-21',
        name: 'Ninoy Aquino Day',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-08-31',
        name: 'National Heroes Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-11-01',
        name: "All Saints' Day",
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-11-02',
        name: "All Souls' Day",
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-11-30',
        name: 'Bonifacio Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-12-08',
        name: 'Feast of the Immaculate Conception of Mary',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-12-24',
        name: 'Christmas Eve',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-12-25',
        name: 'Christmas Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-12-30',
        name: 'Rizal Day',
        type: 'regular',
        basis: 'Proclamation No. 1006, s. 2025',
      },
      {
        date: '2026-12-31',
        name: 'Last Day of the Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 1006, s. 2025',
      },
    ],
    sources: [
      {
        label: 'Proclamation No. 1006, s. 2025 — holidays for 2026',
        url: 'https://lawphil.net/executive/proc/proc2025/proc_1006_2025.html',
      },
      {
        label: "Proclamation No. 1189, s. 2026 — Eid'l Fitr",
        url: 'https://lawphil.net/executive/proc/proc2026/proc_1189_2026.html',
      },
      {
        label: "Proclamation No. 1264, s. 2026 — Eid'l Adha",
        url: 'https://lawphil.net/executive/proc/proc2026/proc_1264_2026.html',
      },
    ],
  },
  {
    year: 2027,
    note: "Eid'l Fitr and Eid'l Adha are regular holidays, but their 2027 dates have not been proclaimed yet. Malacañang sets them each year on the advice of the National Commission on Muslim Filipinos.",
    holidays: [
      {
        date: '2027-01-01',
        name: "New Year's Day",
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-02-06',
        name: 'Chinese New Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-02-25',
        name: 'EDSA People Power Revolution Anniversary (41st)',
        type: 'special-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-03-25',
        name: 'Maundy Thursday',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-03-26',
        name: 'Good Friday',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-03-27',
        name: 'Black Saturday',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-04-09',
        name: 'Araw ng Kagitingan',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-05-01',
        name: 'Labor Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-06-12',
        name: 'Independence Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-08-21',
        name: 'Ninoy Aquino Day',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-08-30',
        name: 'National Heroes Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-11-01',
        name: "All Saints' Day",
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-11-02',
        name: "All Souls' Day",
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-11-30',
        name: 'Bonifacio Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-12-08',
        name: 'Feast of the Immaculate Conception of Mary',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-12-24',
        name: 'Christmas Eve',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-12-25',
        name: 'Christmas Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-12-30',
        name: 'Rizal Day',
        type: 'regular',
        basis: 'Proclamation No. 1427, s. 2026',
      },
      {
        date: '2027-12-31',
        name: 'Last Day of the Year',
        type: 'special-non-working',
        basis: 'Proclamation No. 1427, s. 2026',
      },
    ],
    sources: [
      {
        label: 'Proclamation No. 1427, s. 2026 — holidays for 2027',
        url: 'https://lawphil.net/executive/proc/proc2026/proc_1427_2026.html',
      },
      {
        label:
          'DOLE Labor Advisory No. 17, s. 2026 — 2027 holiday pay (GMA News)',
        url: 'https://www.gmanetwork.com/news/money/economy/1004230/dole-releases-2027-holiday-pay-rules/story/',
      },
    ],
  },
];

/** DOLE pay rules, unchanged across the 2025, 2026 and 2027 labor advisories. */
export const HOLIDAY_PAY: Record<HolidayType, string> = {
  regular:
    'Paid even if unworked (100% of the daily wage). If worked, 200% for the first eight hours.',
  'special-non-working':
    'No work, no pay, unless company policy or a CBA says otherwise. If worked, 130% for the first eight hours.',
  'special-working':
    'An ordinary working day: regular pay, with no holiday premium.',
};

const MONTHS = [
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

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  regular: 'Regular',
  'special-non-working': 'Special',
  'special-working': 'Special working',
};

/** Today's date in Manila as YYYY-MM-DD, whatever the visitor's time zone. */
export function manilaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Calendar parts of a holiday's date, computed in UTC so no zone can shift the day. */
export function holidayParts(h: Pick<Holiday, 'date'>) {
  const [y, m, d] = h.date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return {
    year: y,
    month: MONTHS[m - 1],
    day: d,
    weekday,
    /** e.g. "Nov 01" */
    short: `${MONTHS[m - 1].slice(0, 3)} ${String(d).padStart(2, '0')}`,
  };
}

/** Special working days are ordinary workdays; everything else is a day off. */
export const isDayOff = (h: Pick<Holiday, 'type'>) =>
  h.type !== 'special-working';

/** Days off (regular and special non-working) in a year. */
export const holidaysInYear = (year: number): Holiday[] =>
  (HOLIDAY_YEARS.find(y => y.year === year)?.holidays ?? []).filter(isDayOff);

/** The next `count` days off on or after `fromIso` (YYYY-MM-DD), across years. */
export const upcomingHolidays = (fromIso: string, count: number): Holiday[] =>
  HOLIDAY_YEARS.flatMap(y => y.holidays)
    .filter(h => isDayOff(h) && h.date >= fromIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
