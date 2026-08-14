import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';

type CategoryItem = {
  id: string;
  label: string;
  count: number;
  desc: string;
};

const Categories: FC = () => {
  const { t } = useTranslation('home');
  const items = t('categories.items', {
    returnObjects: true,
  }) as CategoryItem[];
  const total = items.reduce((s, c) => s + c.count, 0);

  return (
    <section className='mt-16'>
      <Container>
        <SectionHeader
          label={t('categories.label')}
          meta={t('categories.meta', { count: total, domains: items.length })}
        />
        <div className='grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'>
          {items.map(c => (
            <Link
              key={c.id}
              to={`/services?category=${c.id}`}
              className='relative block min-h-[180px] border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors hover:border-ed-ink'
            >
              <div className='flex items-baseline justify-end'>
                <span className='font-mono-ed text-[10px] tracking-[0.14em] text-ed-ink-3'>
                  {c.count} services
                </span>
              </div>
              <h3 className='mt-5 font-serif-ed text-2xl font-bold text-ed-ink'>
                {c.label}
              </h3>
              <p className='mt-2.5 text-[13px] leading-normal text-ed-ink-2'>
                {c.desc}
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
