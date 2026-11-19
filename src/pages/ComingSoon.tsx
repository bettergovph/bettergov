import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Eyebrow from '../components/v2/ui/Eyebrow';
import { BETTERGOV_VERTICAL_WHITE_SRC, SITE_NAME } from '../lib/brand';

/**
 * Full-bleed coming-soon landing at `/coming-soon`, kept for future use.
 * App.tsx keeps the site header, footer and assistant off this route.
 *
 * From `sm` up, the lockup is a 1920×1080 title card scaled to fit the
 * viewport: each `min(Xvw,Ysvh)` pair is one pixel size on that card (logo
 * 440, tagline 40). `svh` is the height with the mobile browser
 * bars showing, so the page fits on screen without scrolling. Phones get fixed
 * sizes so the tagline stays readable.
 */
const ComingSoon: FC = () => {
  const { t } = useTranslation('common');

  return (
    <main className='flex grow flex-col items-center justify-center bg-ed-navy-2 px-6 py-8 text-center text-white antialiased'>
      <h1 className='m-0'>
        <img
          src={BETTERGOV_VERTICAL_WHITE_SRC}
          alt={SITE_NAME}
          width={710}
          height={960}
          className='mx-auto block h-44 w-auto sm:h-[min(22.92vw,40.74svh)]'
        />
      </h1>
      <p className='mt-6 text-balance font-sans-ed text-base leading-snug text-white/85 sm:mt-[min(2.5vw,4.44svh)] sm:text-[max(1rem,min(2.08vw,3.7svh))] sm:leading-none'>
        {t(
          'masthead.tagline',
          'The volunteer run portal of the Republic of the Philippines'
        )}
      </p>
      <Eyebrow
        tone='onDark'
        className='mt-12 text-xs tracking-[0.2em] sm:mt-[min(3.33vw,5.93svh)] sm:text-[max(0.75rem,min(1.04vw,1.85svh))]'
      >
        {t('comingSoon', 'Coming soon')}
      </Eyebrow>
    </main>
  );
};

export default ComingSoon;
