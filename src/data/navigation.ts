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
];

export const footerNavigation = {
  mainSections: [
    {
      title: 'Philippines',
      links: [
        { label: 'About the Philippines', href: '/philippines/about' },
        { label: 'History', href: '/philippines/history' },
        { label: 'Culture', href: '/philippines/culture' },
        { label: 'Regions', href: '/philippines/regions' },
        { label: 'Hotlines', href: '/philippines/hotlines' },
        { label: 'Holidays', href: '/philippines/holidays' },
      ],
    },
    {
      title: 'Services & Data',
      links: [
        { label: 'All Services', href: '/services' },
        { label: 'Service Websites', href: '/services/websites' },
        { label: 'Forex Rates', href: '/data/forex' },
        { label: 'Weather', href: '/data/weather' },
        { label: 'Travel & Visa', href: '/travel/visa' },
        { label: 'Flood Control Projects', href: '/flood-control-projects' },
      ],
    },
    {
      title: 'Government',
      links: [
        { label: 'Executive', href: '/government/executive' },
        { label: 'Departments', href: '/government/departments' },
        { label: 'Legislative', href: '/government/legislative' },
        { label: 'Local Government', href: '/government/local' },
        { label: 'Official Gov.ph', href: 'https://gov.ph' },
        { label: 'Open Data Portal', href: 'https://data.gov.ph' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About the Portal', href: '/about' },
        { label: 'Project Ideas', href: '/ideas' },
        { label: 'Accessibility', href: '/accessibility' },
        { label: 'Terms of Use', href: '/terms-of-service' },
        { label: 'Contact Us', href: '/about' },
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
