// Mock/seed data for the v2 Home sections.
// TODO: replace with live data sources where available.

export const FEATURED_TRENDING = [
  {
    id: 'nbi',
    agency: 'NBI',
    title: 'NBI Clearance',
    lede: 'Apply, renew, or reprint for employment, travel, or local use.',
    time: 'Same day',
    cost: '₱155',
  },
  {
    id: 'sss',
    agency: 'SSS',
    title: 'Register for an SSS Number',
    lede: 'Get your SSS number as employee, self-employed, or voluntary member.',
    time: '15 minutes',
    cost: 'Free',
  },
];

export const ALSO_TRENDING = [
  { agency: 'PhilHealth', title: 'Register with PhilHealth' },
  { agency: 'BIR', title: 'Apply for a TIN (Tax ID Number)' },
  { agency: 'LTO', title: "Driver's License — New or Renewal" },
  { agency: 'DTI', title: 'Business Name Registration' },
  { agency: 'Pag-IBIG', title: 'Pag-IBIG Membership & MID' },
  { agency: 'PSA', title: 'PSA Birth Certificate' },
];

export const NEWS_ITEMS = [
  {
    cat: 'Policy',
    date: 'April 17, 2026',
    read: '6 min',
    title:
      'SIM Registration extension lapses — DICT says 98% of numbers now verified',
    excerpt:
      'The Department of Information and Communications Technology announced the close of a two-year grace period, with total active registrations surpassing 168 million.',
  },
  {
    cat: 'Advisory',
    date: 'April 16, 2026',
    title:
      'PAGASA raises Signal No. 2 over Eastern Visayas as Tropical Storm Egay approaches',
    excerpt:
      'Classes suspended in six provinces. NDRRMC pre-positions relief goods in three regional hubs.',
  },
  {
    cat: 'Services',
    date: 'April 15, 2026',
    title: 'DFA opens 14 new consular satellite offices in provincial SM malls',
    excerpt:
      'Passport renewals now possible without traveling to the regional capital in 9 additional provinces.',
  },
  {
    cat: 'Transparency',
    date: 'April 14, 2026',
    title:
      '2026 General Appropriations Act: where the ₱6.35-trillion budget goes',
    excerpt:
      'A breakdown of the national budget by department, region, and program — with open data downloads.',
  },
  {
    cat: 'Digital',
    date: 'April 12, 2026',
    title:
      'eGovPH super-app crosses 30M downloads as PhilSys integration goes live',
    excerpt: 'The national ID can now sign into 47 government services.',
  },
];

export const HOLIDAYS_2026 = [
  { date: 'Apr 18', day: 'Sat', name: "Eid'l Fitr", type: 'Regular' },
  { date: 'May 01', day: 'Fri', name: 'Labor Day', type: 'Regular' },
  { date: 'Jun 12', day: 'Fri', name: 'Independence Day', type: 'Regular' },
  { date: 'Jul 27', day: 'Mon', name: "Eid'l Adha", type: 'Regular' },
  { date: 'Aug 21', day: 'Fri', name: 'Ninoy Aquino Day', type: 'Special' },
];

export const BUDGET_2026 = [
  { dept: 'Education', amount: 1089, pct: 17.1 },
  { dept: 'Public Works & Highways', amount: 822, pct: 12.9 },
  { dept: 'Health', amount: 316, pct: 5.0 },
  { dept: 'Interior & Local Govt', amount: 287, pct: 4.5 },
  { dept: 'National Defense', amount: 257, pct: 4.0 },
  { dept: 'Social Welfare', amount: 230, pct: 3.6 },
];

export const HOTLINES = [
  { label: 'Emergency / Police / Fire', number: '911', accent: true as const },
  { label: 'NDRRMC', number: '(02) 8911-1406' },
  { label: 'DOH Information', number: '1555' },
  { label: 'SSS Call Center', number: '1455' },
  { label: 'Red Cross', number: '143' },
];

export const SUGGESTIONS = [
  'passport renewal',
  'NBI clearance',
  'SSS number',
  'BIR TIN',
  "driver's license",
];
