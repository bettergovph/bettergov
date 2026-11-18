import { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import Flag from '../ui/Flag';
import { ABOUT_URL } from '../../../lib/brand';

/**
 * Banner at the very top of every page: the site is in beta, and it is built
 * by volunteers of the BetterGov.ph movement, with a link to learn more about
 * BetterGov on about.bettergov.ph.
 */
const PhaseBanner: FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className='bg-ed-navy-2 text-white'>
      <Container className='flex items-start gap-3 py-2 font-sans-ed text-[13px] leading-snug md:items-center max-md:text-[12px]'>
        <Flag className='shrink-0 border-white bg-white font-semibold text-ed-navy-2'>
          {t('phaseBanner.tag', 'Beta')}
        </Flag>
        <p className='m-0'>
          <Trans
            t={t}
            i18nKey='phaseBanner.text'
            defaults='BETTERGOV.PH is built by volunteers of BetterGov.ph, a civic technology and open-source movement. <about>Learn more about BetterGov</about>'
            components={{
              // Not <link>: Trans parses its string as HTML, where <link> is a
              // void element, so the text would fall outside the anchor.
              about: (
                <a
                  href={ABOUT_URL}
                  target='_blank'
                  rel='noreferrer'
                  className='ml-1 inline-block whitespace-nowrap bg-ed-navy-ink px-2 py-0.5 font-semibold text-white no-underline hover:underline hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                />
              ),
            }}
          />
        </p>
      </Container>
    </div>
  );
};

export default PhaseBanner;
