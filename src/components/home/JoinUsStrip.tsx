import React from 'react'
import { Users, ArrowRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const JoinUsStrip: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-3">
      <div className="absolute inset-0 bg-black/10"></div>

      {/* Animated background elements */}
      <div className="absolute left-0 top-0 w-full h-full opacity-20">
        <div className="flex items-center justify-around h-full animate-pulse">
          <Zap className="h-4 w-4" />
          <Users className="h-4 w-4" />
          <Zap className="h-4 w-4" />
          <Users className="h-4 w-4" />
          <Zap className="h-4 w-4" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-300/30 rounded-full">
                <Users className="h-4 w-4 text-yellow-200" />
              </div>
              <span className="font-bold text-sm">
                {t('joinUs.stripTitle')}
              </span>
            </div>
            <span className="hidden md:inline text-sm text-orange-100">
              {t('joinUs.stripSubtitle')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/join-us"
              className="inline-flex items-center gap-2 bg-yellow-300 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-yellow-200 transition-all transform hover:scale-105"
            >
              {t('joinUs.joinNow')}
              <ArrowRight className="h-3 w-3" />
            </Link>
            <a
              href="https://discord.gg/mHtThpN8bT"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-yellow-200 hover:text-yellow-100 underline transition-colors"
            >
              {t('joinUs.discord')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinUsStrip
