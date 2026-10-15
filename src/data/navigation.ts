import { NavigationItem } from '../types';
import { serviceCategories, type Category } from './cms';

export const mainNavigation: NavigationItem[] = [
  {
    label: 'Philippines',
    href: '/philippines',
    children: [
      {
        label: 'About the Philippines',
        href: '/philippines/about',
        blurb: 'The Republic of the Philippines at a glance.',
      },
      {
        label: 'History',
        href: '/philippines/history',
        blurb: 'From pre-colonial peoples to the modern republic.',
      },
      {
        label: 'Culture',
        href: '/philippines/culture',
        blurb: 'Languages, festivals, food, faith, and craft.',
      },
      {
        label: 'Regions',
        href: '/philippines/regions',
        blurb: '17 administrative regions across three island groups.',
      },
      {
        label: 'Map',
        href: '/philippines/map',
        blurb: 'Interactive atlas of the archipelago.',
      },
      {
        label: 'Hotlines',
        href: '/philippines/hotlines',
        blurb: 'Emergency and government hotline numbers.',
      },
      {
        label: 'Holidays',
        href: '/philippines/holidays',
        blurb: 'Regular and special non-working days.',
      },
      {
        label: 'Forex',
        href: '/data/forex',
        blurb: 'Daily peso exchange rates from BSP.',
      },
      {
        label: 'Weather',
        href: '/data/weather',
        blurb: 'Live conditions from PAGASA.',
      },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: (serviceCategories.categories as Category[]).map(category => ({
      label: category.category,
      href: `/services?category=${category.slug}`,
    })),
  },
  {
    label: 'News',
    href: '/news',
    children: [
      {
        label: 'All News',
        href: '/news',
        blurb: 'Latest announcements from across the government.',
      },
      {
        label: 'Press Releases',
        href: '/news?category=press-release',
        blurb: 'Statements from the Presidential Communications Office.',
      },
      {
        label: 'Circulars',
        href: '/news?category=circular',
        blurb: 'Memorandum circulars and proclamations.',
      },
    ],
  },
  {
    label: 'Guides',
    href: '/guides',
  },
  {
    label: 'Travel',
    href: '/travel',
    children: [
      {
        label: 'Visa Information',
        href: '/travel/visa',
        blurb: 'Entry requirements and categories.',
      },
      {
        label: 'Visa Types',
        href: '/travel/visa-types',
        blurb: 'Tourist, work, student, and more.',
      },
      {
        label: 'Working in the Philippines',
        href: '/travel/visa-types/swp-c',
        blurb: 'Special Work Permits and employment visas.',
      },
      {
        label: 'Communicating',
        href: '/travel/communicating',
        blurb: 'Languages, phrases, and local etiquette.',
      },
    ],
  },
  {
    label: 'Directory',
    href: '/government',
    children: [
      {
        label: 'Government at a glance',
        href: '/government/overview',
        blurb: 'How the three branches and local government are organized.',
      },
      {
        label: 'Departments',
        href: '/government/departments',
        blurb: 'All national executive departments.',
      },
      {
        label: 'Senate of the Philippines',
        href: '/government/legislative/senate-of-the-philippines-20th-congress',
        blurb: '24 senators elected at-large.',
      },
      {
        label: 'House of Representatives',
        href: '/government/legislative/house-of-representatives-20th-congress',
        blurb: 'District and party-list members of the lower house.',
      },
    ],
  },
  {
    label: 'Transparency',
    // No landing page of its own, so the menu has no "overview" link.
    href: '',
    children: [
      {
        label: 'Budget Transparency',
        href: 'https://compass.dbm.gov.ph',
        target: '_blank',
        blurb: 'DBM Compass — national budget allocations and releases.',
      },
      {
        label: 'DPWH Transparency',
        href: 'https://transparency.dpwh.gov.ph',
        target: '_blank',
        blurb: 'Infrastructure projects, contracts, and status.',
      },
      {
        label: 'Freedom of Information',
        href: 'https://www.foi.gov.ph',
        target: '_blank',
        blurb: 'Request records from any national government agency.',
      },
    ],
  },
];
