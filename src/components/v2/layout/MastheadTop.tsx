import { FC, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangToggle from './LangToggle';
import { fetchForexData } from '../../../lib/forex';
import { fetchWeatherData } from '../../../lib/weather';
import { ForexRate, WeatherData } from '../../../types';

const FOREX_CODES = ['USD', 'EUR', 'JPY', 'GBP'];

const MastheadTop: FC = () => {
  const { t } = useTranslation('common');

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const [forexRates, setForexRates] = useState<ForexRate[]>([]);
  const [forexIndex, setForexIndex] = useState(0);
  const [weather, setWeather] = useState<WeatherData[]>([]);

  useEffect(() => {
    fetchForexData(FOREX_CODES)
      .then(setForexRates)
      .catch(err => console.error('Error fetching forex data:', err));
    fetchWeatherData()
      .then(data => setWeather(data.slice(0, 4)))
      .catch(err => console.error('Error fetching weather data:', err));
  }, []);

  useEffect(() => {
    if (forexRates.length === 0) return;
    const interval = setInterval(() => {
      setForexIndex(i => (i + 1) % forexRates.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [forexRates.length]);

  const currentRate = forexRates[forexIndex];

  return (
    // Hidden on phones: the utility links and language picker live in the
    // hamburger menu there (see MobileMenu).
    <div className='flex items-center gap-6 border-b border-ed-rule py-2.5 font-serif-ed text-[12px] tracking-normal text-ed-ink-3 max-md:hidden'>
      <div className='flex min-w-0 items-center gap-4'>
        <span className='whitespace-nowrap'>{today}</span>
        {/* Weather and forex are desktop-only — below xl they overflow the row. */}
        {weather.length > 0 && (
          <span className='inline-flex items-center gap-3 max-xl:hidden'>
            <span className='text-ed-rule-strong'>|</span>
            <span className='inline-flex items-center gap-3 tabular-nums'>
              {weather.map(w => (
                <span
                  key={w.location}
                  className='inline-flex items-center gap-1'
                >
                  {/* API returns lowercase keys (e.g. "manila") */}
                  <span className='capitalize'>{w.location}</span>
                  <span className='text-ed-ink'>{w.temperature}°C</span>
                </span>
              ))}
            </span>
          </span>
        )}
        {currentRate && (
          <span className='inline-flex items-center gap-3 max-xl:hidden'>
            <span className='text-ed-rule-strong'>|</span>
            <span className='inline-flex items-center gap-1.5 tabular-nums'>
              <span>{currentRate.code}</span>
              <span className='text-ed-ink'>
                ₱{currentRate.rate.toFixed(2)}
              </span>
            </span>
          </span>
        )}
      </div>
      <nav
        aria-label='Utility'
        className='ml-auto flex shrink-0 items-center gap-4'
      >
        <Link
          to='/contact'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.contact', 'Contact')}
        </Link>
        <span className='text-ed-rule-strong'>|</span>
        <Link
          to='/accessibility'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.accessibility', 'Accessibility')}
        </Link>
        <span className='text-ed-rule-strong'>|</span>
        <Link
          to='/about'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.about', 'About')}
        </Link>
        <span className='text-ed-rule-strong'>|</span>
        <LangToggle />
      </nav>
    </div>
  );
};

export default MastheadTop;
