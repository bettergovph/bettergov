import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRightIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import { ABOUT_URL, VOLUNTEER_URL } from '../../../lib/brand';
import { cn } from '../../../lib/utils';

/**
 * Community figures as published on about.bettergov.ph (read 16 October
 * 2026). Update them together with the date in `movement.source`.
 */
const STATS = [
  {
    key: 'discord',
    value: '5,000+',
    label: 'members in the BetterGov Discord',
  },
  {
    key: 'contributors',
    value: '500+',
    label: 'contributors: developers, researchers, organizers and more',
  },
  {
    key: 'tools',
    value: '27',
    label: 'free public tools, from the budget portal to Juris.ph',
  },
] as const;

/** White keyboard focus ring, visible on the dark navy band. */
const FOCUS_ON_DARK =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

/**
 * Decorative sunburst behind the section, echoing the sun in the
 * BetterGov.ph logo: sixteen rays, alternately long and short, around a ring.
 */
const Sunburst: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox='-100 -100 200 200'
    aria-hidden='true'
    focusable='false'
    className={className}
  >
    <circle r='22' fill='none' stroke='currentColor' strokeWidth='3' />
    {Array.from({ length: 16 }, (_, i) => (
      <path
        key={i}
        d={
          i % 2
            ? 'M -2.5 -30 L 2.5 -30 L 1.5 -68 L -1.5 -68 Z'
            : 'M -4 -30 L 4 -30 L 2 -97 L -2 -97 Z'
        }
        transform={`rotate(${i * 22.5})`}
        fill='currentColor'
      />
    ))}
  </svg>
);

/**
 * Home page section on the BetterGov.ph movement that builds this site, set
 * as a dark navy band so it stands apart from the white sections around it.
 */
const BetterGovMovement: FC = () => {
  const { t } = useTranslation('home');

  return (
    <section className='relative mt-16 overflow-hidden bg-ed-navy-ink py-20 text-white max-md:mt-8 max-md:py-10'>
      <Sunburst className='pointer-events-none absolute -bottom-[440px] -right-[340px] h-[880px] w-[880px] text-white/[0.06] max-md:-bottom-48 max-md:-right-44 max-md:h-[420px] max-md:w-[420px]' />
      <Container className='relative'>
        <div className='mb-8 max-md:mb-4'>
          <SectionHeader
            onDark
            label={t('movement.label', 'The BetterGov movement')}
            meta={
              <a
                href={ABOUT_URL}
                target='_blank'
                rel='noreferrer'
                className={cn(
                  'text-white/80 no-underline hover:text-white',
                  FOCUS_ON_DARK
                )}
              >
                about.bettergov.ph ↗
              </a>
            }
          />
        </div>
        <div className='grid grid-cols-[1fr_1.1fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-6'>
          <div>
            <Eyebrow tone='onDark'>
              {t('movement.eyebrow', 'Volunteer-run · Open source')}
            </Eyebrow>
            <h2 className='mt-2 font-serif-ed text-[clamp(32px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.02em] text-white max-md:text-[26px]'>
              {t('movement.title', 'Built by volunteers, in the open')}
            </h2>
            <p className='mt-4 max-w-[480px] font-sans-ed text-[17px] leading-relaxed text-white/80 max-md:mt-2.5 max-md:text-[14px] max-md:leading-snug'>
              {t(
                'movement.lede',
                'BetterGov.ph is a volunteer-driven civic technology and open-source movement making Philippine government data accessible, understandable, and actionable.'
              )}
            </p>
            <p className='mt-3 max-w-[480px] font-sans-ed text-[17px] leading-relaxed text-white/80 max-md:text-[14px] max-md:leading-snug'>
              {t(
                'movement.body',
                'Developers, researchers and organizers build this portal and other free public tools in the open, and anyone can join.'
              )}
            </p>
            <div className='mt-7 flex flex-wrap gap-3 max-md:mt-5'>
              <Button
                as='a'
                href={ABOUT_URL}
                target='_blank'
                rel='noreferrer'
                className={cn(
                  'border-white bg-white text-ed-navy-ink hover:border-ed-navy-tint hover:bg-ed-navy-tint',
                  FOCUS_ON_DARK
                )}
              >
                <span>
                  {t('movement.learnMore', 'Learn more about BetterGov')}
                </span>
                <ArrowUpRightIcon size={15} />
              </Button>
              <Button
                as='a'
                href={VOLUNTEER_URL}
                target='_blank'
                rel='noreferrer'
                variant='ghost'
                className={cn(
                  'border-white/70 text-white hover:border-white hover:bg-white hover:text-ed-navy-ink',
                  FOCUS_ON_DARK
                )}
              >
                <span>{t('movement.volunteer', 'Join the movement')}</span>
              </Button>
            </div>
          </div>
          <div>
            <dl className='grid grid-cols-3 divide-x divide-white/15 border-y border-white/30 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y'>
              {STATS.map(stat => (
                <div
                  key={stat.key}
                  className='flex flex-col px-5 py-6 first:pl-0 max-sm:px-0 max-sm:py-4'
                >
                  <dt className='mt-2 font-sans-ed text-sm leading-snug text-white/75'>
                    {t(`movement.stats.${stat.key}`, stat.label)}
                  </dt>
                  <dd className='order-first m-0 font-serif-ed text-[40px] font-bold leading-none tracking-[-0.02em] text-white max-md:text-[32px]'>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.08em] text-white/60'>
              {t(
                'movement.source',
                'Figures from about.bettergov.ph, as of 16 October 2026'
              )}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default BetterGovMovement;
