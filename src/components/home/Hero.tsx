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

            <div className='flex flex-wrap items-center gap-2 sm:gap3'>
              <span className='max-sm:hidden text-sm font-medium text-blue-200/60 flex items-center'>
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
                className='col-span-2 group mt-2 bg-blue-600 text-white rounded-2xl p-5 flex items-center justify-between transition-all duration-300 shadow-lg shadow-blue-900/20 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-700 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.4),inset_0_-4px_4px_rgba(0,0,0,0.2),0_12px_20px_-5px_rgba(29,78,216,0.6)] hover:border-blue-400/50 active:translate-y-1 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.5),0_2px_4px_rgba(29,78,216,0.4)]'
              >
                <div>
                  <span className='block font-bold text-lg group-hover:drop-shadow-md transition-all'>
                    View All Services
                  </span>
                  <span className='text-sm text-blue-100 group-hover:drop-shadow-sm transition-all'>
                    Browse the complete directory
                  </span>
                </div>

                {/* Made the arrow container look recessed/engraved on hover to match the tactile feel */}
                <div className='bg-white/20 p-2 rounded-full transition-all duration-300 group-hover:translate-x-2 group-hover:bg-blue-800/40 group-hover:shadow-[inset_0_3px_5px_rgba(0,0,0,0.4),0_1px_1px_rgba(255,255,255,0.3)]'>
                  <ArrowRight className='h-6 w-6 group-hover:drop-shadow-sm' />
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
    className='group bg-white/15 backdrop-blur-lg border border-white/20 hover:border-white/40 rounded-2xl p-5 transition-all duration-500 hover:bg-white/5 hover:-translate-y-1'
  >
    <div className='bg-blue-500/20 p-3 rounded-xl mb-4 w-fit group-hover:bg-blue-500/30 transition-colors text-blue-400 group-hover:text-blue-300'>
      {icon}
    </div>
    <span className='block font-bold text-sm md:text-lg mb-1 group-hover:text-blue-400 transition-colors'>
      {title}
    </span>
    <p className='text-xs text-white/90 leading-tight tracking-tight md:tracking-wide'>
      {description}
    </p>
  </Link>
);

export default Hero;
