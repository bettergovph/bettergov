import React from 'react'
import { useTranslation } from 'react-i18next'
import MeilisearchInstantSearch from '../search/MeilisearchInstantSearch'
import { Link } from 'react-router-dom'
import serviceCategories from '../../data/service_categories.json'

interface Subcategory {
  name: string
  slug: string
}

interface Category {
  category: string
  slug: string
  subcategories: Subcategory[]
}

const Hero: React.FC = () => {
  const { t } = useTranslation('common')

  // Find categories and subcategories by their names to get slugs
  const findCategorySlug = (categoryName: string) => {
    return (
      (serviceCategories.categories as Category[]).find(
        (cat) => cat.category === categoryName
      )?.slug || ''
    )
  }

  const findSubcategorySlug = (
    categoryName: string,
    subcategoryName: string
  ) => {
    const category = (serviceCategories.categories as Category[]).find(
      (cat) => cat.category === categoryName
    )
    return (
      category?.subcategories.find((sub) => sub.name === subcategoryName)
        ?.slug || ''
    )
  }

  const popularServices = [
    {
      label: t('hero.nationalId'),
      href: `/services?category=${findCategorySlug(
        'Certificates and IDs'
      )}&subcategory=${findSubcategorySlug('Certificates and IDs', 'ID')}`,
    },
    {
      label: t('hero.birthCertificate'),
      href: `/services?category=${findCategorySlug(
        'Certificates and IDs'
      )}&subcategory=${findSubcategorySlug(
        'Certificates and IDs',
        'Certificates'
      )}`,
    },
    {
      label: t('hero.businessRegistration'),
      href: `/services?category=${findCategorySlug(
        'Business and Trade'
      )}&subcategory=${findSubcategorySlug(
        'Business and Trade',
        'Business Registration, Certificates and Compliance'
      )}`,
    },
  ]

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left section with title and search */}
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-blue-200 mb-8 max-w-lg">
              {t('hero.subtitle')}
            </p>
            {/* Meilisearch component will be full width and include its own styling */}
            {/* The background of Hero is dark, MeilisearchInstantSearch has a light theme by default */}
            {/* Consider adjusting MeilisearchInstantSearch styles or Hero background for better blending */}
            <div className="mb-8">
              <MeilisearchInstantSearch />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {popularServices.map((service) => (
                <Link
                  key={service.label}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 py-2 px-4 rounded-xl text-sm"
                  to={service.href}
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right section with quick access services */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg animate-slide-in">
            <h2 className="text-2xl font-semibold mb-4">
              {t('services.title')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to={`/services?category=${findCategorySlug(
                  'Certificates and IDs'
                )}`}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className="bg-primary-500 p-3 rounded-full mb-3">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span className="font-medium">Citizenship & ID</span>
              </Link>
              <Link
                to={`/services?category=${findCategorySlug(
                  'Business and Trade'
                )}`}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className="bg-primary-500 p-3 rounded-full mb-3">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="7"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <span className="font-medium">Business</span>
              </Link>
              <Link
                to={`/services?category=${findCategorySlug('Education')}`}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className="bg-primary-500 p-3 rounded-full mb-3">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                  </svg>
                </div>
                <span className="font-medium">Education</span>
              </Link>
              <Link
                to={`/services?category=${findCategorySlug('Health')}`}
                className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-all duration-500 flex flex-col items-center text-center"
              >
                <div className="bg-primary-500 p-3 rounded-full mb-3">
                  <svg
                    className="h-6 w-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <span className="font-medium">Health</span>
              </Link>
            </div>
            <div className="mt-4 flex">
              <Link
                className="bg-white/10 text-white hover:bg-white/20 transition-all duration-500 w-full rounded-lg p-4 text-center"
                to="/services"
              >
                View All Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
