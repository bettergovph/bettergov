import {
  BuildingIcon,
  GlobeIcon,
  HeartIcon,
  LightbulbIcon,
  MessageCircleIcon,
  RocketIcon,
  ServerIcon,
  StarIcon,
  TargetIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const AboutPage: FC = () => {
  const { t } = useTranslation('about');
  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>About | BetterGov.ph</title>
        <meta
          name='description'
          content='BetterGov is a volunteer-led tech initiative committed to creating #civictech projects aimed at making government more transparent, efficient, and accessible to citizens.'
        />
        <meta
          name='keywords'
          content='government projects, civic tech, transparency, accountability, Philippines, innovation'
        />
        <link rel='canonical' href='https://bettergov.ph/about' />

        {/* Open Graph / Social */}
        <meta property='og:title' content='About | BetterGov.ph' />
        <meta
          property='og:description'
          content='BetterGov is a volunteer-led tech initiative committed to creating #civictech projects aimed at making government more transparent, efficient, and accessible to citizens.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bettergov.ph/about' />
        <meta property='og:image' content='https://bettergov.ph/ph-logo.png' />
      </Helmet>
      <div className='container mx-auto px-4 py-6 md:py-8'>
        <div className='bg-white rounded-lg border shadow-xs p-6 md:p-8 md:py-24 mt-4'>
          <div className='max-w-3xl mx-auto'>
            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-6'>
              {t('title')}
            </h1>

            <div className='prose prose-lg max-w-none'>
              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <TargetIcon className='mr-2 h-6 w-6 text-primary-600' />
                  {t('mission.title')}
                </h2>
                <div className='bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 md:p-8 mb-6'>
                  <p className='text-lg text-gray-800 leading-relaxed mb-4'>
                    BetterGov is a{' '}
                    <strong>volunteer-led tech initiative</strong> committed to
                    creating
                    <span className='inline-flex items-center mx-2 px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-semibold'>
                      <ZapIcon className='h-4 w-4 mr-1' />
                      #civictech
                    </span>
                    projects aimed at making government more transparent,
                    efficient, and accessible to citizens.
                  </p>
                  <p className='text-lg text-gray-800 leading-relaxed mb-4'>
                    Our goal is to{' '}
                    <strong>support, promote, consolidate, and empower</strong>{' '}
                    citizen builders!
                  </p>
                </div>
              </section>

              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <RocketIcon className='mr-2 h-6 w-6 text-primary-600' />
                  {t('mission.goalsIntro')}
                </h2>

                <ul className='list-disc pl-6 mb-6 text-gray-700'>
                  {(
                    t('mission.goalsList', { returnObjects: true }) as string[]
                  ).map((goal: string, index: number) => (
                    <li key={index} className='mb-2'>
                      {goal}
                    </li>
                  ))}
                </ul>
              </section>

              {/* What We Provide Section */}
              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <RocketIcon className='mr-2 h-6 w-6 text-primary-600' />
                  What We Provide
                </h2>
                <p className='mb-6 text-gray-700'>
                  To support citizen builders in building impactful civic tech
                  projects:
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                  {[
                    {
                      icon: ServerIcon,
                      title: 'Infrastructure & Tools',
                      desc: 'Servers, AI credits, development tools, and more!',
                    },
                    {
                      icon: UsersIcon,
                      title: 'Tech Hackathons',
                      desc: 'Regular events to collaborate and build together',
                    },
                    {
                      icon: GlobeIcon,
                      title: 'Data & APIs',
                      desc: 'Access to government data and API endpoints',
                    },
                    {
                      icon: HeartIcon,
                      title: 'Find Your Team',
                      desc: 'Connect with the right people and resource persons',
                    },
                    {
                      icon: StarIcon,
                      title: 'Industry Mentorship',
                      desc: 'Guidance from seasoned tech and startup veterans',
                    },
                    {
                      icon: BuildingIcon,
                      title: 'Office Space',
                      desc: 'Physical workspace for collaboration and meetings',
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className='bg-white border rounded-lg p-5 hover:shadow-md transition-all'
                    >
                      <div className='flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-3'>
                        <item.icon className='h-6 w-6 text-primary-600' />
                      </div>
                      <h3 className='text-base font-semibold text-gray-900 mb-2'>
                        {item.title}
                      </h3>
                      <p className='text-sm text-gray-600'>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className='mb-10'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  {t('whyBuilding.title')}
                </h2>
                <p className='mb-4 text-gray-700'>
                  {t('whyBuilding.intro')}
                  <a
                    href='https://www.gov.ph'
                    className='text-blue-600 hover:text-blue-800 mx-1'
                  >
                    {t('whyBuilding.govPhLink')}
                  </a>
                  {t('whyBuilding.challenges')}
                </p>
                <ul className='list-disc pl-6 mb-6 text-gray-700 leading-relaxed'>
                  {(
                    t('whyBuilding.challengesList', {
                      returnObjects: true,
                    }) as string[]
                  ).map((challenge: string, index: number) => (
                    <li key={index} className='mb-2'>
                      {challenge}
                    </li>
                  ))}
                </ul>
                <p className='text-gray-700'>{t('whyBuilding.conclusion')}</p>
              </section>

              {/* Our Commitment Section */}
              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <ZapIcon className='mr-2 h-6 w-6 text-yellow-500' />
                  Our Commitment
                </h2>
                <div className='bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 rounded-xl p-6 md:p-8 border-l-4 border-primary-600'>
                  <div className='space-y-4 text-gray-800'>
                    <p className='text-lg font-bold text-primary-700'>
                      WE&apos;RE DONE WAITING.
                    </p>
                    <p className='text-base leading-relaxed'>
                      We&apos;re angry. You&apos;re angry. But we can contribute
                      in our own ways —{' '}
                      <strong>no matter how little it is</strong>.
                    </p>
                    <p className='text-base leading-relaxed'>
                      We can do <strong>amazing things</strong> together.{' '}
                      <span className='font-semibold text-primary-700'>
                        Grassroots style. Open source. No permission needed.
                      </span>
                    </p>
                    <p className='text-base leading-relaxed'>
                      We are committed to putting{' '}
                      <strong>time, resources, and money</strong> into this
                      initiative. We will keep building{' '}
                      <strong>relentlessly</strong> without anyone&apos;s
                      permission. Open source, public,{' '}
                      <strong>high quality</strong> sites.
                    </p>
                    <div className='mt-6 pt-4 border-t-2 border-primary-200'>
                      <p className='font-bold text-primary-700 text-lg'>
                        WE&apos;RE LOOKING FOR PEOPLE SMARTER THAN US!
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  {t('license.title')}
                </h2>
                <p className='mb-4 text-gray-700'>
                  {t('license.description')}
                  <a
                    href='https://creativecommons.org/publicdomain/zero/1.0/'
                    className='text-blue-600 hover:text-blue-800 mx-1'
                  >
                    {t('license.ccLink')}
                  </a>
                  {t('license.explanation')}
                </p>
              </section>
            </div>

            {/* Call to Action */}
            <div className='bg-blue-600 rounded-lg p-8 mt-8 text-center'>
              <h3 className='text-2xl font-bold text-white mb-4'>
                Ready to Make a Difference?
              </h3>
              <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
                Join our community of builders, dreamers, and changemakers.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Link
                  to='/contact'
                  className='inline-flex items-center bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors'
                >
                  <MessageCircleIcon className='w-5 h-5 mr-2' />
                  Contacts
                </Link>
                <span className='text-white flex items-center justify-center'>
                  or
                </span>
                <Link
                  to='/join-us'
                  className='inline-flex items-center bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors'
                >
                  <LightbulbIcon className='w-5 h-5 mr-2' />
                  Join Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
