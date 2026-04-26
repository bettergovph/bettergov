import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import MeilisearchInstantSearch from '../search/MeilisearchInstantSearch';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Briefcase,
  GraduationCap,
  HeartPulse,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import serviceCategories from '../../data/service_categories.json';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

const Hero: FC = () => {
  const { t } = useTranslation('common');

  // Find categories and subcategories by their names to get slugs
  const findCategorySlug = (categoryName: string) => {
    return (
      (serviceCategories.categories as Category[]).find(
        cat => cat.category === categoryName
      )?.slug || ''
    );
  };

  const findSubcategorySlug = (
    categoryName: string,
    subcategoryName: string
  ) => {
    const category = (serviceCategories.categories as Category[]).find(
      cat => cat.category === categoryName
    );
    return (
      category?.subcategories.find(sub => sub.name === subcategoryName)?.slug ||
      ''
    );
  };

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
  ];

  return (
    <div className='relative min-h-[600px] lg:min-h-[700px] flex items-center bg-primary-900 text-white overflow-hidden'>
      {/* Background Layer */}
      <div
        className='absolute inset-0 z-0 opacity-40 scale-110 animate-slow-zoom'
        style={{
          backgroundImage: 'url(/hero-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className='absolute inset-0 bg-linear-to-r from-primary-950 via-primary-900/80 to-transparent z-10' />

      {/* Content Container */}
      <div className='container mx-auto px-4 relative z-20 py-12 md:py-24'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          {/* Left section: Text and Search */}
          <div className='lg:col-span-7 animate-fade-in'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight'>
              {t('hero.title')
                .split(' ')
                .map((word, i) => (
                  <span key={i} className={i === 0 ? 'text-blue-400' : ''}>
                    {word}{' '}
                  </span>
                ))}
            </h1>

            <p className='text-lg md:text-xl text-blue-100/80 mb-10 max-w-xl leading-relaxed'>
              {t('hero.subtitle')}
            </p>

            <div className='mb-6 max-w-2xl'>
              <MeilisearchInstantSearch />
            </div>

            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-sm font-medium text-blue-200/60 flex items-center'>
                <TrendingUp className='h-4 w-4 mr-2' />
                Popular:
              </span>
              {popularServices.map(service => (
                <Link
                  key={service.label}
                  className='bg-white/5 backdrop-blur-sm text-white border border-white/10 hover:bg-white/20 hover:border-white/30 py-1.5 px-4 rounded-full text-sm transition-all duration-300'
                  to={service.href}
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right section: Quick Access Widgets */}
          <div className='lg:col-span-5'>
            <div className='grid grid-cols-2 gap-4 animate-slide-up'>
              <QuickAccessCard
                to={`/services?category=${findCategorySlug(
                  'Certificates and IDs'
                )}`}
                icon={<UserCheck className='h-6 w-6' />}
                title='Citizenship & ID'
                description='IDs and Certificates'
              />
              <QuickAccessCard
                to={`/services?category=${findCategorySlug(
                  'Business and Trade'
                )}`}
                icon={<Briefcase className='h-6 w-6' />}
                title='Business'
                description='Registration & Permits'
              />
              <QuickAccessCard
                to={`/services?category=${findCategorySlug('Education')}`}
                icon={<GraduationCap className='h-6 w-6' />}
                title='Education'
                description='Schools & Scholarships'
              />
              <QuickAccessCard
                to={`/services?category=${findCategorySlug('Health')}`}
                icon={<HeartPulse className='h-6 w-6' />}
                title='Health'
                description='Medical & Insurance'
              />

              <Link
                to='/services'
                className='col-span-2 group mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-lg shadow-blue-900/20'
              >
                <div>
                  <span className='block font-bold text-lg'>
                    View All Services
                  </span>
                  <span className='text-sm text-blue-100'>
                    Browse the complete directory
                  </span>
                </div>
                <div className='bg-white/20 p-2 rounded-full group-hover:translate-x-2 transition-transform'>
                  <ArrowRight className='h-6 w-6' />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuickAccessCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const QuickAccessCard: FC<QuickAccessCardProps> = ({
  to,
  icon,
  title,
  description,
}) => (
  <Link
    to={to}
    className='group bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/30 rounded-2xl p-5 transition-all duration-500 hover:bg-white/10 hover:-translate-y-1'
  >
    <div className='bg-blue-500/20 p-3 rounded-xl mb-4 w-fit group-hover:bg-blue-500/30 transition-colors text-blue-400'>
      {icon}
    </div>
    <span className='block font-bold text-sm md:text-lg mb-1 group-hover:text-blue-400 transition-colors'>
      {title}
    </span>
    <p className='text-xs text-blue-100/60 leading-tight tracking-tight md:tracking-wide'>
      {description}
    </p>
  </Link>
);

export default Hero;
