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
 * Slugs rather than display names because display names are editable in
 * TalaCMS and slugs are not — a CMS rename of "Education" would silently
 * break a display-name lookup, which is exactly what this replaced.
 *
 * These pairs are asserted against the generated taxonomy by the routing
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
    <section className='bg-ed-navy-2 py-16 text-white'>
      <Container>
        <div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-2'>
          {/* Left: headline, search, and quick links */}
          <div className='animate-fade-in'>
            <h1 className='mb-4 font-serif-ed text-3xl font-bold leading-none md:text-4xl lg:text-5xl'>
              {t('hero.title')}
            </h1>
            <p className='mb-8 max-w-lg font-sans-ed text-lg text-blue-200'>
              {t('hero.subtitle')}
            </p>
            <div className='mb-8'>
              <MeilisearchInstantSearch />
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {POPULAR_SERVICES.map(service => (
                <Link
                  key={service.labelKey}
                  to={hrefFor(service)}
                  className='rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20'
                >
                  {t(service.labelKey)}
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
                  to={hrefFor(tile)}
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
