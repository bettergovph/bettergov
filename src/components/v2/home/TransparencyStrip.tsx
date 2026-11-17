import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, DownloadIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import { BUDGET_2026 } from './data';

const TransparencyStrip: FC = () => {
  const { t } = useTranslation('home');
  const total = 6352;

  return (
    <section className='mt-20 border-y border-ed-navy bg-ed-paper-2 py-[60px] max-md:mt-8 max-md:py-6'>
      <Container>
        <div className='mb-8 max-md:mb-4'>
          <SectionHeader
            label={t('transparency.label')}
            meta={
              <Link
                to='/flood-control-projects'
                className='no-underline text-ed-navy hover:text-ed-red'
              >
                {t('transparency.portal')}
              </Link>
            }
          />
        </div>

        <div className='grid grid-cols-[1fr_1.4fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-5'>
          <div>
            <Eyebrow>{t('transparency.eyebrow')}</Eyebrow>
            <h2 className='mt-2 font-serif-ed text-[clamp(36px,4vw,48px)] font-bold leading-none tracking-[-0.02em] text-ed-ink max-md:text-[30px]'>
              ₱{total.toLocaleString()}
              <span className='text-2xl text-ed-ink-3'>
                {' '}
                {t('transparency.totalSuffix')}
              </span>
            </h2>
            <p className='mt-4 max-w-[420px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-md:mt-2.5 max-md:text-[14px] max-md:leading-snug'>
              {t('transparency.description')}
            </p>
            <div className='mt-6 flex flex-wrap gap-3 max-md:mt-4'>
              <Button as={Link} to='/flood-control-projects'>
                <ArrowRightIcon size={14} />
                <span>{t('transparency.explore')}</span>
              </Button>
              <Button as='a' href='#' variant='ghost'>
                <DownloadIcon size={14} />
                <span>{t('transparency.download')}</span>
              </Button>
            </div>
          </div>

          <div>
            <div className='border-y border-ed-navy'>
              {BUDGET_2026.map(b => (
                <div
                  key={b.dept}
                  className='grid grid-cols-[minmax(140px,200px)_1fr_60px_48px] items-center gap-4 border-b border-ed-rule py-3.5 last:border-b-0 max-md:grid-cols-[minmax(100px,140px)_1fr_52px_40px] max-md:gap-2.5 max-md:py-2.5'
                >
                  <div className='font-serif-ed text-base max-md:text-[14px]'>
                    {b.dept}
                  </div>
                  <div className='relative h-2 bg-ed-paper-3'>
                    <div
                      className='absolute inset-y-0 left-0 bg-ed-navy'
                      style={{ width: `${Math.min(b.pct * 5, 100)}%` }}
                    />
                  </div>
                  <div className='font-mono-ed text-[13px] font-medium'>
                    ₱{b.amount}B
                  </div>
                  <div className='text-right font-mono-ed text-[11px] text-ed-ink-3'>
                    {b.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TransparencyStrip;
