import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClockIcon } from 'lucide-react';
import Container from '../ui/Container';
import SectionHeader from '../ui/SectionHeader';
import ArrowLink from '../ui/ArrowLink';
import Eyebrow from '../ui/Eyebrow';
import Flag from '../ui/Flag';
import PlaceholderImage from '../ui/PlaceholderImage';
import { ALSO_TRENDING, FEATURED_TRENDING } from './data';

const MostRequested: FC = () => {
  const { t } = useTranslation('home');
  const updated = new Date().toLocaleDateString('en-PH');

  return (
    <section className='mt-20 max-md:mt-12'>
      <Container>
        <SectionHeader
          label={t('mostRequested.label')}
          meta={`${t('mostRequested.updatedLabel')} ${updated}`}
        />
        <div className='grid grid-cols-[1.4fr_1fr_1fr] border border-ed-rule bg-white max-lg:grid-cols-1'>
          {/* Feature story */}
          <Link
            to='/services?q=passport'
            className='block p-10 text-ed-ink no-underline border-r border-ed-rule max-lg:border-r-0 max-lg:border-b max-md:p-4'
          >
            <Flag variant='red'>{t('mostRequested.mostSearched')}</Flag>
            <PlaceholderImage height={200} className='my-6 max-md:my-4'>
              DFA consular lobby photo
            </PlaceholderImage>
            <div className='font-mono-ed text-[10px] uppercase tracking-[0.16em] text-ed-ink-3'>
              {t('mostRequested.featureAgency')} ·{' '}
              {t('mostRequested.featureMeta')}
            </div>
            <h2 className='mt-3.5 font-serif-ed text-[clamp(30px,3.4vw,42px)] font-bold leading-[1.05] tracking-[-0.01em] text-ed-ink max-md:mt-2.5 max-md:text-[26px]'>
              {t('mostRequested.featureTitle')}
            </h2>
            <p className='mt-4 max-w-[520px] font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-md:mt-2.5 max-md:text-[15px] max-md:leading-normal'>
              {t('mostRequested.featureLede')}
            </p>
            <div className='mt-6 flex flex-wrap gap-6 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-md:mt-4 max-md:gap-4'>
              <span className='inline-flex items-center gap-1.5'>
                <ClockIcon size={14} /> {t('mostRequested.featureTime')}
              </span>
              <span>{t('mostRequested.featureFee')}</span>
              <span>{t('mostRequested.featureAppointment')}</span>
            </div>
          </Link>

          {/* Middle column: 2 stacked cards */}
          <div className='flex flex-col border-r border-ed-rule max-lg:border-r-0 max-lg:border-b'>
            {FEATURED_TRENDING.map((s, i) => (
              <Link
                key={s.id}
                to='/services'
                className={`flex flex-1 flex-col p-8 text-ed-ink no-underline max-md:p-4 ${
                  i === 0 ? 'border-b border-ed-rule' : ''
                }`}
              >
                <Eyebrow>{s.agency}</Eyebrow>
                <h3 className='mt-3 font-serif-ed text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ed-ink max-md:mt-2 max-md:text-[22px]'>
                  {s.title}
                </h3>
                <p className='mt-2.5 flex-1 text-[13px] leading-normal text-ed-ink-2 max-md:mt-1.5 max-md:text-xs'>
                  {s.lede}
                </p>
                <div className='mt-4 flex gap-4 border-t border-ed-rule pt-3.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3 max-md:mt-3 max-md:pt-2.5 max-md:text-[10px]'>
                  <span>{s.time}</span>
                  <span>·</span>
                  <span>{s.cost}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Right column: trending list */}
          <div className='bg-ed-paper-2 p-8 max-md:p-4'>
            <Eyebrow className='text-ed-ink-2'>
              {t('mostRequested.alsoTrending')}
            </Eyebrow>
            <div className='mt-4 max-md:mt-2'>
              {ALSO_TRENDING.map((s, i) => (
                <Link
                  key={s.title}
                  to='/services'
                  className={`block py-3.5 text-ed-ink no-underline max-md:py-2.5 ${
                    i < ALSO_TRENDING.length - 1
                      ? 'border-b border-ed-rule'
                      : ''
                  }`}
                >
                  <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                    {s.agency}
                  </div>
                  <div className='mt-0.5 font-serif-ed text-base leading-tight max-md:text-[15px]'>
                    {s.title}
                  </div>
                </Link>
              ))}
            </div>
            <div className='mt-6 max-md:mt-4'>
              <ArrowLink to='/services'>
                {t('mostRequested.browseAll')}
              </ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default MostRequested;
