import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Notice from '../ui/Notice';
import ArrowLink from '../ui/ArrowLink';

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
    <Notice
      role='status'
      tag={t('newsComingSoon.tag', 'Coming soon')}
      title={t('newsComingSoon.title', 'News is coming soon')}
      className={className}
    >
      <p className='mt-2 max-w-[560px] font-sans-ed text-[15px] leading-relaxed text-ed-ink-2 max-md:text-sm'>
        {t(
          'newsComingSoon.body',
          'Our news feed is under maintenance while we set it up for BetterGov.ph. In the meantime, you can read the latest government news on the Philippine News Agency website.'
        )}
      </p>
      <ArrowLink to={PNA_URL} external className='mt-4'>
        {t('newsComingSoon.link', 'Go to the Philippine News Agency')}
      </ArrowLink>
    </Notice>
  );
};

export default NewsComingSoon;
