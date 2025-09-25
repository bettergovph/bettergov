import { WeatherData } from '../types';
import { fetchWithCache } from './api';

/**
 * Map OpenWeatherMap icon codes to Lucide icon names
 * @param iconCode OpenWeatherMap icon code
 * @returns Corresponding Lucide icon name
 */
export const mapWeatherIconToLucide = (iconCode: string): string => {
  const iconMap: Record<string, string> = {
    '01d': 'Sun', // clear sky day
    '01n': 'Moon', // clear sky night
    '02d': 'CloudSun', // few clouds day
    '02n': 'CloudMoon', // few clouds night
    '03d': 'Cloud', // scattered clouds
    '03n': 'Cloud',
    '04d': 'Cloud', // broken clouds
    '04n': 'Cloud',
    '09d': 'CloudDrizzle', // shower rain
    '09n': 'CloudDrizzle',
    '10d': 'CloudRain', // rain
    '10n': 'CloudRain',
    '11d': 'CloudLightning', // thunderstorm
    '11n': 'CloudLightning',
    '13d': 'CloudSnow', // snow
    '13n': 'CloudSnow',
    '50d': 'Cloud', // mist
    '50n': 'Cloud',
  };

  return iconMap[iconCode] || 'Cloud'; // Default to Cloud if icon code not found
};

/**
 * Fetch weather data from the API
 * @returns Transformed weather data
 */
export const fetchWeatherData = async (): Promise<WeatherData[]> => {
  const data = await fetchWithCache('https://api.bettergov.ph/weather');

  // Transform API data to match our WeatherData type
  const transformedData: WeatherData[] = Object.keys(data).map(
    (key: string) => ({
      location: key,
      temperature: Math.round(data[key].main.temp), // Round temperature to nearest integer
      condition: data[key].weather[0].description,
      icon: mapWeatherIconToLucide(data[key].weather[0].icon),
      humidity: data[key].main.humidity,
      windSpeed: data[key].wind.speed,
      pressure: data[key].main.pressure,
      visibility: Math.round(data[key].visibility / 1000), // Convert meters to kilometers
    })
  );

  return transformedData;
};
