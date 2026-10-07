import { FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import versionData from '../../../version.json';
import Container from '../ui/Container';
import Flag from '../ui/Flag';
import FooterColumn, { FooterLink } from './FooterColumn';
import {
  BAGONG_PILIPINAS_ALT,
  BAGONG_PILIPINAS_SRC,
  COAT_OF_ARMS_ALT,
  COAT_OF_ARMS_SRC,
  ISSUES_URL,
  REPO_URL,
  SITE_NAME,
  SITE_OWNER,
} from '../../../lib/brand';

type Version = { head_commit: string };

const Footer: FC = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = versionData as Version;
      if (v?.head_commit) setVersion(v.head_commit.substring(0, 6));
    } catch (err) {
      console.error('Error loading version.json:', err);
    }
  }, []);

  if (pathname === '/philippines/map') return null;

  const servicesCol: FooterLink[] = [
    {
      label: t('footerNav.passportTravel', 'Passport & Travel'),
      href: '/travel/visa',
    },
    {
      label: t('footerNav.taxesBir', 'Taxes & BIR'),
      href: '/services?category=revenue-taxation',
    },
    {
      label: t('footerNav.healthPhilhealth', 'Health & PhilHealth'),
      href: '/services?category=health',
    },
    {
      label: t('footerNav.socialSecurity', 'Social Security'),
      href: '/services?category=social-services',
    },
    {
      label: t('footerNav.education', 'Education'),
      href: '/services?category=education',
    },
    {
      label: t('footerNav.business', 'Business'),
      href: '/services?category=business-trade',
    },
  ];

  const governmentCol: FooterLink[] = [
    {
      label: t('footerNav.governmentOverview', 'Government at a Glance'),
      href: '/government/overview',
    },
    {
      label: t('footerNav.allAgencies', 'All Agencies'),
      href: '/government/departments',
    },
    {
      label: t('footerNav.executive', 'Executive'),
      href: '/government/executive',
    },
    {
      label: t('footerNav.legislative', 'Legislative'),
      href: '/government/legislative',
    },
    {
      label: t('footerNav.judicial', 'Judicial'),
      href: '/government/constitutional',
    },
    {
      label: t('footerNav.constitutional', 'Constitutional'),
      href: '/government/constitutional',
    },
    {
      label: t('footerNav.lguDirectory', 'LGU Directory'),
      href: '/government/local',
    },
  ];

  const resourcesCol: FooterLink[] = [
    {
      label: t('footerNav.floodControl', 'Flood Control'),
      href: '/flood-control-projects',
    },
    {
      label: t('footerNav.dataTransparency', 'Data & Transparency'),
      href: '/data/forex',
    },
    {
      label: t('footerNav.holidays', 'Holidays'),
      href: '/philippines/holidays',
    },
    {
      label: t('footerNav.hotlines', 'Hotlines'),
      href: '/philippines/hotlines',
    },
    { label: t('footerNav.forex', 'Forex'), href: '/data/forex' },
    { label: t('footerNav.weather', 'Weather'), href: '/data/weather' },
  ];

  const aboutCol: FooterLink[] = [
    { label: t('footerNav.mission', 'Mission'), href: '/about' },
    {
      label: t('footerNav.designGuideline', 'Design Guideline'),
      href: '/design',
    },
    {
      label: t('footerNav.github', 'GitHub'),
      href: REPO_URL,
      external: true,
    },
    { label: t('footerNav.terms', 'Terms of Use'), href: '/terms-of-service' },
    { label: t('footerNav.contact', 'Contact'), href: '/contact' },
    {
      label: t('footerNav.reportBug', 'Report a bug'),
      href: ISSUES_URL,
      external: true,
    },
  ];

  return (
    <footer className='mt-20 bg-ed-navy-ink pb-7 pt-[60px] font-sans-ed text-[13px] text-white/75 max-md:mt-12 max-md:pb-6 max-md:pt-10'>
      <Container>
        <div className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 border-b border-white/10 pb-12 max-lg:grid-cols-[1fr_1fr_1fr] max-md:grid-cols-[1fr_1fr] max-md:gap-7 max-md:pb-8 max-[480px]:grid-cols-1'>
          <div className='max-md:col-span-full'>
            <div className='flex items-center gap-3'>
              <img
                src={COAT_OF_ARMS_SRC}
                alt={COAT_OF_ARMS_ALT}
                className='block h-12 w-auto'
              />
              <span className='block'>
                <span className='block font-serif-ed text-xl font-bold leading-none text-white'>
                  {SITE_NAME}
                </span>
                <span className='mt-1 block text-[11px] leading-tight text-white/60'>
                  {SITE_OWNER}
                </span>
              </span>
            </div>
            <p className='mt-4 max-w-[340px] leading-relaxed text-white/60'>
              {t(
                'footerAbout.description',
                'The official portal of the Republic of the Philippines, developed through a community collaboration partnership to make government information and services easier to find, read, and use.'
              )}
            </p>
            <p className='mt-3 max-w-[340px] leading-relaxed text-white/60'>
              {t(
                'footerAbout.builtBy',
                'Built by eGov, BetterGov, and hundreds of citizen volunteers.'
              )}
            </p>
            <img
              src={BAGONG_PILIPINAS_SRC}
              alt={BAGONG_PILIPINAS_ALT}
              width={256}
              height={238}
              loading='lazy'
              decoding='async'
              className='mt-6 block h-auto w-24'
            />
            <div className='mt-6 flex gap-3'>
              <Flag variant='outline' className='border-white/25 text-white/70'>
                {version ? `v${version}` : 'v4.2.0'}
              </Flag>
              <Flag variant='outline' className='border-white/25 text-white/70'>
                {t('footerAbout.openSource', 'Open Source')}
              </Flag>
            </div>
          </div>
          <FooterColumn
            heading={t('footerNav.servicesHeading', 'Services')}
            links={servicesCol}
          />
          <FooterColumn
            heading={t('footerNav.governmentHeading', 'Government')}
            links={governmentCol}
          />
          <FooterColumn
            heading={t('footerNav.resourcesHeading', 'Resources')}
            links={resourcesCol}
          />
          <FooterColumn
            heading={t('footerNav.aboutHeading', 'About')}
            links={aboutCol}
          />
        </div>
        <div className='flex justify-between pt-6 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/70 max-md:flex-col max-md:gap-2 max-md:text-[10px]'>
          <span>
            © {new Date().getFullYear()}{' '}
            {t(
              'footerBottom.copyright',
              'Republic of the Philippines · All rights reserved'
            )}
          </span>
          <span>
            {t('footerBottom.license', 'CC BY 4.0 · MIT')}
            {version ? ` · ${version}` : ''}
          </span>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
