import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';

type Item = { n: string; heading: string; body: string };

const EditorialStrip: FC = () => {
  const { t } = useTranslation('home');
  const items = t('editorial.items', { returnObjects: true }) as Item[];

  return (
    <section className='my-20'>
      <Container>
        <SectionHeader label={t('editorial.label')} />
        <div className='grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]'>
          {items.map(x => (
            <div key={x.n} className='border-l border-ed-ink pl-6 pr-4'>
              <div className='font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-3'>
                {x.n}
              </div>
              <h3 className='mt-3 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-ink'>
                {x.heading}
              </h3>
              <p className='mt-3 text-sm leading-relaxed text-ed-ink-2'>
                {x.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default EditorialStrip;
