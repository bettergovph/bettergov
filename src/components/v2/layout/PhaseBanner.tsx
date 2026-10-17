import { FC } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Container from '../ui/Container';
import Flag from '../ui/Flag';
import { ISSUES_URL } from '../../../lib/brand';

/** The issue tracker's address as shown on screen, without the scheme. */
const ISSUES_LABEL = ISSUES_URL.replace(/^https?:\/\//, '');

/**
 * Phase banner at the very top of every page: GOV.PH is in beta and under
 * community and security review, and anyone can report an issue on GitHub.
 * Remove it from the Masthead when the review closes.
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
            defaults='GOV.PH is in beta and under community and security review. We invite you to take part by submitting issues at <tracker>{{url}}</tracker>.'
            values={{ url: ISSUES_LABEL }}
            components={{
              // Not <link>: Trans parses its string as HTML, where <link> is a
              // void element, so the address would fall outside the anchor.
              tracker: (
                <a
                  href={ISSUES_URL}
                  target='_blank'
                  rel='noreferrer'
                  className='font-semibold text-white underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
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
