import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Eyebrow from '../ui/Eyebrow';
import BigSearch from '../ui/BigSearch';
import PageMasthead from '../layout/PageMasthead';
import { SUGGESTIONS } from './data';

const Hero: FC = () => {
  const { t } = useTranslation('home');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = () => {
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <PageMasthead
      variant='hero'
      eyebrow={t('hero.eyebrow')}
      title={t('hero.title')}
      lede={t('hero.lede')}
    >
      <div className='mt-2 max-w-2xl'>
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
              className='cursor-pointer border border-ed-rule-strong bg-white/95 px-2.5 py-1 font-sans-ed text-xs text-ed-ink-2 hover:border-white hover:bg-white'
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row — same editorial treatment as /guides */}
      <div className='mt-7 grid grid-cols-3 gap-12 border-t border-white/20 pt-6 max-md:grid-cols-3 max-md:gap-6 max-sm:grid-cols-1'>
        {[
          { n: '486', l: t('hero.statsServices') },
          { n: '142', l: t('hero.statsAgencies') },
          {
            n: t('hero.statsUpdatesLabel'),
            l: t('hero.statsUpdates'),
          },
        ].map(s => (
          <div key={s.l}>
            <div className='font-serif-ed text-[32px] font-medium leading-none text-white'>
              {s.n}
            </div>
            <div className='mt-1.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/70'>
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </PageMasthead>
  );
};

export default Hero;
