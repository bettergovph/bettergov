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

/**
 * Curated slugs for the landing page's quick links.
 *
 * Slugs rather than display names because display names get edited and
 * slugs are stable URLs — renaming "Education" would silently break a
 * display-name lookup, which is exactly what this replaced.
 *
 * These pairs are asserted against the committed taxonomy by the routing
 * contract in src/components/__tests__/ServicesRoutingContract.test.tsx.
 */
const CERTIFICATES_IDS = 'certificates-ids';
const BUSINESS_TRADE = 'business-trade';

interface HeroLink {
  category: string;
  subcategory?: string;
}

const hrefFor = ({ category, subcategory }: HeroLink) =>
  subcategory
    ? `/services?category=${category}&subcategory=${subcategory}`
    : `/services?category=${category}`;

/** The three quick-link chips under the search box. */
const POPULAR_SERVICES: (HeroLink & { labelKey: string })[] = [
  {
    labelKey: 'hero.nationalId',
    category: CERTIFICATES_IDS,
    subcategory: 'id',
  },
  {
    labelKey: 'hero.birthCertificate',
    category: CERTIFICATES_IDS,
    subcategory: 'certificates',
  },
  {
    labelKey: 'hero.businessRegistration',
    category: BUSINESS_TRADE,
    subcategory: 'business-registration',
  },
];

/**
 * The four tiles in the "Popular Services" card. Labels are short curated
 * strings, deliberately not the taxonomy's category names ("Business" vs
 * "Business and Trade"), and icons have no CMS equivalent — both are
 * presentation choices that stay in code permanently, unlike the slugs.
 */
const SERVICE_TILES: (HeroLink & { label: string; icon: LucideIcon })[] = [
  { label: 'Citizenship & ID', icon: UserIcon, category: CERTIFICATES_IDS },
  { label: 'Business', icon: BriefcaseIcon, category: BUSINESS_TRADE },
  { label: 'Education', icon: GraduationCapIcon, category: 'education' },
  { label: 'Health', icon: ActivityIcon, category: 'health' },
];

const Hero: FC = () => {
  const { t } = useTranslation('common');

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
              {POPULAR_SERVICES.map(service => (
                <Link
                  key={service.labelKey}
                  to={hrefFor(service)}
                  className='rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20 max-md:px-3 max-md:py-1.5 max-md:text-[13px]'
                >
                  {t(service.labelKey)}
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
                  to={hrefFor(tile)}
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
