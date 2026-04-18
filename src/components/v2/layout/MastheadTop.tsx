import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MastheadTop: FC = () => {
  const { t } = useTranslation('common');

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  return (
    <div className='flex items-center justify-between border-b border-ed-rule py-2.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3 max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:py-2 max-md:text-[10px]'>
      <div className='flex items-center gap-4 max-md:flex-wrap max-md:gap-2'>
        <span>{today}</span>
        <span className='text-ed-rule-strong'>|</span>
        <span className='inline-flex items-center gap-1.5'>
          {t('masthead.manila', 'Manila')}, 29°C
          <span className='inline-block h-1.5 w-1.5 rounded-full bg-ed-sage' />
        </span>
      </div>
      <div className='flex items-center gap-4 max-md:flex-wrap max-md:gap-2'>
        <Link
          to='/contact'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.contact', 'Contact')}
        </Link>
        <span className='text-ed-rule-strong'>|</span>
        <Link
          to='/accessibility'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.accessibility', 'Accessibility')}
        </Link>
        <span className='text-ed-rule-strong'>|</span>
        <a
          href='https://about.bettergov.ph'
          target='_blank'
          rel='noreferrer'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.about', 'About')}
        </a>
      </div>
    </div>
  );
};

export default MastheadTop;
