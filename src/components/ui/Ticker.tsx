import {
  DollarSignIcon,
  EuroIcon,
  JapaneseYenIcon,
  LoaderIcon,
  PoundSterlingIcon,
} from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { fetchForexData, getCurrencyIconName } from '../../lib/forex';
import { fetchWeatherData } from '../../lib/weather';
import { ForexRate, WeatherData } from '../../types';
import { useLocation } from 'react-router-dom';

const getCurrencyIcon = (code: string) => {
  const iconName = getCurrencyIconName(code);
  switch (iconName) {
    case 'DollarSign':
      return <DollarSignIcon className='h-4 w-4' />;
    case 'JapaneseYen':
      return <JapaneseYenIcon className='h-4 w-4' />;
    case 'Euro':
      return <EuroIcon className='h-4 w-4' />;
    case 'PoundSterling':
      return <PoundSterlingIcon className='h-4 w-4' />;
    default:
      return null;
  }
};

const Ticker: FC = () => {
  const [forexRates, setForexRates] = useState<ForexRate[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [currentRateIndex, setCurrentRateIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const { pathname } = useLocation();

  // Fetch forex data
  useEffect(() => {
    const getForexData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get forex data for the top 4 currencies
        const transformedData = await fetchForexData([
          'USD',
          'EUR',
          'JPY',
          'GBP',
        ]);
        setForexRates(transformedData);
      } catch (error) {
        console.error('Error fetching forex data:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to fetch forex data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    getForexData();
  }, []);

  // Fetch weather data
  useEffect(() => {
    const getWeatherData = async () => {
      try {
        setWeatherLoading(true);
        setWeatherError(null);

        const data = await fetchWeatherData();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch weather data'
        );
      } finally {
        setWeatherLoading(false);
      }
    };

    getWeatherData();
  }, []);

  // Rotate through the forex rates
  useEffect(() => {
    // Only start rotation if we have forex rates
    if (forexRates.length === 0) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      // Wait for animation to complete before changing the index
      setTimeout(() => {
        setCurrentRateIndex(prevIndex => (prevIndex + 1) % forexRates.length);
        setIsAnimating(false);
      }, 500); // Match this with the CSS animation duration
    }, 4000); // Show each rate for 4 seconds

    return () => clearInterval(interval);
  }, [forexRates.length]);

  // If loading or error, show appropriate content
  if (isLoading && weatherLoading) {
    return (
      <div className='bg-primary-600 text-white py-1 px-4'>
        <div className='container mx-auto flex items-center justify-center'>
          <LoaderIcon className='h-4 w-4 animate-spin mr-2' />
          <span className='text-xs'>Loading data...</span>
        </div>
      </div>
    );
  }

  // If both forex and weather have errors or no data, hide the ticker
  if (
    (error && weatherError) ||
    (forexRates.length === 0 && weatherData.length === 0)
  ) {
    return null;
  }

  const currentRate = forexRates[currentRateIndex];

  if (!currentRate || pathname === '/philippines/map') return null;

  return (
    <div className='bg-blue-950 text-white py-1.5'>
      <div className='container mx-auto px-4 flex justify-end'>
        <div className='flex justify-end items-center'>
          {/* Forex ticker */}
          <div className='flex-1 overflow-hidden pr-4'>
            <div className='relative h-6 flex items-center'>
              <div
                className={`flex items-center transition-all duration-200 ${
                  isAnimating
                    ? 'opacity-0 translate-y-2'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <div className='inline-flex items-center space-x-1'>
                  <span className='text-accent-200'>
                    {getCurrencyIcon(currentRate.code)}
                  </span>
                  <span className='text-xs font-medium'>
                    {currentRate.code}
                  </span>
                  <span className='text-xs text-accent-100'>
                    ₱{currentRate.rate.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather information */}
          <div className='flex items-center space-x-6 pl-4 border-l border-accent-500'>
            {weatherLoading ? (
              <div className='flex items-center space-x-2'>
                <LoaderIcon className='h-3 w-3 animate-spin text-accent-100' />
                <span className='text-xs text-accent-100'>
                  Loading weather...
                </span>
              </div>
            ) : weatherError ? (
              <div className='flex items-center space-x-2'>
                <span className='text-xs text-accent-100'>
                  Weather unavailable
                </span>
              </div>
            ) : (
              weatherData.slice(0, 4).map(data => (
                <div
                  key={data.location}
                  className='flex flex-col items-center justify-center uppercase space-x-0 sm:flex-row sm:space-x-2'
                >
                  <span className='text-xs font-medium text-accent-100'>
                    {data.location}
                  </span>
                  <span className='text-xs text-white'>
                    {data.temperature}°C
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticker;
