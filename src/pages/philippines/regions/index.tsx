import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPinIcon,
  MountainIcon,
  Building2Icon,
  UsersIcon,
  GlobeIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import regionsData from '../../../data/regions.json';
import SEO from '../../../components/SEO';
import { getLocalGovSEOData } from '../../../utils/seo-data';

const PhilippinesRegions: React.FC = () => {
  const { t } = useTranslation('about-philippines');

  // Simple region name formatter
  const formatRegionName = (name: string): string => {
    return name
      .split(/(\s|-)/g)
      .map(part => {
        if (!part.trim() || /^[\s-]$/.test(part)) return part;

        const upper = part.toUpperCase();

        // Roman numerals
        if (/^(I{1,3}|IV|V|VI{0,3}|IX|X|XI{0,2}|XIII)$/.test(upper))
          return upper;

        // Known acronyms
        if (
          /^(NCR|MIMAROPA|CALABARZON|SOCCSKSARGEN|CARAGA|BANGSAMORO)$/.test(
            upper
          )
        )
          return upper;

        // Default to title case
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
  };

  // Use the regions data from our JSON file
  const regions = useMemo(() => {
    // Map region data to include additional display information
    return regionsData.map(region => {
      // Get icon based on region name pattern
      let icon = <Building2Icon className='h-6 w-6' />;

      if (region.name.includes('CORDILLERA')) {
        icon = <MountainIcon className='h-6 w-6' />;
      } else if (
        region.name.includes('VISAYAS') ||
        region.name.includes('MIMAROPA')
      ) {
        icon = <GlobeIcon className='h-6 w-6' />;
      } else if (region.name.includes('MINDANAO')) {
        icon = <UsersIcon className='h-6 w-6' />;
      }

      // Format the region name for display using our new parser
      const displayName = formatRegionName(region.name);

      return {
        ...region,
        icon,
        displayName,
        // Link to the LGU page using the slug
        lguLink: `/government/local/${region.slug}`,
      };
    });
  }, []);

  const seoData = getLocalGovSEOData();

  return (
    <div className='min-h-screen bg-gray-50'>
      <SEO {...seoData} />
      {/* Hero Section */}
      <div className='relative h-[60vh] overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg'
            alt='Philippine Regions'
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-black/50' />
        </div>
        <div className='relative h-full flex items-center'>
          <div className='container mx-auto px-4'>
            <div className='max-w-3xl'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6'>
                {t('regions.hero.title')}
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                {t('regions.hero.description', { count: regions.length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Regions Grid */}
          <div className='lg:col-span-2'>
            <section className='mb-12'>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                {t('regions.sections.administrativeRegions.title')}
              </h2>
              <div className='grid gap-6'>
                {regions.map((region, index) => (
                  <Card
                    key={index}
                    className='hover:shadow-md transition-shadow duration-300'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div className='p-3 bg-primary-100 rounded-lg text-primary-600'>
                          {region.icon}
                        </div>
                        <div className='flex-1'>
                          <Link to={region.lguLink} className='group'>
                            <h3 className='text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors'>
                              {region.displayName}
                            </h3>
                          </Link>
                          <div className='flex items-center text-sm text-gray-800 mb-4'>
                            <MapPinIcon className='h-4 w-4 mr-1' />
                            <span>
                              {t(
                                'regions.sections.administrativeRegions.localGovUnits'
                              )}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <Link
                              to={region.lguLink}
                              className='inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700'
                            >
                              {t(
                                'regions.sections.administrativeRegions.viewLGUs'
                              )}
                              <svg
                                className='w-4 h-4 ml-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                xmlns='http://www.w3.org/2000/svg'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M9 5l7 7-7 7'
                                />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                {t('regions.sections.regionalOverview.title')}
              </h2>
              <div className='prose max-w-none'>
                {(
                  t('regions.sections.regionalOverview.paragraphs', {
                    returnObjects: true,
                  }) as string[]
                ).map((paragraph: string, index: number) => (
                  <p key={index} className='text-gray-800 leading-relaxed mb-4'>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('regions.sidebar.quickFacts.title')}
                </h3>
                <div className='space-y-4'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('regions.sidebar.quickFacts.totalRegions.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('regions.sidebar.quickFacts.totalRegions.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('regions.sidebar.quickFacts.provinces.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('regions.sidebar.quickFacts.provinces.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('regions.sidebar.quickFacts.cities.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('regions.sidebar.quickFacts.cities.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('regions.sidebar.quickFacts.municipalities.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('regions.sidebar.quickFacts.municipalities.value')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('regions.sidebar.regionalLanguages.title')}
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.luzon.name'
                      )}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.luzon.languages'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.visayas.name'
                      )}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.visayas.languages'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.mindanao.name'
                      )}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t(
                        'regions.sidebar.regionalLanguages.regions.mindanao.languages'
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('regions.sidebar.relatedLinks.title')}
                </h3>
                <nav className='space-y-2'>
                  <Link
                    to='/philippines/map'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <MapPinIcon className='h-4 w-4 mr-2' />
                      {t('regions.sidebar.relatedLinks.interactiveMap')}
                    </div>
                  </Link>
                  <Link
                    to='/government/local'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <Building2Icon className='h-4 w-4 mr-2' />
                      {t('regions.sidebar.relatedLinks.localGovernmentUnits')}
                    </div>
                  </Link>
                  <Link
                    to='/government/departments'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <UsersIcon className='h-4 w-4 mr-2' />
                      {t('regions.sidebar.relatedLinks.governmentDepartments')}
                    </div>
                  </Link>
                  <Link
                    to='/philippines/about'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <GlobeIcon className='h-4 w-4 mr-2' />
                      {t('regions.sidebar.relatedLinks.aboutPhilippines')}
                    </div>
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhilippinesRegions;
