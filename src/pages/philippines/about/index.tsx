import React from 'react';
import { Globe2, Users, Building2, Mountain, Sun } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

const AboutPhilippines: React.FC = () => {
  const facts = [
    {
      icon: <Globe2 className='h-6 w-6' />,
      title: 'Geography',
      description:
        'An archipelago of over 7,640 islands located in Southeast Asia',
    },
    {
      icon: <Users className='h-6 w-6' />,
      title: 'Population',
      description:
        'Home to over 110 million people across diverse ethnic groups',
    },
    {
      icon: <Building2 className='h-6 w-6' />,
      title: 'Capital',
      description:
        'Manila serves as the capital, with Metro Manila as the economic center',
    },
    {
      icon: <Mountain className='h-6 w-6' />,
      title: 'Landscape',
      description:
        'Features mountains, volcanoes, tropical rainforests, and beautiful beaches',
    },
    {
      icon: <Sun className='h-6 w-6' />,
      title: 'Climate',
      description: 'Tropical maritime climate with three distinct seasons',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='relative h-[60vh] overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg'
            alt='Philippine landscape'
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-black/50' />
        </div>
        <div className='relative h-full flex items-center'>
          <div className='container mx-auto px-4'>
            <div className='max-w-3xl'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6'>
                About the Philippines
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                Discover the Pearl of the Orient Seas, a nation of vibrant
                culture, rich history, and natural wonders spread across
                thousands of islands.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Quick Facts */}
          <div className='lg:col-span-2 space-y-8'>
            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                Quick Facts
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {facts.map((fact, index) => (
                  <Card key={index}>
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div className='p-3 bg-primary-100 rounded-lg text-primary-600'>
                          {fact.icon}
                        </div>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                            {fact.title}
                          </h3>
                          <p className='text-gray-800'>{fact.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                Overview
              </h2>
              <div className='prose max-w-none'>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  The Philippines is a sovereign archipelagic country located in
                  Southeast Asia, comprising over 7,640 islands. Named after
                  King Philip II of Spain, the country has a rich history
                  spanning thousands of years, from ancient indigenous cultures
                  to colonial periods under Spanish and American rule, leading
                  to its independence in 1946.
                </p>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  Today, the Philippines stands as one of Southeast Asia's most
                  dynamic economies, blending traditional values with modern
                  development. The country is known for its warm hospitality,
                  diverse cultural heritage, stunning natural landscapes, and
                  vibrant democracy.
                </p>
                <p className='text-gray-800 leading-relaxed'>
                  Filipino culture is a unique fusion of indigenous, Asian,
                  European, and American influences, reflected in its art,
                  music, cuisine, and traditions. The nation's biodiversity,
                  featuring unique species and ecosystems, makes it one of the
                  world's most environmentally significant countries.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Key Information
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Official Languages
                    </div>
                    <div className='text-gray-900'>
                      Filipino (Tagalog), English
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Government
                    </div>
                    <div className='text-gray-900'>
                      Presidential Constitutional Republic
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Currency
                    </div>
                    <div className='text-gray-900'>Philippine Peso (₱)</div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Time Zone
                    </div>
                    <div className='text-gray-900'>
                      UTC+8 (Philippine Standard Time)
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      Major Cities
                    </div>
                    <div className='text-gray-900'>
                      Manila, Quezon City, Davao, Cebu
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
                  <a
                    href='/philippines/history'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    History
                  </a>
                  <a
                    href='/philippines/culture'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    Culture
                  </a>
                  <a
                    href='/philippines/regions'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    Regions
                  </a>
                  <a
                    href='/philippines/tourism'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    Tourism
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPhilippines;
