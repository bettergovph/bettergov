import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container';

const AlertBanner: FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className='bg-ed-red py-2 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-white'>
      <Container className='flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-1 max-md:text-[10px]'>
        <span>
          <strong>{t('masthead.advisory', 'Advisory')}</strong>
          &nbsp;·&nbsp;{' '}
          {t(
            'masthead.advisoryText',
            'Class suspensions & typhoon updates live from PAGASA & NDRRMC'
          )}
        </span>
        <Link to='/philippines/hotlines' className='text-white underline'>
          {t('masthead.viewAdvisories', 'View all advisories →')}
        </Link>
      </Container>
    </div>
  );
};

export default AlertBanner;
