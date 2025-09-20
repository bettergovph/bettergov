import React from 'react'
import { Link } from 'react-router-dom'
import { Cloud, BarChart2, TrendingUp, Thermometer } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const DataSection: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('data.title')}
          </h2>
          <p className="text-lg text-gray-800 max-w-2xl mx-auto">
            {t('data.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Weather Card */}
          <Link
            to="/data/weather"
            className="group bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">
                {t('data.weatherForecast')}
              </h3>
              <Cloud className="h-10 w-10 text-white opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-gray-700 font-medium">
                    {t('data.realtimeConditions')}
                  </span>
                </div>
                <span className="text-blue-600 font-semibold">
                  {t('data.viewArrow')}
                </span>
              </div>
              <p className="text-gray-800">{t('data.weatherDescription')}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {t('data.manila')}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {t('data.cebu')}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {t('data.davao')}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {t('data.moreCities')}
                </span>
              </div>
            </div>
          </Link>

          {/* Forex Card */}
          <Link
            to="/data/forex"
            className="group bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">
                {t('data.forexRates')}
              </h3>
              <BarChart2 className="h-10 w-10 text-white opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700 font-medium">
                    {t('data.liveExchange')}
                  </span>
                </div>
                <span className="text-green-600 font-semibold">
                  {t('data.viewArrow')}
                </span>
              </div>
              <p className="text-gray-800">{t('data.forexDescription')}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('data.usd')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('data.eur')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('data.jpy')}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {t('data.moreCurrencies')}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DataSection
