import React from 'react'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import serviceCategories from '../../data/service_categories.json'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface Subcategory {
  name: string
  slug: string
}

interface Category {
  category: string
  slug: string
  subcategories: Subcategory[]
}

const ServicesSection: React.FC = () => {
  const { t } = useTranslation('common')

  const getIcon = (category: string) => {
    const iconMap: { [key: string]: keyof typeof LucideIcons } = {
      'Business and Trade': 'Building2',
      'Certificates and IDs': 'FileCheck',
      Contributions: 'Wallet',
      'Disaster and Weather': 'Cloud',
      Education: 'GraduationCap',
      Employment: 'Briefcase',
      Health: 'Heart',
      Housing: 'Home',
      'Passport and Travel': 'Plane',
      'Social Services': 'Users',
      Tax: 'Receipt',
      'Transport and Driving': 'Car',
    }

    const Icon = LucideIcons[iconMap[category] || 'FileText']
    return Icon ? <Icon className="h-6 w-6" /> : null
  }

  // Show only first 12 categories
  const displayedCategories = serviceCategories.categories.slice(
    0,
    12
  ) as Category[]

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {t('services.governmentServices')}
          </h2>
          <p className="text-gray-800 max-w-2xl mx-auto">
            {t('services.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedCategories.map((category) => (
            <Card
              key={category.slug}
              hoverable
              className="border-t-4 border-primary-500"
            >
              <CardContent className="flex flex-col h-full p-6">
                <div className="flex gap-2">
                  <div className="bg-primary-100 text-primary-600 p-3 rounded-md mb-4 self-start">
                    {getIcon(category.category)}
                  </div>

                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    {category.category}
                  </h3>
                </div>

                <ul className="space-y-2 mb-6 flex-grow">
                  {category.subcategories.slice(0, 3).map((subcategory) => (
                    <li key={subcategory.slug}>
                      <Link
                        to={`/services?category=${category.slug}&subcategory=${subcategory.slug}`}
                        className="text-gray-800 hover:text-primary-600 transition-colors text-md flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></span>
                        {subcategory.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/services?category=${category.slug}`}
                  className="mt-auto text-primary-600 hover:text-primary-700 font-medium transition-colors inline-flex items-center"
                >
                  {t('services.viewAllCategory')} {category.category}
                  <LucideIcons.ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/services"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors px-6 py-3 bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
          >
            {t('services.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
