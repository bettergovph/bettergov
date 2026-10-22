import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Eyebrow from '../components/v2/ui/Eyebrow';
import { COAT_OF_ARMS_ALT, COAT_OF_ARMS_SRC, SITE_NAME } from '../lib/brand';

/**
 * Full-bleed coming-soon landing at `/coming-soon`, kept for future use.
 * App.tsx keeps the site header, footer and assistant off this route.
 *
 * From `sm` up, the lockup is a 1920×1080 title card scaled to fit the
 * viewport: each `min(Xvw,Ysvh)` pair is one pixel size on that card (seal
 * 170, wordmark 300, tagline 40). `svh` is the height with the mobile browser
 * bars showing, so the page fits on screen without scrolling. Phones get fixed
 * sizes so the tagline stays readable.
 */
const ComingSoon: FC = () => {
  const { t } = useTranslation('common');

  return (
    <main className='flex grow flex-col items-center justify-center bg-ed-navy-2 px-6 py-8 text-center text-white antialiased'>
      <img
        src={COAT_OF_ARMS_SRC}
        alt={COAT_OF_ARMS_ALT}
        className='h-16 w-auto sm:h-[min(8.85vw,15.74svh)]'
      />
      <h1 className='mt-5 font-serif-ed text-[20vw] font-bold leading-[0.9] tracking-[-0.04em] sm:mt-[min(1.875vw,3.33svh)] sm:text-[min(15.63vw,27.78svh)]'>
        {SITE_NAME}
      </h1>
      <p className='mt-4 text-balance font-sans-ed text-base leading-snug text-white/85 sm:mt-[min(1.77vw,3.15svh)] sm:text-[max(1rem,min(2.08vw,3.7svh))] sm:leading-none'>
        {t(
          'masthead.tagline',
          'The proposed portal of the Republic of the Philippines'
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
