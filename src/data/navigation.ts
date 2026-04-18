import { NavigationItem } from '../types';
import serviceCategories from './service_categories.json';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

export const ourProjects = [
  {
    label: 'Our Projects',
    href: '#',
    children: [
      {
        label: '2026 Budget Tracker',
        href: 'https://2026-budget.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Budget Tracker',
        href: 'https://budget.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Transparency Portal',
        href: 'https://transparency.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Open Data Portal',
        href: 'https://data.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Bantay PH',
        href: 'https://bantay.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Petitions',
        href: 'https://petition.ph',
        target: '_blank',
      },
      {
        label: 'Tax Directory',
        href: 'https://taxdirectory.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Philgeps',
        href: 'https://philgeps.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'SALN Tracker',
        href: 'https://saln.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Hotlines',
        href: 'https://hotlines.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Open Bayan',
        href: 'https://www.openbayan.org',
        target: '_blank',
      },
      {
        label: 'Open Congress API',
        href: 'https://open-congress-api.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'OpenGov Blockchain',
        href: 'https://govchain.bettergov.ph',
        target: '_blank',
      },
      {
        label: 'Research & Visualizations',
        href: 'https://visualizations.bettergov.ph/',
        target: '_blank',
      },
    ],
  },
];

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
    label: 'Flood Control Projects',
    href: '/flood-control-projects',
    children: [
      {
        label: 'Charts',
        href: '/flood-control-projects',
        blurb: 'Overview of spending and completion trends.',
      },
      {
        label: 'Table',
        href: '/flood-control-projects/table',
        blurb: 'Searchable project-by-project records.',
      },
      {
        label: 'Map',
        href: '/flood-control-projects/map',
        blurb: 'Geospatial view of all projects.',
      },
      {
        label: 'Contractors',
        href: '/flood-control-projects/contractors',
        blurb: 'Company profiles and award history.',
      },
    ],
  },
  ...ourProjects,
];

export const footerNavigation = {
  mainSections: [
    {
      title: 'About',
      links: [
        { label: 'About the Portal', href: '/about' },
        { label: 'About BetterGov.ph', href: 'https://about.bettergov.ph' },
        { label: 'Documentation', href: 'https://docs.bettergov.ph/' },
        { label: 'Project Ideas', href: '/ideas' },
        { label: 'Accessibility', href: '/accessibility' },
        { label: 'Terms of Use', href: '/terms-of-service' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All Services', href: '/services' },
        { label: 'Service Directory', href: '/services' },
        { label: 'Websites', href: '/services/websites' },
        { label: 'Forex', href: '/data/forex' },
        { label: 'Weather', href: '/data/weather' },
        { label: 'Hotlines', href: '/philippines/hotlines' },
        { label: 'Holidays', href: '/philippines/holidays' },
        { label: 'Flood Control Projects', href: '/flood-control-projects' },
      ],
    },
    {
      title: 'Our Projects',
      links: ourProjects[0].children,
    },
    {
      title: 'Government',
      links: [
        { label: 'Official Gov.ph', href: 'https://www.gov.ph' },
        { label: 'Open Data', href: 'https://data.gov.ph' },
        { label: 'Freedom of Information', href: 'https://www.foi.gov.ph' },
        {
          label: 'Contact Center',
          href: 'https://contactcenterngbayan.gov.ph',
        },
        {
          label: 'Official Gazette',
          href: 'https://www.officialgazette.gov.ph',
        },
      ],
    },
  ],
  socialLinks: [
    { label: 'Facebook', href: 'https://facebook.com/bettergovph' },
    { label: 'Discord', href: '/discord' },
    // { label: 'Instagram', href: 'https://instagram.com/govph' },
    // { label: 'YouTube', href: 'https://youtube.com/govph' },
  ],
};
