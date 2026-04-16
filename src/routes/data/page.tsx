import { useState, useEffect, FC } from 'react';
import * as LucideIcons from 'lucide-react';
import { fetchWeatherData } from '../../lib/weather';
import { WeatherData } from '../../types';

const WeatherPage: FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Function to get weather icon component
  const getWeatherIcon = (iconName: string, size = 'h-8 w-8') => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    return Icon ? <Icon className={size} /> : null;
  };

  // Fetch weather data
  useEffect(() => {
    const getWeatherData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchWeatherData();
        setWeatherData(data);

        // Set first city as selected by default
        if (data.length > 0 && !selectedCity) {
          setSelectedCity(data[0].location);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch weather data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    getWeatherData();
  }, [selectedCity]);

  // Get selected city data
  const selectedCityData = weatherData.find(
    city => city.location === selectedCity
  );

  // Get weather condition description
  const getWeatherDescription = (condition: string) => {
    // Capitalize first letter of each word
    return condition
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get background class based on weather condition
  const getWeatherBackground = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear'))
      return 'bg-linear-to-br from-blue-400 to-blue-600';
    if (lowerCondition.includes('cloud'))
      return 'bg-linear-to-br from-gray-300 to-gray-500 text-black';
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle'))
      return 'bg-linear-to-br from-blue-600 to-blue-800';
    if (lowerCondition.includes('thunder'))
      return 'bg-linear-to-br from-gray-700 to-gray-900 text-black';
    if (lowerCondition.includes('snow'))
      return 'bg-linear-to-br from-blue-100 to-blue-300';
    if (lowerCondition.includes('mist') || lowerCondition.includes('fog'))
      return 'bg-linear-to-br from-gray-400 to-gray-600';
    return 'bg-linear-to-br from-blue-500 to-blue-700';
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8 px-4'>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600'></div>
          </div>
        ) : error ? (
          <div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-sm shadow-md'>
            <p className='font-bold'>Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* City Selection Panel */}
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold mb-4 text-gray-800'>Cities</h2>
              <div className='space-y-2'>
                {weatherData.map(city => (
                  <button
                    key={city.location}
                    onClick={() => setSelectedCity(city.location)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all flex items-center justify-between ${
                      selectedCity === city.location
                        ? 'bg-primary-100 text-primary-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className='flex items-center'>
                      <span className='mr-3'>
                        {getWeatherIcon(city.icon, 'h-6 w-6')}
                      </span>
                      <span className='font-medium uppercase'>
                        {city.location}
                      </span>
                    </div>
                    <span className='text-lg font-semibold'>
                      {city.temperature}°C
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Weather Display */}
            {selectedCityData && (
              <div className='lg:col-span-2'>
                <div
                  className={`rounded-lg shadow-lg p-8 ${getWeatherBackground(
                    selectedCityData.condition
                  )}`}
                >
                  <div className='flex flex-col md:flex-row justify-between items-center mb-8'>
                    <div>
                      <h2 className='text-3xl font-bold uppercase mb-1'>
                        {selectedCityData.location}
                      </h2>
                      <p className='text-xl opacity-90'>
                        {getWeatherDescription(selectedCityData.condition)}
                      </p>
                    </div>
                    <div className='flex items-center mt-4 md:mt-0'>
                      {getWeatherIcon(selectedCityData.icon, 'h-16 w-16')}
                      <span className='text-6xl font-bold ml-4'>
                        {selectedCityData.temperature}°C
                      </span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                    <div className='bg-white/20 backdrop-blur-xs rounded-lg p-4'>
                      <div className='text-black/80 mb-1'>Humidity</div>
                      <div className='text-xl font-semibold'>
                        {selectedCityData.humidity}%
                      </div>
                    </div>
                    <div className='bg-white/20 backdrop-blur-xs rounded-lg p-4'>
                      <div className='text-black/80 mb-1'>Wind</div>
                      <div className='text-xl font-semibold'>
                        {Math.round(selectedCityData.windSpeed * 3.6)} km/h
                      </div>
                    </div>
                    <div className='bg-white/20 backdrop-blur-xs rounded-lg p-4'>
                      <div className='text-black/80 mb-1'>Pressure</div>
                      <div className='text-xl font-semibold'>
                        {selectedCityData.pressure} hPa
                      </div>
                    </div>
                    <div className='bg-white/20 backdrop-blur-xs rounded-lg p-4'>
                      <div className='text-black/80 mb-1'>Visibility</div>
                      <div className='text-xl font-semibold'>
                        {selectedCityData.visibility} km
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Forecast */}
                <div className='mt-8 bg-white rounded-lg shadow-md p-6 hidden'>
                  <h3 className='text-xl font-bold mb-4 text-gray-800'>
                    5-Day Forecast
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-5 gap-4'>
                    {[...Array(5)].map((_, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() + index);
                      const dayName = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                      });
                      const dayNum = date.getDate();

                      // Generate some mock forecast data
                      const mockTemp = Math.round(
                        selectedCityData.temperature + (Math.random() * 6 - 3)
                      );
                      const mockIcon =
                        index % 2 === 0 ? selectedCityData.icon : 'Cloud';

                      return (
                        <div
                          key={index}
                          className='bg-gray-50 rounded-lg p-4 text-center'
                        >
                          <p className='font-medium text-gray-800'>{dayName}</p>
                          <p className='text-sm text-gray-800 mb-2'>{dayNum}</p>
                          <div className='flex justify-center my-2'>
                            {getWeatherIcon(mockIcon, 'h-8 w-8 text-gray-700')}
                          </div>
                          <p className='text-lg font-semibold text-gray-800'>
                            {mockTemp}°C
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weather Information Section */}
        <div className='mt-12 bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-2xl font-bold mb-4 text-gray-800'>
            About Weather Data
          </h2>
          <p className='text-gray-800 mb-4'>
            The weather data displayed on this page is sourced from the
            Philippine Atmospheric, Geophysical and Astronomical Services
            Administration (PAGASA) and other reliable weather services. The
            information is updated regularly to provide you with the most
            accurate and current weather conditions across major Philippine
            cities.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Understanding the Data
              </h3>
              <p className='text-gray-800'>
                Temperature is displayed in Celsius (°C). Weather conditions are
                categorized based on current atmospheric observations. The
                forecast provides a 5-day outlook to help you plan ahead.
              </p>
            </div>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Weather Advisories
              </h3>
              <p className='text-gray-800'>
                For official weather advisories, warnings, and detailed
                forecasts, please visit the{' '}
                <a
                  href='https://bagong.pagasa.dost.gov.ph/'
                  className='text-primary-600 hover:underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  PAGASA official website
                </a>{' '}
                or follow their social media channels for real-time updates.
              </p>
            </div>
          </div>
          <p className='text-sm text-gray-700 mt-4 text-right'>
            Weather data provided by{' '}
            <a
              href='https://openweathermap.org/'
              className='text-gray-800 hover:text-gray-900 underline'
              target='_blank'
              rel='noopener noreferrer'
            >
              OpenWeather
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
