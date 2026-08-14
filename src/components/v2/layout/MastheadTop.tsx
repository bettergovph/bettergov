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
    <div className='flex items-center justify-between border-b border-ed-rule py-2.5 font-serif-ed text-[12px] tracking-normal text-ed-ink-3 max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:py-2 max-md:text-[11px]'>
      <div className='flex items-center gap-4 max-md:flex-wrap max-md:gap-2'>
        <span>{today}</span>
        {weather.length > 0 && (
          <>
            <span className='text-ed-rule-strong'>|</span>
            <span className='inline-flex items-center gap-3 tabular-nums max-md:gap-2'>
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
          </>
        )}
        {currentRate && (
          <>
            <span className='text-ed-rule-strong'>|</span>
            <span className='inline-flex items-center gap-1.5 tabular-nums'>
              <span>{currentRate.code}</span>
              <span className='text-ed-ink'>
                ₱{currentRate.rate.toFixed(2)}
              </span>
            </span>
          </>
        )}
      </div>
      <div className='flex items-center gap-4 max-md:flex-wrap max-md:gap-2'>
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
        <a
          href='https://about.bettergov.ph'
          target='_blank'
          rel='noreferrer'
          className='text-ed-ink-3 no-underline hover:text-ed-navy'
        >
          {t('masthead.about', 'About')}
        </a>
        <span className='text-ed-rule-strong'>|</span>
        <LangToggle />
      </div>
    </div>
  );
};

export default MastheadTop;
