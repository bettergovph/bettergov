import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe2Icon,
  UsersIcon,
  Building2Icon,
  MountainIcon,
  SunIcon,
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

const AboutPhilippines: FC = () => {
  const { t } = useTranslation('about-philippines');

  const facts = [
    {
      icon: <Globe2Icon className='h-6 w-6' />,
      title: t('about.facts.items.geography.title'),
      description: t('about.facts.items.geography.description'),
    },
    {
      icon: <UsersIcon className='h-6 w-6' />,
      title: t('about.facts.items.population.title'),
      description: t('about.facts.items.population.description'),
    },
    {
      icon: <Building2Icon className='h-6 w-6' />,
      title: t('about.facts.items.capital.title'),
      description: t('about.facts.items.capital.description'),
    },
    {
      icon: <MountainIcon className='h-6 w-6' />,
      title: t('about.facts.items.landscape.title'),
      description: t('about.facts.items.landscape.description'),
    },
    {
      icon: <SunIcon className='h-6 w-6' />,
      title: t('about.facts.items.climate.title'),
      description: t('about.facts.items.climate.description'),
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
                {t('about.hero.title')}
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                {t('about.hero.description')}
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
                {t('about.facts.title')}
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
                {t('about.overview.title')}
              </h2>
              <div className='prose max-w-none'>
                {(
                  t('about.overview.paragraphs', {
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
                  {t('about.keyInformation.title')}
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('about.keyInformation.items.officialLanguages.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('about.keyInformation.items.officialLanguages.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('about.keyInformation.items.government.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('about.keyInformation.items.government.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('about.keyInformation.items.currency.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('about.keyInformation.items.currency.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('about.keyInformation.items.timeZone.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('about.keyInformation.items.timeZone.value')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('about.keyInformation.items.majorCities.label')}
                    </div>
                    <div className='text-gray-900'>
                      {t('about.keyInformation.items.majorCities.value')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('about.relatedLinks.title')}
                </h3>
                <nav className='space-y-2'>
                  <a
                    href='/philippines/history'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('about.relatedLinks.items.history')}
                  </a>
                  <a
                    href='/philippines/culture'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('about.relatedLinks.items.culture')}
                  </a>
                  <a
                    href='/philippines/regions'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('about.relatedLinks.items.regions')}
                  </a>
                  <a
                    href='/philippines/tourism'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('about.relatedLinks.items.tourism')}
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
