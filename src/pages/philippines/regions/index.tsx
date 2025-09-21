import React, { useMemo } from 'react';
import { MapPin, Mountain, Building2, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import regionsData from '../../../data/regions.json';
import SEO from '../../../components/SEO';
import { getLocalGovSEOData } from '../../../utils/seo-data';

const PhilippinesRegions: React.FC = () => {
  // Use the regions data from our JSON file
  const regions = useMemo(() => {
    // Map region data to include additional display information
    return regionsData.map(region => {
      // Get icon based on region name pattern
      let icon = <Building2 className='h-6 w-6' />;

      if (region.name.includes('CORDILLERA')) {
        icon = <Mountain className='h-6 w-6' />;
      } else if (
        region.name.includes('VISAYAS') ||
        region.name.includes('MIMAROPA')
      ) {
        icon = <Globe className='h-6 w-6' />;
      } else if (region.name.includes('MINDANAO')) {
        icon = <Users className='h-6 w-6' />;
      }

      // Format the region name for display (title case)
      const displayName = region.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace('Ncr', 'NCR')
        .replace('Mimaropa', 'MIMAROPA')
        .replace('Calabarzon', 'CALABARZON');

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
                Regions of the Philippines
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                Explore all {regions.length} administrative regions of the
                Philippines and their local government units.
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
                Administrative Regions
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
                            <MapPin className='h-4 w-4 mr-1' />
                            <span>Local Government Units</span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <Link
                              to={region.lguLink}
                              className='inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700'
                            >
                              View LGUs
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
                Regional Overview
              </h2>
              <div className='prose max-w-none'>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  The Philippines is divided into three main geographical
                  divisions: Luzon, Visayas, and Mindanao. These are further
                  subdivided into 17 regions, each with its own administrative
                  center, cultural identity, and economic focus.
                </p>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  Each region showcases unique traditions, dialects, and
                  cuisines, contributing to the country&apos;s rich cultural
                  tapestry. From the mountain tribes of the Cordilleras to the
                  seafaring communities of the Visayas, the diversity of
                  Filipino regional cultures is remarkable.
                </p>
                <p className='text-gray-800 leading-relaxed'>
                  The regions also vary in their economic activities, from the
                  industrial and service-oriented National Capital Region to the
                  agricultural heartlands of Central Luzon and the resource-rich
                  provinces of Mindanao.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Quick Facts
                </h3>
                <div className='space-y-4'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Total Regions
                    </div>
                    <div className='text-gray-900'>
                      18 Administrative Regions
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Provinces
                    </div>
                    <div className='text-gray-900'>82 Provinces</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Cities
                    </div>
                    <div className='text-gray-900'>149 Cities</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Municipalities
                    </div>
                    <div className='text-gray-900'>1,493 Municipalities</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Regional Languages
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='font-medium text-gray-900'>Luzon</div>
                    <div className='text-sm text-gray-800'>
                      Tagalog, Ilocano, Bicolano
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Visayas</div>
                    <div className='text-sm text-gray-800'>
                      Cebuano, Hiligaynon, Waray
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Mindanao</div>
                    <div className='text-sm text-gray-800'>
                      Cebuano, Maguindanaon, Tausug
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Related Links
                </h3>
                <nav className='space-y-2'>
                  <Link
                    to='/philippines/map'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <MapPin className='h-4 w-4 mr-2' />
                      Interactive Map
                    </div>
                  </Link>
                  <Link
                    to='/government/local'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <Building2 className='h-4 w-4 mr-2' />
                      Local Government Units
                    </div>
                  </Link>
                  <Link
                    to='/government/departments'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <Users className='h-4 w-4 mr-2' />
                      Government Departments
                    </div>
                  </Link>
                  <Link
                    to='/philippines/about'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    <div className='flex items-center'>
                      <Globe className='h-4 w-4 mr-2' />
                      About the Philippines
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
