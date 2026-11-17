import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRightIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import Eyebrow from '../ui/Eyebrow';
import Button from '../ui/Button';
import { ABOUT_URL, VOLUNTEER_URL } from '../../../lib/brand';

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

/** Home page section on the BetterGov.ph movement that builds this site. */
const BetterGovMovement: FC = () => {
  const { t } = useTranslation('home');

  return (
    <section className='mt-16 border-y border-ed-navy bg-ed-paper-2 py-[60px] max-md:mt-8 max-md:py-6'>
      <Container>
        <div className='mb-8 max-md:mb-4'>
          <SectionHeader
            label={t('movement.label', 'The BetterGov movement')}
            meta={
              <a
                href={ABOUT_URL}
                target='_blank'
                rel='noreferrer'
                className='no-underline text-ed-navy hover:text-ed-red'
              >
                about.bettergov.ph ↗
              </a>
            }
          />
        </div>
        <div className='grid grid-cols-[1fr_1.1fr] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-5'>
          <div>
            <Eyebrow>
              {t('movement.eyebrow', 'Volunteer-run · Open source')}
            </Eyebrow>
            <h2 className='mt-2 font-serif-ed text-[clamp(32px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.02em] text-ed-ink max-md:text-[26px]'>
              {t('movement.title', 'Built by volunteers, in the open')}
            </h2>
            <p className='mt-4 max-w-[480px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-md:mt-2.5 max-md:text-[14px] max-md:leading-snug'>
              {t(
                'movement.lede',
                'BetterGov.ph is a volunteer-driven civic technology and open-source movement making Philippine government data accessible, understandable, and actionable.'
              )}
            </p>
            <p className='mt-3 max-w-[480px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-md:text-[14px] max-md:leading-snug'>
              {t(
                'movement.body',
                'Developers, researchers and organizers build this portal and other free public tools in the open, and anyone can join.'
              )}
            </p>
            <div className='mt-6 flex flex-wrap gap-3 max-md:mt-4'>
              <Button as='a' href={ABOUT_URL} target='_blank' rel='noreferrer'>
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
              >
                <span>{t('movement.volunteer', 'Join the movement')}</span>
              </Button>
            </div>
          </div>
          <div>
            <dl className='grid grid-cols-3 divide-x divide-ed-rule border-y border-ed-navy max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y'>
              {STATS.map(stat => (
                <div
                  key={stat.key}
                  className='flex flex-col px-5 py-6 first:pl-0 max-sm:px-0 max-sm:py-4'
                >
                  <dt className='mt-2 font-sans-ed text-sm leading-snug text-ed-ink-2'>
                    {t(`movement.stats.${stat.key}`, stat.label)}
                  </dt>
                  <dd className='order-first m-0 font-serif-ed text-[40px] font-bold leading-none tracking-[-0.02em] text-ed-navy max-md:text-[32px]'>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.08em] text-ed-ink-3'>
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
