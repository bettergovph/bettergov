import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
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
    };

    const Icon = LucideIcons[iconMap[category] || 'FileText'];
    return Icon ? <Icon className='h-6 w-6' /> : null;
  };

  // Show only first 12 categories
  const displayedCategories = serviceCategories.categories.slice(
    0,
    12
  ) as Category[];

  return (
    <section className='py-12 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-2xl md:text-3xl font-bold text-gray-900 mb-4'>
            {t('services.governmentServices')}
          </h2>
          <p className='text-gray-800 max-w-2xl mx-auto'>
            {t('services.description')}
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {displayedCategories.map(category => (
            <Card
              key={category.slug}
              hoverable
              className='hover:border-primary-500 border-primary-200 group border-t-4 flex flex-col h-full'
            >
              <CardHeader className='flex gap-3 items-center p-4 md:p-4'>
                <div className='bg-primary-50 text-primary-600 p-3 rounded-md self-start transition-colors group-hover:bg-primary-500 group-hover:text-white'>
                  {getIcon(category.category)}
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {category.category}
                </h3>
              </CardHeader>

              <CardContent className='h-full flex flex-col justify-between p-0 md:p-0'>
                <div>
                  <ul className='flex-grow divide-y border-b'>
                    {category.subcategories.slice(0, 3).map(subcategory => (
                      <li key={subcategory.slug}>
                        <Link
                          to={`/services?category=${category.slug}&subcategory=${subcategory.slug}`}
                          className='flex items-center justify-between gap-2 text-gray-800 hover:text-primary-600 transition-colors text-md flex items-center px-4 py-2 hover:bg-primary-50'
                        >
                          {subcategory.name}
                          <LucideIcons.ChevronRightIcon className='ml-1 h-4 w-4 text-black/20' />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Link
                    to={`/services?category=${category.slug}`}
                    className='mt-auto justify-between text-primary-600 hover:text-primary-700 font-medium transition-colors inline-flex items-center px-4 py-2 w-full hover:bg-primary-500 hover:text-white'
                  >
                    {t('services.viewAllCategory')}
                    <LucideIcons.ChevronRightIcon className='ml-1 h-4 w-4' />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='text-center mt-8'>
          <Link
            to='/services'
            className='inline-flex group gap-3 items-center justify-center rounded-xl font-semibold transition-colors px-8 py-4 bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm'
          >
            {t('services.viewAll')}
            <div className='group-hover:translate-x-1 transition-all'>
              <LucideIcons.ArrowRight size={18} />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
