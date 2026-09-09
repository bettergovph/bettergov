import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ActivityIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  LucideIcon,
  UserIcon,
} from 'lucide-react';
import Container from '../ui/Container';
import MeilisearchInstantSearch from '../../search/MeilisearchInstantSearch';
import serviceCategories from '../../../data/service_categories.json';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  category: string;
  slug: string;
  subcategories: Subcategory[];
}

const categories = serviceCategories.categories as Category[];

const findCategorySlug = (categoryName: string) =>
  categories.find(cat => cat.category === categoryName)?.slug || '';

const findSubcategorySlug = (categoryName: string, subcategoryName: string) =>
  categories
    .find(cat => cat.category === categoryName)
    ?.subcategories.find(sub => sub.name === subcategoryName)?.slug || '';

/** The four service tiles shown in the "Popular Services" card. */
const SERVICE_TILES: { label: string; icon: LucideIcon; category: string }[] = [
  {
    label: 'Citizenship & ID',
    icon: UserIcon,
    category: 'Certificates and IDs',
  },
  { label: 'Business', icon: BriefcaseIcon, category: 'Business and Trade' },
  { label: 'Education', icon: GraduationCapIcon, category: 'Education' },
  { label: 'Health', icon: ActivityIcon, category: 'Health' },
];

const Hero: FC = () => {
  const { t } = useTranslation('common');

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
    <section className='bg-ed-navy-2 py-16 text-white max-md:py-7'>
      <Container>
        <div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-2 max-md:gap-5'>
          {/* Left: headline, search, and quick links */}
          <div className='animate-fade-in'>
            <h1 className='mb-4 font-serif-ed text-3xl font-bold leading-none md:text-4xl lg:text-5xl max-md:mb-2.5 max-md:text-[26px]'>
              {t('hero.title')}
            </h1>
            <p className='mb-8 max-w-lg font-sans-ed text-lg text-blue-200 max-md:mb-4 max-md:text-[15px] max-md:leading-snug'>
              {t('hero.subtitle')}
            </p>
            <div className='mb-8 max-md:mb-3'>
              <MeilisearchInstantSearch />
            </div>
            <div className='mt-4 flex flex-wrap gap-2 max-md:mt-0 max-md:gap-1.5'>
              {popularServices.map(service => (
                <Link
                  key={service.label}
                  to={service.href}
                  className='rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20 max-md:px-3 max-md:py-1.5 max-md:text-[13px]'
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: popular services card */}
          <div className='animate-slide-in rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-xs max-md:p-3.5'>
            <h2 className='mb-4 font-serif-ed text-2xl font-bold max-md:mb-2.5 max-md:text-lg'>
              {t('services.title')}
            </h2>
            <div className='grid grid-cols-2 gap-4 max-md:gap-2'>
              {SERVICE_TILES.map(tile => (
                <Link
                  key={tile.label}
                  to={`/services?category=${findCategorySlug(tile.category)}`}
                  className='flex flex-col items-center rounded-lg bg-white/10 p-4 text-center transition-colors duration-200 hover:bg-white/20 max-md:flex-row max-md:gap-2.5 max-md:p-2.5 max-md:text-left'
                >
                  <div className='mb-3 rounded-full bg-primary-500 p-3 max-md:mb-0 max-md:p-2'>
                    <tile.icon className='h-6 w-6 text-white max-md:h-4 max-md:w-4' />
                  </div>
                  <span className='font-medium max-md:text-[13px] max-md:leading-tight'>
                    {tile.label}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              to='/services'
              className='mt-4 block w-full rounded-lg bg-white/10 p-4 text-center transition-colors duration-200 hover:bg-white/20 max-md:mt-2 max-md:p-2.5 max-md:text-sm'
            >
              View All Services
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
