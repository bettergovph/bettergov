import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SmartphoneIcon } from 'lucide-react';
import Container from '../ui/Container';

const STORES = [
  {
    label: 'Download on the App Store',
    href: 'https://apps.apple.com/ph/app/egov-ph/id6447682225',
    src: '/egov/app-store-badge.png',
  },
  {
    label: 'Get it on Google Play',
    href: 'https://play.google.com/store/apps/details?id=egov.app',
    src: '/egov/google-play-badge.png',
  },
  {
    label: 'Explore it on Huawei AppGallery',
    href: 'https://appgallery.huawei.com/#/app/C111221319',
    src: '/egov/app-gallery-badge.png',
  },
];

/** Promotional banner for the official eGovPH mobile app. */
const EgovAppBanner: FC = () => {
  const { t } = useTranslation('home');

  return (
    <section className='mt-16 max-md:mt-8'>
      <Container>
        <div className='relative overflow-hidden rounded-2xl bg-ed-navy-2'>
          {/* Decorative circles, echoing the e.gov.ph banner */}
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -bottom-32 -left-28 h-[420px] w-[420px] rounded-full bg-white/[0.06]'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -top-56 right-[22%] h-[560px] w-[560px] rounded-full bg-white/[0.05]'
          />

          <div className='relative grid items-end gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
            <div className='px-12 py-14 max-lg:px-8 max-lg:pb-4 max-lg:text-center max-md:px-5 max-md:py-6'>
              <span className='inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-sans-ed text-sm font-medium text-white'>
                <SmartphoneIcon size={16} />
                {t('egovApp.badge', 'Available on iOS, Android & App Gallery')}
              </span>

              <h2 className='mt-6 font-serif-ed text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.5rem] max-md:mt-3.5 max-md:text-[24px]'>
                {t('egovApp.title', 'Start Using eGovPH Today')}
              </h2>

              <p className='mt-4 max-w-lg font-sans-ed text-[1.063rem] leading-relaxed text-white/70 max-lg:mx-auto max-md:mt-2.5 max-md:text-[14px] max-md:leading-snug'>
                {t(
                  'egovApp.lede',
                  'Used by millions of Filipinos nationwide. Join them and experience government services like never before.'
                )}
              </p>

              <div className='mt-8 flex flex-wrap items-center gap-3 max-lg:justify-center max-md:mt-5'>
                {STORES.map(store => (
                  <a
                    key={store.label}
                    href={store.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-block rounded-lg transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                  >
                    <img
                      src={store.src}
                      alt={store.label}
                      width={167}
                      height={50}
                      loading='lazy'
                      className='block h-[50px] w-auto max-md:h-[40px]'
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Bottom-aligned so the hand bleeds off the lower edge, as on
                e.gov.ph, rather than clipping the phone at the top. */}
            <div className='flex justify-center self-end pt-12 lg:justify-end lg:pr-4 max-lg:pt-0'>
              <img
                src='/egov/egov-app-phone.webp'
                alt='The eGovPH app open on a phone, showing National Government Portals'
                width={900}
                height={836}
                loading='lazy'
                className='-mb-6 block w-full max-w-[420px] select-none max-lg:max-w-[300px] max-md:max-w-[220px]'
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default EgovAppBanner;
