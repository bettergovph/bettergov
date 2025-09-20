import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { useTranslation } from 'react-i18next'

const GovernmentSection: React.FC = () => {
  const { t } = useTranslation('common')

  const branches = [
    {
      id: 'executive',
      title: t('government.executiveTitle'),
      description: t('government.executiveDescription'),
      icon: (
        <svg
          className="h-10 w-10 text-primary-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 17.8L5.8 21 7 14.1 2 9.3l7-1L12 2l3 6.3 7 1-5 4.8 1.2 6.9-6.2-3.2z"></path>
        </svg>
      ),
      link: '/government/executive',
    },
    {
      id: 'legislative',
      title: t('government.legislativeTitle'),
      description: t('government.legislativeDescription'),
      icon: (
        <svg
          className="h-10 w-10 text-primary-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
      link: '/government/legislative',
    },
    {
      id: 'judiciary',
      title: t('government.judiciaryTitle'),
      description: t('government.judiciaryDescription'),
      icon: (
        <svg
          className="h-10 w-10 text-primary-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18"></path>
          <path d="M12 3v18"></path>
          <path d="M5 8h14"></path>
          <path d="M5 16h14"></path>
        </svg>
      ),
      link: '/government/judiciary',
    },
  ]

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t('government.title')}
          </h2>
          <p className="text-gray-800 max-w-2xl mx-auto">
            {t('government.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <Card key={branch.id} hoverable className="text-center">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">{branch.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {branch.title}
                </h3>
                <p className="text-gray-800 mb-4">{branch.description}</p>
                <a
                  href={branch.link}
                  className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center transition-colors"
                >
                  {t('government.learnMore')}
                  <svg
                    className="ml-1 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="md:flex items-center">
            <div className="mb-6 md:mb-0 md:w-2/3 md:pr-8">
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                {t('government.directoryTitle')}
              </h3>
              <p className="text-gray-800">
                {t('government.directoryDescription')}
              </p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <a
                href="/government/executive"
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
              >
                {t('government.viewDirectory')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default GovernmentSection
