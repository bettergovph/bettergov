// Mock/seed data for the v2 Home sections.
// TODO: replace with live data sources where available.

/**
 * `guide` is a guide id from src/data/guides/manifest.json; cards with one
 * open /guides/:id, the rest open the services directory.
 */
export const FEATURED_TRENDING = [
  {
    id: 'nbi',
    guide: 'nbi',
    agency: 'NBI',
    title: 'NBI Clearance',
    lede: 'Apply, renew, or reprint for employment, travel, or local use.',
    time: 'Same day',
    cost: '₱155',
  },
  {
    // No SSS registration guide yet.
    id: 'sss',
    agency: 'SSS',
    title: 'Register for an SSS Number',
    lede: 'Get your SSS number as employee, self-employed, or voluntary member.',
    time: '15 minutes',
    cost: 'Free',
  },
];

export const ALSO_TRENDING = [
  {
    agency: 'PhilHealth',
    title: 'Register with PhilHealth',
    guide: 'philhealth',
  },
  { agency: 'BIR', title: 'Apply for a TIN (Tax ID Number)', guide: 'tin' },
  {
    agency: 'LTO',
    title: "Driver's License — New or Renewal",
    guide: 'drivers',
  },
  { agency: 'DTI', title: 'Business Name Registration', guide: 'dti' },
  { agency: 'Pag-IBIG', title: 'Pag-IBIG Membership & MID', guide: 'pagibig' },
  { agency: 'PSA', title: 'PSA Birth Certificate', guide: 'psa' },
];

export const BUDGET_2026 = [
  { dept: 'Education', amount: 1089, pct: 17.1 },
  { dept: 'Public Works & Highways', amount: 822, pct: 12.9 },
  { dept: 'Health', amount: 316, pct: 5.0 },
  { dept: 'Interior & Local Govt', amount: 287, pct: 4.5 },
  { dept: 'National Defense', amount: 257, pct: 4.0 },
  { dept: 'Social Welfare', amount: 230, pct: 3.6 },
];

export const SUGGESTIONS = [
  'passport renewal',
  'NBI clearance',
  'SSS number',
  'BIR TIN',
  "driver's license",
];
