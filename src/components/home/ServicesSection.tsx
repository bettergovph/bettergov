import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import serviceCategories from '../../data/service_categories.json';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

const ServicesSection: React.FC = () => {
  const { t } = useTranslation('common');

  // Show only first 12 categories
  const displayedCategories = serviceCategories.categories.slice(
    0,
    12
  ) as Category[];

  return (
    <section className='py-16 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            {t('services.governmentServices')}
          </h2>
          <p className='text-gray-700 max-w-3xl mx-auto text-lg leading-relaxed'>
            {t('services.description')}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {displayedCategories.map(category => (
            <Card
              key={category.slug}
              hoverable
              className='h-full bg-white border-gray-200'
            >
              <CardContent className='p-8 flex flex-col h-full'>
                <h3 className='text-xl font-semibold text-white mb-6 bg-primary-600 px-4 py-3 rounded-md'>
                  {category.category}
                </h3>

                <ul className='space-y-3 flex-grow'>
                  {category.subcategories.slice(0, 4).map(subcategory => (
                    <li key={subcategory.slug} className='flex items-center'>
                      <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0'></span>
                      <Link
                        to={`/services?category=${category.slug}&subcategory=${subcategory.slug}`}
                        className='text-gray-700 hover:text-primary-600 focus:text-primary-600 focus:outline-none transition-colors duration-200 block py-2 flex-grow leading-relaxed'
                      >
                        {subcategory.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className='mt-auto pt-4 border-t border-gray-100'>
                  <Link
                    to={`/services?category=${category.slug}`}
                    className='text-primary-600 hover:text-primary-700 focus:text-primary-700 focus:outline-none font-medium transition-all duration-200 text-base inline-flex items-center group rounded-md px-2 py-1'
                  >
                    {t('services.viewAllCategory')} {category.category}
                    <ArrowRight
                      className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200'
                      aria-hidden='true'
                    />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='text-center mt-12'>
          <Link
            to='/services'
            className='inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 px-8 py-4 bg-primary-600 text-white hover:bg-primary-700 focus:bg-primary-700 focus:outline-none text-base min-w-[160px]'
            aria-label={`${t('services.viewAll')} services`}
          >
            {t('services.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
