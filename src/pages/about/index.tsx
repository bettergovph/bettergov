import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, AlertTriangle, Users, Heart } from 'lucide-react';

const AboutPage: React.FC = () => {
  const { t } = useTranslation('about');
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 py-6 md:py-8'>
        <div className='bg-white rounded-lg border shadow-sm p-6 md:p-8 md:py-24 mt-4'>
          <div className='max-w-3xl mx-auto'>
            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-6'>
              {t('title')}
            </h1>

            <div className='prose prose-lg max-w-none'>
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

              <section className='mb-10'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  {t('mission.title')}
                </h2>
                <p className='mb-4 text-gray-700'>{t('mission.intro')}</p>
                <p className='mb-4 text-gray-700'>{t('mission.goalsIntro')}</p>
                <ul className='list-disc pl-6 mb-6 text-gray-700'>
                  {(
                    t('mission.goalsList', { returnObjects: true }) as string[]
                  ).map((goal: string, index: number) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </section>

              <section className='mb-10'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  {t('features.title')}
                </h2>
                <ul className='list-disc pl-6 mb-6 text-gray-700'>
                  {(
                    t('features.list', { returnObjects: true }) as string[]
                  ).map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </section>

              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <Users className='mr-2 h-6 w-6 text-blue-600' />
                  {t('volunteer.title')}
                </h2>
                <p className='mb-4 text-gray-700'>{t('volunteer.intro')}</p>
                <div className='grid md:grid-cols-2 gap-4 mb-6'>
                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <h3 className='font-semibold text-gray-800 mb-2'>
                      {t('volunteer.technical.title')}
                    </h3>
                    <ul className='list-disc pl-6 text-gray-700'>
                      {(
                        t('volunteer.technical.skills', {
                          returnObjects: true,
                        }) as string[]
                      ).map((skill: string, index: number) => (
                        <li key={index}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                  <div className='bg-green-50 p-4 rounded-lg'>
                    <h3 className='font-semibold text-gray-800 mb-2'>
                      {t('volunteer.content.title')}
                    </h3>
                    <ul className='list-disc pl-6 text-gray-700'>
                      {(
                        t('volunteer.content.skills', {
                          returnObjects: true,
                        }) as string[]
                      ).map((skill: string, index: number) => (
                        <li key={index}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className='bg-blue-100 p-6 rounded-lg flex items-start'>
                  <Heart className='h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-1' />
                  <div>
                    <p className='font-medium text-gray-800 mb-2'>
                      {t('volunteer.callToAction.title')}
                    </p>
                    <p className='text-gray-700 mb-4'>
                      {t('volunteer.callToAction.description')}
                      <a
                        href='mailto:volunteers@bettergov.ph'
                        className='text-blue-600 hover:text-blue-800 mx-1'
                      >
                        {t('volunteer.callToAction.email')}
                      </a>
                      {t('volunteer.callToAction.alternative')}
                    </p>
                  </div>
                </div>
              </section>

              <section className='mb-10'>
                <h2 className='flex items-center text-2xl font-bold text-gray-800 mb-4'>
                  <AlertTriangle className='mr-2 h-6 w-6 text-amber-500' />
                  {t('bugReport.title')}
                </h2>
                <p className='mb-4 text-gray-700'>{t('bugReport.intro')}</p>
                <ol className='list-decimal pl-6 mb-6 text-gray-700'>
                  {(
                    t('bugReport.steps', { returnObjects: true }) as string[]
                  ).map((step: string, index: number) => (
                    <li key={index}>
                      {step}
                      {index === 2 && (
                        <ul className='list-disc pl-6 mt-2'>
                          {(
                            t('bugReport.bugDetails', {
                              returnObjects: true,
                            }) as string[]
                          ).map((detail: string, detailIndex: number) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
                <div className='bg-amber-50 p-4 rounded-lg flex items-center'>
                  <Mail className='h-5 w-5 text-amber-600 mr-2' />
                  <p className='text-gray-700'>
                    {t('bugReport.alternative.text')}
                    <a
                      href='mailto:bugs@bettergov.ph'
                      className='text-blue-600 hover:text-blue-800 mx-1'
                    >
                      {t('bugReport.alternative.email')}
                    </a>
                  </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
