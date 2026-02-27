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
      { label: 'About the Philippines', href: '/philippines/about' },
      { label: 'History', href: '/philippines/history' },
      { label: 'Culture', href: '/philippines/culture' },
      { label: 'Regions', href: '/philippines/regions' },
      { label: 'Map', href: '/philippines/map' },
      // { label: 'Tourism', href: '/philippines/tourism' },
      { label: 'Hotlines', href: '/philippines/hotlines' },
      { label: 'Holidays', href: '/philippines/holidays' },
      { label: 'Forex', href: '/data/forex' },
      { label: 'Weather', href: '/data/weather' },
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
    label: 'Travel',
    href: '/travel',
    children: [
      { label: 'Visa Information', href: '/travel/visa' },
      { label: 'Visa Types', href: '/travel/visa-types' },
      { label: 'Working in the Philippines', href: '/travel/visa-types/swp-c' },
      { label: 'Communicating', href: '/travel/communicating' },
      // { label: 'Tourist Destinations', href: '/travel/destinations' },
    ],
  },
  {
    label: 'Government',
    href: '/government',
    children: [
      { label: 'Executive', href: '/government/executive' },
      { label: 'Departments', href: '/government/departments' },
      { label: 'Constitutional', href: '/government/constitutional' },
      { label: 'Legislative', href: '/government/legislative' },
      { label: 'Local Government', href: '/government/local' },
      { label: 'Diplomatic', href: '/government/diplomatic' },
      { label: 'Salary Grades', href: '/government/salary-grade' },
    ],
  },
  {
    label: 'Flood Control Projects',
    href: '/flood-control-projects',
    children: [
      { label: 'Charts', href: '/flood-control-projects' },
      { label: 'Table', href: '/flood-control-projects/table' },
      { label: 'Map', href: '/flood-control-projects/map' },
      { label: 'Contractors', href: '/flood-control-projects/contractors' },
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
