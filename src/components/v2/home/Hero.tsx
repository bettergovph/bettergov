import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import BigSearch from '../ui/BigSearch';
import { SUGGESTIONS } from './data';

const Hero: FC = () => {
  const { t } = useTranslation('home');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = () => {
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <section className='border-b border-ed-rule bg-gradient-to-r from-ed-navy-2 to-ed-navy-ink py-12 text-white max-md:py-9'>
      <Container>
        <div className='grid grid-cols-2 items-center gap-12 max-lg:grid-cols-1 max-lg:gap-10 max-md:gap-7'>
          <div>
            <Eyebrow tone='onDark'>{t('hero.eyebrow')}</Eyebrow>
            <h1 className='mt-3 font-serif-ed text-[clamp(34px,4.4vw,48px)] font-medium leading-[1.05] tracking-[-0.02em] text-white'>
              {t('hero.titleLineOne')}{' '}
              <em className='not-italic text-white'>
                {t('hero.titleLineTwo')}
              </em>
            </h1>
            <p className='mt-4 max-w-[460px] font-serif-ed text-base leading-relaxed text-white/85'>
              {t('hero.lede')}
            </p>
            <div className='mt-4 flex flex-wrap gap-6 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/80'>
              <span>
                <strong className='font-serif-ed text-sm font-medium normal-case tracking-normal text-white'>
                  486
                </strong>{' '}
                {t('hero.statsServices')}
              </span>
              <span>
                <strong className='font-serif-ed text-sm font-medium normal-case tracking-normal text-white'>
                  142
                </strong>{' '}
                {t('hero.statsAgencies')}
              </span>
              <span>
                <strong className='font-serif-ed text-sm font-medium normal-case tracking-normal text-white'>
                  {t('hero.statsUpdatesLabel')}
                </strong>{' '}
                {t('hero.statsUpdates')}
              </span>
            </div>
          </div>

          <div>
            <div className='mb-2.5 font-serif-ed text-[17px] text-white/95'>
              {t('hero.prompt')}
            </div>
            <BigSearch
              value={q}
              onChange={setQ}
              onSubmit={submit}
              placeholder={t('hero.placeholder')}
              ariaLabel={t('hero.prompt')}
              ctaLabel={t('hero.searchCta')}
              onDark
            />
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Eyebrow tone='onDark' className='mr-1'>
                {t('hero.popular')}
              </Eyebrow>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type='button'
                  onClick={() => setQ(s)}
                  className='cursor-pointer border border-ed-rule-strong bg-white/95 px-2.5 py-1 font-sans-ed text-xs text-ed-ink-2'
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
