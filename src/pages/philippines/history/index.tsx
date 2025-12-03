import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, FlagIcon, CrownIcon, ScaleIcon } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

const PhilippinesHistory: FC = () => {
  const { t } = useTranslation('about-philippines');

  const timelinePeriods = [
    {
      icon: <FlagIcon className='h-6 w-6' />,
      title: t('history.timeline.periods.independence.title'),
      period: t('history.timeline.periods.independence.period'),
      description: t('history.timeline.periods.independence.description'),
      image: '/assets/history/independence-modern-era.webp',
    },
    {
      icon: <ScaleIcon className='h-6 w-6' />,
      title: t('history.timeline.periods.american.title'),
      period: t('history.timeline.periods.american.period'),
      description: t('history.timeline.periods.american.description'),
      image: '/assets/history/american-period.webp',
    },
    {
      icon: <CrownIcon className='h-6 w-6' />,
      title: t('history.timeline.periods.spanish.title'),
      period: t('history.timeline.periods.spanish.period'),
      description: t('history.timeline.periods.spanish.description'),
      image: '/assets/history/spanish-colonial-era.webp',
    },
    {
      icon: <ClockIcon className='h-6 w-6' />,
      title: t('history.timeline.periods.preColonial.title'),
      period: t('history.timeline.periods.preColonial.period'),
      description: t('history.timeline.periods.preColonial.description'),
      image: '/assets/history/pre-colonial-period.webp',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='relative h-[60vh] overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src='https://images.pexels.com/photos/19376770/pexels-photo-19376770/free-photo-of-women-dancing-in-red-traditional-clothing-in-festival.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
            alt='Historical Philippines'
            loading='lazy'
            className='w-full h-full object-cover'
          />
          <div className='absolute inset-0 bg-black/50' />
        </div>
        <div className='relative h-full flex items-center'>
          <div className='container mx-auto px-4'>
            <div className='max-w-3xl'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6'>
                {t('history.hero.title')}
              </h1>
              <p className='text-xl text-white/90 leading-relaxed'>
                {t('history.hero.description')}
              </p>
              <p className='text-xs'>
                <a href='https://www.pexels.com/photo/women-dancing-in-red-traditional-clothing-in-festival-19376770/'>
                  {t('history.hero.photoCredit')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Timeline */}
          <div className='lg:col-span-2'>
            <section className='mb-12'>
              <h2 className='text-3xl font-bold text-gray-900 mb-8'>
                {t('history.timeline.title')}
              </h2>
              <div className='relative'>
                {/* Timeline line */}
                <div className='absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300'></div>

                <div className='space-y-12'>
                  {timelinePeriods.map((period, index) => (
                    <div key={index} className='relative flex items-start'>
                      {/* Timeline node */}
                      <div className='absolute left-0 w-16 h-16 bg-white rounded-full border-4 border-primary-500 shadow-lg flex items-center justify-center z-10'>
                        <div className='text-primary-600'>{period.icon}</div>
                      </div>

                      {/* Content */}
                      <div className='ml-24 flex-1'>
                        <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                          {/* Period header */}
                          <div className='bg-primary-50 px-6 py-3 border-b border-primary-100'>
                            <span className='text-lg font-bold text-primary-700'>
                              {period.period}
                            </span>
                          </div>

                          {/* Main content */}
                          <div className='p-6'>
                            <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                              {period.title}
                            </h3>
                            <p className='text-gray-700 mb-4 leading-relaxed'>
                              {period.description}
                            </p>
                            <img
                              src={period.image}
                              alt={period.title}
                              loading='lazy'
                              className='w-full h-48 object-cover rounded-lg'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-3xl font-bold text-gray-900 mb-6'>
                {t('history.overview.title')}
              </h2>
              <div className='prose max-w-none'>
                {(
                  t('history.overview.paragraphs', {
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
                  {t('history.keyFigures.title')}
                </h3>
                <div className='space-y-4'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t('history.keyFigures.figures.rizal.name')}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t('history.keyFigures.figures.rizal.description')}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t('history.keyFigures.figures.bonifacio.name')}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t('history.keyFigures.figures.bonifacio.description')}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t('history.keyFigures.figures.aguinaldo.name')}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t('history.keyFigures.figures.aguinaldo.description')}
                    </div>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {t('history.keyFigures.figures.aquino.name')}
                    </div>
                    <div className='text-sm text-gray-800'>
                      {t('history.keyFigures.figures.aquino.description')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('history.importantDates.title')}
                </h3>
                <div className='space-y-3'>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('history.importantDates.dates.magellan.date')}
                    </div>
                    <div className='text-gray-900'>
                      {t('history.importantDates.dates.magellan.event')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('history.importantDates.dates.independence.date')}
                    </div>
                    <div className='text-gray-900'>
                      {t('history.importantDates.dates.independence.event')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('history.importantDates.dates.recognition.date')}
                    </div>
                    <div className='text-gray-900'>
                      {t('history.importantDates.dates.recognition.event')}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm font-medium text-gray-800'>
                      {t('history.importantDates.dates.edsa.date')}
                    </div>
                    <div className='text-gray-900'>
                      {t('history.importantDates.dates.edsa.event')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  {t('history.relatedLinks.title')}
                </h3>
                <nav className='space-y-2'>
                  <a
                    href='/philippines/about'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('history.relatedLinks.items.about')}
                  </a>
                  <a
                    href='/philippines/culture'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('history.relatedLinks.items.culture')}
                  </a>
                  <a
                    href='/philippines/regions'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('history.relatedLinks.items.regions')}
                  </a>
                  <a
                    href='/philippines/tourism'
                    className='block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors'
                  >
                    {t('history.relatedLinks.items.tourism')}
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

export default PhilippinesHistory;
