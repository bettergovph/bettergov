import React from 'react';
import {
  Music2Icon,
  UtensilsIcon,
  HeartIcon,
  UsersIcon,
  PaletteIcon,
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

const PhilippinesCulture: React.FC = () => {
  const culturalAspects = [
    {
      icon: <Music2Icon className='h-6 w-6' />,
      title: 'Music and Dance',
      description:
        'Traditional and modern Filipino performing arts, from Tinikling to contemporary OPM',
      image:
        'https://images.pexels.com/photos/5299821/pexels-photo-5299821.jpeg',
    },
    {
      icon: <UtensilsIcon className='h-6 w-6' />,
      title: 'Cuisine',
      description:
        'Rich culinary traditions blending native, Chinese, Spanish, and American influences',
      image: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
    },
    {
      icon: <HeartIcon className='h-6 w-6' />,
      title: 'Festivals',
      description:
        'Vibrant celebrations showcasing Filipino faith, culture, and community spirit',
      image:
        'https://images.pexels.com/photos/2663163/pexels-photo-2663163.jpeg',
    },
    {
      icon: <UsersIcon className='h-6 w-6' />,
      title: 'Social Values',
      description:
        'Strong family ties, respect for elders, and the spirit of Bayanihan',
      image:
        'https://images.pexels.com/photos/32326425/pexels-photo-32326425.jpeg',
    },
    {
      icon: <PaletteIcon className='h-6 w-6' />,
      title: 'Arts and Crafts',
      description:
        'Traditional weaving, pottery, and contemporary Filipino visual arts',
      image:
        'https://images.pexels.com/photos/1364565/pexels-photo-1364565.jpeg',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='relative h-[60vh] overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='https://images.pexels.com/photos/20380277/pexels-photo-20380277.jpeg'
            alt='Filipino Culture'
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-black/50' />
        </div>
        <div className='relative h-full flex items-center'>
          <div className='container mx-auto px-4'>
            <div className='max-w-3xl'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6'>
                Filipino Culture
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                Experience the vibrant tapestry of Filipino traditions, arts,
                and values that make the Philippines truly unique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Cultural Aspects */}
          <div className='lg:col-span-2'>
            <section className='mb-12'>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                Cultural Heritage
              </h2>
              <div className='grid gap-6'>
                {culturalAspects.map((aspect, index) => (
                  <Card key={index}>
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div className='p-3 bg-primary-100 rounded-lg text-primary-600'>
                          {aspect.icon}
                        </div>
                        <div className='flex-1'>
                          <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                            {aspect.title}
                          </h3>
                          <p className='text-gray-800 mb-4'>
                            {aspect.description}
                          </p>
                          <img
                            src={aspect.image}
                            alt={aspect.title}
                            className='w-full h-48 object-cover rounded-lg'
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                Cultural Identity
              </h2>
              <div className='prose max-w-none'>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  Filipino culture is a unique blend of indigenous, Asian, and
                  Western influences, shaped by centuries of trade,
                  colonization, and cultural exchange. At its core lies strong
                  family values, religious faith, and a sense of community that
                  binds the nation together.
                </p>
                <p className='text-gray-800 leading-relaxed mb-4'>
                  The Philippines is known for its warm hospitality, expressed
                  through the concept of &ldquo;pakikisama&rdquo;
                  (companionship) and &ldquo;bayanihan&rdquo; (community
                  spirit). These values are reflected in daily life,
                  celebrations, and social interactions.
                </p>
                <p className='text-gray-800 leading-relaxed'>
                  Filipino arts and crafts, from traditional weaving to modern
                  visual arts, showcase the creativity and skill of the Filipino
                  people. The country&apos;s diverse musical traditions, dances,
                  and festivals celebrate its rich cultural heritage while
                  embracing contemporary influences.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Major Festivals
                </h3>
                <div className='space-y-4'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      Sinulog Festival
                    </div>
                    <div className='text-sm text-gray-800'>
                      Cebu City (January)
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Ati-Atihan</div>
                    <div className='text-sm text-gray-800'>
                      Kalibo, Aklan (January)
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Panagbenga</div>
                    <div className='text-sm text-gray-800'>
                      Baguio City (February)
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      MassKara Festival
                    </div>
                    <div className='text-sm text-gray-800'>
                      Bacolod City (October)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Traditional Arts
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='font-medium text-gray-900'>Weaving</div>
                    <div className='text-sm text-gray-800'>
                      T&apos;nalak, Piña, Inabel
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Music</div>
                    <div className='text-sm text-gray-800'>
                      Kulintang, Rondalla
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Dance</div>
                    <div className='text-sm text-gray-800'>
                      Tinikling, Singkil, Pandanggo
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>Visual Arts</div>
                    <div className='text-sm text-gray-800'>
                      Indigenous patterns, Catholic imagery
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
                    href='/philippines/about'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    About
                  </a>
                  <a
                    href='/philippines/history'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    History
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

export default PhilippinesCulture;
