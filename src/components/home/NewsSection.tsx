import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Card, CardImage, CardContent } from '../ui/Card'
import { useTranslation } from 'react-i18next'
import { news } from '../../data/news'
import { formatDate, truncateText } from '../../lib/utils'

const NewsSection: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('news.title')}
          </h2>
          <a
            href="/news"
            className="text-primary-600 hover:text-primary-700 flex items-center font-medium transition-colors"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.slice(0, 6).map((item) => (
            <Card key={item.id} hoverable className="h-full flex flex-col">
              <CardImage src={item.imageUrl} alt={item.title} />
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-800">
                    {item.category.charAt(0).toUpperCase() +
                      item.category.slice(1)}
                  </span>
                  <span className="text-gray-800 text-sm ml-2">
                    {formatDate(new Date(item.date))}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-800 mb-4 flex-1">
                  {truncateText(item.excerpt, 100)}
                </p>
                <a
                  href={`/news/${item.id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center mt-auto transition-colors"
                >
                  Read More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
