import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import Container from '../../components/v2/ui/Container';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import { GUIDES, guideHref } from '../guides/data';

interface RouteRow {
  title: string;
  path: string;
}

interface SitemapGroup {
  num: string;
  label: string;
  routes: RouteRow[];
}

const groups: SitemapGroup[] = [
  {
    num: '00',
    label: 'Guides',
    routes: [
      { title: 'All guides', path: '/guides' },
      ...GUIDES.map(guide => ({ title: guide.title, path: guideHref(guide) })),
    ],
  },
  {
    num: '01',
    label: 'Main',
    routes: [
      { title: 'Home', path: '/' },
      { title: 'About', path: '/about' },
      { title: 'Search', path: '/search' },
      { title: 'Directory', path: '/directory' },
    ],
  },
  {
    num: '02',
    label: 'Philippines',
    routes: [
      { title: 'About the Philippines', path: '/philippines/about' },
      { title: 'History', path: '/philippines/history' },
      { title: 'Culture', path: '/philippines/culture' },
      { title: 'Regions', path: '/philippines/regions' },
      { title: 'Map', path: '/philippines/map' },
      { title: 'Public Holidays', path: '/philippines/holidays' },
      { title: 'Hotlines', path: '/philippines/hotlines' },
    ],
  },
  {
    num: '03',
    label: 'Government',
    routes: [
      { title: 'Government at a Glance', path: '/government/overview' },
      { title: 'Executive Branch', path: '/government/executive' },
      {
        title: 'Office of the President',
        path: '/government/executive/office-of-the-president',
      },
      {
        title: 'Office of the Vice President',
        path: '/government/executive/office-of-the-vice-president',
      },
      { title: 'Departments', path: '/government/departments' },
      { title: 'Constitutional Bodies', path: '/government/constitutional' },
      { title: 'GOCCs', path: '/government/constitutional/goccs' },
      { title: 'SUCs', path: '/government/constitutional/sucs' },
      { title: 'Legislative Branch', path: '/government/legislative' },
      {
        title: 'Senate Committees',
        path: '/government/legislative/senate-committees',
      },
      { title: 'House Members', path: '/government/legislative/house-members' },
      { title: 'Diplomatic Missions', path: '/government/diplomatic/missions' },
      { title: 'Consulates', path: '/government/diplomatic/consulates' },
      { title: 'Local Government', path: '/government/local' },
    ],
  },
  {
    num: '04',
    label: 'Services',
    routes: [
      { title: 'All Services', path: '/services' },
      { title: 'Government Websites Directory', path: '/services/websites' },
      { title: 'Business & Trade', path: '/services?category=business-trade' },
      {
        title: 'Certificates & IDs',
        path: '/services?category=certificates-ids',
      },
      { title: 'Contributions', path: '/services?category=contributions' },
      {
        title: 'Disaster & Weather',
        path: '/services?category=disaster-weather',
      },
      { title: 'Education', path: '/services?category=education' },
      { title: 'Employment', path: '/services?category=employment' },
      { title: 'Health', path: '/services?category=health' },
      { title: 'Housing', path: '/services?category=housing' },
      {
        title: 'Passport & Travel',
        path: '/services?category=passport-travel',
      },
      { title: 'Social Services', path: '/services?category=social-services' },
      { title: 'Tax', path: '/services?category=tax' },
      {
        title: 'Transport & Driving',
        path: '/services?category=transport-driving',
      },
    ],
  },
  {
    num: '05',
    label: 'Travel',
    routes: [
      { title: 'Visa Information', path: '/travel/visa' },
      { title: 'Visa Types', path: '/travel/visa-types' },
      { title: 'Special Work Permit', path: '/travel/visa-types/swp-c' },
    ],
  },
  {
    num: '06',
    label: 'Data',
    routes: [
      { title: 'Weather', path: '/data/weather' },
      { title: 'Foreign Exchange Rates', path: '/data/forex' },
    ],
  },
  {
    num: '07',
    label: 'Infrastructure',
    routes: [
      { title: 'Flood Control Projects', path: '/flood-control-projects' },
      { title: 'Projects — Table View', path: '/flood-control-projects/table' },
      { title: 'Projects — Map View', path: '/flood-control-projects/map' },
      {
        title: 'Contractors Directory',
        path: '/flood-control-projects/contractors',
      },
    ],
  },
  {
    num: '08',
    label: 'Legal',
    routes: [
      { title: 'Accessibility Statement', path: '/accessibility' },
      { title: 'Terms of Service', path: '/terms-of-service' },
      { title: 'Sitemap', path: '/sitemap' },
    ],
  },
];

const SitemapPage: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Sitemap | GOV.PH</title>
      <meta
        name='description'
        content='Complete sitemap of GOV.PH — find all pages and services on the Philippine Government Portal.'
      />
      <link rel='canonical' href='https://www.gov.ph/sitemap' />
    </Helmet>

    <PageMasthead
      title='Sitemap'
      lede='A complete index of all pages and services on GOV.PH.'
    />

    <section className='py-12 max-md:py-6'>
      <Container narrow>
        {groups.map(({ num, label, routes }) => (
          <div key={num} className='mb-12'>
            <SectionHeader
              num={num}
              label={label}
              meta={`${routes.length} pages`}
            />
            <div className='divide-y divide-ed-rule'>
              {routes.map(({ title, path }) => (
                <Link
                  key={path}
                  to={path}
                  className='flex items-center justify-between py-3 text-sm text-ed-ink-2 hover:text-ed-navy transition-colors group'
                >
                  <span className='group-hover:underline underline-offset-2'>
                    {title}
                  </span>
                  <span className='font-mono-ed text-[11px] text-ed-ink-4 group-hover:text-ed-navy'>
                    {path}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </section>
  </main>
);

export default SitemapPage;
