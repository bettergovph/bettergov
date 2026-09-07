import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import { serviceCategories, services, type Category } from '../../../data/cms';

/** Service counts per category slug, read straight from the service files. */
const countBySlug: Record<string, number> = Object.fromEntries(
  Object.entries(services).map(([slug, records]) => [slug, records.length])
);

// The first 12 are the real service domains; "uncategorized" sorts last and
// is not a browsable category.
const CATEGORIES = (serviceCategories.categories as Category[])
  .filter(c => c.slug !== 'uncategorized')
  .slice(0, 12);

const Categories: FC = () => {
  const { t } = useTranslation('home');

  const total = useMemo(
    () => CATEGORIES.reduce((sum, c) => sum + (countBySlug[c.slug] ?? 0), 0),
    []
  );

  return (
    <section className='mt-16'>
      <Container>
        <SectionHeader
          label={t('categories.label')}
          meta={t('categories.meta', {
            count: total,
            domains: CATEGORIES.length,
          })}
        />
        <div className='grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'>
          {CATEGORIES.map(c => (
            <Link
              key={c.slug}
              to={`/services?category=${c.slug}`}
              className='relative block min-h-[180px] border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors hover:border-ed-ink'
            >
              <h3 className='font-serif-ed text-2xl font-bold text-ed-ink'>
                {c.category}
              </h3>
              <p className='mt-2.5 text-[13px] leading-normal text-ed-ink-2'>
                {c.subcategories
                  .slice(0, 3)
                  .map(s => s.name)
                  .join(', ')}
              </p>
              <div className='mt-4 flex items-center gap-1.5 text-xs font-medium text-ed-navy'>
                {t('categories.explore')} <ArrowRightIcon size={14} />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Categories;
