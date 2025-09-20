import React from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CheckCircle2,
} from 'lucide-react'
import { footerNavigation } from '../../data/navigation'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Footer: React.FC = () => {
  const { t } = useTranslation('common')

  const getSocialIcon = (label: string) => {
    switch (label) {
      case 'Facebook':
        return <Facebook className="h-5 w-5" />
      case 'Twitter':
        return <Twitter className="h-5 w-5" />
      case 'Instagram':
        return <Instagram className="h-5 w-5" />
      case 'YouTube':
        return <Youtube className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-12 w-12 mr-3" />
              {/* <img
                src="/ph-logo.webp"
                alt="Philippines Coat of Arms"
                className="h-12 w-12 mr-3"
              /> */}

              <div>
                <div className="font-bold">Better Philippines</div>
                <div className="text-xs text-gray-400">BetterGov.ph Portal</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              A community portal providing Philippine citizens, businesses, and
              visitors with information and services.
            </p>
            <div className="flex space-x-4">
              {footerNavigation.socialLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {footerNavigation.mainSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-center my-24">
          <p className="text-white text-sm md:text-lg bg-gray-800 p-4 px-12 md:px-8 rounded-full border border-gray-700">
            Cost to build this site to date:{' '}
            <span className="animate-pulse text-red-500">₱3,000</span>. Cost to
            the People of the Philippines:{' '}
            <span className="text-green-500">₱0</span>.
          </p>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6">
              {/* <a
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Use
              </a> */}
              <Link
                to="https://github.com/bettergovph/bettergov"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Contribute at GitHub
              </Link>
              <Link
                to="/sitemap"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Sitemap
              </Link>
              <a
                href="/accessibility"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
