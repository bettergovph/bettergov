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
    <section className='bg-ed-navy-2 py-12 text-white md:py-24'>
      <Container>
        <div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-2'>
          {/* Left: headline, search, and quick links */}
          <div className='animate-fade-in'>
            <h1 className='mb-4 font-serif-ed text-3xl font-bold leading-tight md:text-4xl lg:text-5xl'>
              {t('hero.title')}
            </h1>
            <p className='mb-8 max-w-lg font-sans-ed text-lg text-blue-200'>
              {t('hero.subtitle')}
            </p>
            <div className='mb-8'>
              <MeilisearchInstantSearch />
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {popularServices.map(service => (
                <Link
                  key={service.label}
                  to={service.href}
                  className='rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20'
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: popular services card */}
          <div className='animate-slide-in rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur-xs'>
            <h2 className='mb-4 font-serif-ed text-2xl font-bold'>
              {t('services.title')}
            </h2>
            <div className='grid grid-cols-2 gap-4'>
              {SERVICE_TILES.map(tile => (
                <Link
                  key={tile.label}
                  to={`/services?category=${findCategorySlug(tile.category)}`}
                  className='flex flex-col items-center rounded-lg bg-white/10 p-4 text-center transition-colors duration-200 hover:bg-white/20'
                >
                  <div className='mb-3 rounded-full bg-primary-500 p-3'>
                    <tile.icon className='h-6 w-6 text-white' />
                  </div>
                  <span className='font-medium'>{tile.label}</span>
                </Link>
              ))}
            </div>
            <Link
              to='/services'
              className='mt-4 block w-full rounded-lg bg-white/10 p-4 text-center transition-colors duration-200 hover:bg-white/20'
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
