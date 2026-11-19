import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Eyebrow from '../ui/Eyebrow';
import ArrowLink from '../ui/ArrowLink';
import { cn } from '../../../lib/utils';

/** The Philippine News Agency, for government news in the meantime. */
const PNA_URL = 'https://www.pna.gov.ph';

type Props = {
  className?: string;
};

/**
 * Shown wherever news should appear while the e.gov.ph news feed can't be
 * reached, in place of a raw error: the feed is under maintenance, and the
 * Philippine News Agency has government news in the meantime.
 */
const NewsComingSoon: FC<Props> = ({ className }) => {
  const { t } = useTranslation('common');

  return (
    <div
      role='status'
      className={cn(
        'border-l-4 border-ed-navy bg-ed-paper-2 p-6 max-md:p-5',
        className
      )}
    >
      <Eyebrow tone='navy'>{t('newsComingSoon.tag', 'Coming soon')}</Eyebrow>
      <p className='mt-2 font-serif-ed text-[22px] font-semibold leading-snug text-ed-ink max-md:text-lg'>
        {t('newsComingSoon.title', 'News is coming soon')}
      </p>
      <p className='mt-2 max-w-[560px] font-sans-ed text-[15px] leading-relaxed text-ed-ink-2 max-md:text-sm'>
        {t(
          'newsComingSoon.body',
          'Our news feed is under maintenance while we set it up for BetterGov.ph. In the meantime, you can read the latest government news on the Philippine News Agency website.'
        )}
      </p>
      <ArrowLink to={PNA_URL} external className='mt-4'>
        {t('newsComingSoon.link', 'Go to the Philippine News Agency')}
      </ArrowLink>
    </div>
  );
};

export default NewsComingSoon;
