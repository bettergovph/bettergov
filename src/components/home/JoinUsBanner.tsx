import React from 'react'
import { Users, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const JoinUsBanner: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 py-16 text-white">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-10 opacity-20">
        <Zap className="h-16 w-16 text-yellow-300" />
      </div>
      <div className="absolute bottom-4 right-10 opacity-20">
        <Users className="h-20 w-20 text-yellow-300" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-300/20 rounded-full backdrop-blur-sm border border-yellow-300/40">
              <Users className="h-8 w-8 text-yellow-200" />
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {t('joinUs.bannerTitle').split('#CivicTech')[0]}
            <span className="text-yellow-200">#CivicTech</span>
            {t('joinUs.bannerTitle').split('#CivicTech')[1]}
          </h2>

          <p className="text-lg md:text-xl mb-8 text-orange-100 leading-relaxed max-w-3xl mx-auto">
            {t('joinUs.bannerSubtitle')}
            <strong className="text-yellow-200">
              {' '}
              {t('joinUs.bannerHighlight')}
            </strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/join-us"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg text-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              {t('joinUs.joinMovement')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>

            <div className="text-orange-100 font-medium">{t('joinUs.or')}</div>

            <a
              href="https://discord.gg/mHtThpN8bT"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-all"
            >
              {t('joinUs.joinDiscord')}
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-orange-200 text-sm">{t('joinUs.features')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default JoinUsBanner
