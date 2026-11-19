import { useState, useEffect, FC } from 'react';
import * as LucideIcons from 'lucide-react';
import { fetchWeatherData } from '../../lib/weather';
import Container from '../../components/v2/ui/Container';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import SectionHeader from '../../components/v2/ui/SectionHeader';

interface CityWeather {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
}

const MAJOR_CITIES = ['Manila', 'Cebu', 'Davao', 'Baguio', 'Zamboanga'];

const getWeatherIcon = (iconName: string, className = 'h-5 w-5') => {
  const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
  return Icon ? (
    <Icon className={className} />
  ) : (
    <LucideIcons.Cloud className={className} />
  );
};

const toTitleCase = (str: string) =>
  str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const WeatherPage: FC = () => {
  const [weatherData, setWeatherData] = useState<CityWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData()
      .then(data => {
        setWeatherData(data as unknown as CityWeather[]);
        setIsLoading(false);
      })
      .catch(err => {
        setError(
          err instanceof Error ? err.message : 'Failed to load weather data'
        );
        setIsLoading(false);
      });
  }, []);

  const majorCities = MAJOR_CITIES.map(name =>
    weatherData.find(d => d.location.toLowerCase() === name.toLowerCase())
  ).filter(Boolean) as CityWeather[];

  const allCities = [...weatherData].sort((a, b) =>
    a.location.localeCompare(b.location)
  );

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title='Weather'
        lede='Current conditions across major Philippine cities. Data sourced from PAGASA — the Philippine Atmospheric, Geophysical and Astronomical Services Administration.'
      />

      <section className='py-14 max-md:py-6'>
        <Container>
          {isLoading ? (
            <div className='py-20 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-2 border-ed-rule border-t-ed-navy' />
              <p className='mt-4 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                Loading weather data…
              </p>
            </div>
          ) : error ? (
            <div className='border-l-4 border-ed-red bg-ed-paper-2 p-6'>
              <p className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-red mb-1'>
                Data unavailable
              </p>
              <p className='text-sm text-ed-ink-2'>{error}</p>
            </div>
          ) : (
            <>
              {/* Major city KPI cards */}
              {majorCities.length > 0 && (
                <div className='mb-12'>
                  <SectionHeader label='Major cities' />
                  <div className='grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1'>
                    {majorCities.map(city => (
                      <div
                        key={city.location}
                        className='border border-ed-rule bg-white p-5'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                            {city.location}
                          </div>
                          <div className='text-ed-ink-3'>
                            {getWeatherIcon(city.icon, 'h-4 w-4')}
                          </div>
                        </div>
                        <div className='mt-3 font-serif-ed text-[36px] font-semibold leading-none text-ed-ink'>
                          {city.temperature}°
                        </div>
                        <div className='mt-1.5 text-[12px] text-ed-ink-2'>
                          {toTitleCase(city.condition)}
                        </div>
                        <div className='mt-3 grid grid-cols-2 gap-1 border-t border-ed-rule pt-3 font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3'>
                          <div>
                            <div>Humidity</div>
                            <div className='mt-0.5 font-sans-ed text-[12px] normal-case tracking-normal text-ed-ink'>
                              {city.humidity}%
                            </div>
                          </div>
                          <div>
                            <div>Wind</div>
                            <div className='mt-0.5 font-sans-ed text-[12px] normal-case tracking-normal text-ed-ink'>
                              {Math.round(city.windSpeed * 3.6)} km/h
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All cities editorial list */}
              {allCities.length > 0 && (
                <div>
                  <SectionHeader label='All cities' />

                  {/* Table header */}
                  <div className='hidden border-b border-ed-rule pb-2 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr]'>
                    {['City', 'Temp (°C)', 'Condition', 'Humidity', 'Wind'].map(
                      h => (
                        <div
                          key={h}
                          className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'
                        >
                          {h}
                        </div>
                      )
                    )}
                  </div>

                  <div className='divide-y divide-ed-rule'>
                    {allCities.map(city => (
                      <div
                        key={city.location}
                        className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center py-3.5 max-md:grid-cols-1 max-md:gap-1 max-md:py-4'
                      >
                        <div className='flex items-center gap-2.5'>
                          <span className='text-ed-ink-3'>
                            {getWeatherIcon(city.icon, 'h-4 w-4')}
                          </span>
                          <span className='font-medium text-ed-ink'>
                            {city.location}
                          </span>
                        </div>
                        <div className='font-serif-ed text-[20px] font-semibold text-ed-ink max-md:hidden'>
                          {city.temperature}°
                        </div>
                        <div className='text-sm text-ed-ink-2 max-md:hidden'>
                          {toTitleCase(city.condition)}
                        </div>
                        <div className='text-sm text-ed-ink-2 max-md:hidden'>
                          {city.humidity}%
                        </div>
                        <div className='text-sm text-ed-ink-2 max-md:hidden'>
                          {Math.round(city.windSpeed * 3.6)} km/h
                        </div>
                        {/* Mobile summary */}
                        <div className='font-mono-ed text-[10px] uppercase tracking-[0.1em] text-ed-ink-3 md:hidden'>
                          {city.temperature}°C · {toTitleCase(city.condition)} ·{' '}
                          {city.humidity}% humidity ·{' '}
                          {Math.round(city.windSpeed * 3.6)} km/h wind
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source note */}
              <div className='mt-12 border-t border-ed-rule pt-5'>
                <p className='text-[12px] text-ed-ink-3'>
                  <span className='font-mono-ed uppercase tracking-[0.12em]'>
                    Source
                  </span>{' '}
                  Weather data provided by the Philippine Atmospheric,
                  Geophysical and Astronomical Services Administration (PAGASA).{' '}
                  For official advisories and storm signals, visit{' '}
                  <a
                    href='https://bagong.pagasa.dost.gov.ph/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-ed-navy hover:underline'
                  >
                    bagong.pagasa.dost.gov.ph
                  </a>
                  .
                </p>
              </div>
            </>
          )}
        </Container>
      </section>
    </main>
  );
};

export default WeatherPage;
