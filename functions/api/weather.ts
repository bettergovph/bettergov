import { Env } from '../types';
import { validateDataRequest } from '../lib/data-request';

// Interface for Philippine city coordinates
interface CityCoordinates {
  name: string;
  lat: number;
  lon: number;
}

// Interface for city coordinates map
interface CityCoordinatesMap {
  [key: string]: { lat: number; lon: number };
}

// Interface for OpenWeatherMap API response
interface OpenWeatherMapResponse {
  name?: string;
  coord?: { lat: number; lon: number };
  weather?: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main?: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility?: number;
  wind?: { speed: number; deg: number };
  clouds?: { all: number };
  rain?: Record<string, number>;
  dt?: number;
  sys?: Record<string, unknown>;
  timezone?: number;
  id?: number;
}

// Interface for weather response data
interface WeatherResponseData {
  [cityName: string]: {
    city: string;
    coordinates: { lat: number; lon: number };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    visibility: number;
    wind: { speed: number; deg: number };
    clouds: { all: number };
    rain: Record<string, number>;
    dt: number;
    sys: Record<string, unknown>;
    timezone: number;
    id: number;
    timestamp: string;
  };
}

// Major Philippine cities with their coordinates (latitude, longitude)
const PHILIPPINE_CITIES: CityCoordinates[] = [
  { name: 'Manila', lat: 14.5995, lon: 120.9842 },
  { name: 'Cebu', lat: 10.3157, lon: 123.8854 },
  { name: 'Davao', lat: 7.1907, lon: 125.4553 },
  { name: 'Baguio', lat: 16.4023, lon: 120.596 },
];

// Map of city names to their coordinates for quick lookup
const CITY_COORDINATES: CityCoordinatesMap = PHILIPPINE_CITIES.reduce(
  (map, city) => {
    map[city.name.toLowerCase()] = { lat: city.lat, lon: city.lon };
    return map;
  },
  {} as CityCoordinatesMap
);

// Core function to fetch weather data using OpenWeatherMap API
async function fetchWeatherData(env: Env): Promise<WeatherResponseData> {
  // Get API key from environment variable
  const apiKey = env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OpenWeatherMap API key not found in environment variables'
    );
  }

  // Determine which cities to fetch
  const citiesToFetch = PHILIPPINE_CITIES.map(city => city.name.toLowerCase());

  // Fetch weather data for cities
  const weatherData: WeatherResponseData = {};

  for (const cityName of citiesToFetch) {
    try {
      const coords = CITY_COORDINATES[cityName];
      if (!coords) {
        console.error(`No coordinates found for city: ${cityName}`);
        continue;
      }

      // Use the standard weather API with coordinates
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`,
        { redirect: 'error', signal: AbortSignal.timeout(15_000) }
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch weather data for ${cityName}: ${response.statusText}`
        );
        continue;
      }

      const data = (await response.json()) as OpenWeatherMapResponse;
      if (!data.main || !Number.isFinite(data.main.temp)) {
        throw new Error('Weather provider returned invalid data');
      }

      // Format the response data based on the example format
      weatherData[cityName] = {
        city: data.name || cityName.charAt(0).toUpperCase() + cityName.slice(1),
        coordinates: data.coord || { lat: coords.lat, lon: coords.lon },
        weather: data.weather || [],
        main: data.main,
        visibility: data.visibility || 0,
        wind: data.wind || { speed: 0, deg: 0 },
        clouds: data.clouds || { all: 0 },
        rain: data.rain || {},
        dt: data.dt || Math.floor(Date.now() / 1000),
        sys: data.sys || {},
        timezone: data.timezone || 0,
        id: data.id || 0,
        timestamp: new Date().toISOString(),
      };

      // Add a small delay to avoid rate limiting
      if (citiesToFetch.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch {
      // A fetch error may contain the URL, including the provider API key.
      console.error(`Error fetching weather for ${cityName}`);
    }
  }

  if (Object.keys(weatherData).length === 0) {
    throw new Error('Weather provider returned no data');
  }
  return weatherData;
}

// Cache reads stay within this Worker's account. Only a cold cache calls the
// provider during an HTTP request; the hourly scheduled handler refreshes it.
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const invalid = validateDataRequest(context.request, 'city');
  if (invalid) return invalid;
  const city = new URL(context.request.url).searchParams
    .get('city')
    ?.toLowerCase();
  if (city && !Object.hasOwn(CITY_COORDINATES, city)) {
    return Response.json(
      { error: 'Unknown city', availableCities: Object.keys(CITY_COORDINATES) },
      { status: 404 }
    );
  }
  try {
    let data = await context.env.WEATHER_KV.get<WeatherResponseData>(
      'philippines_weather',
      { type: 'json' }
    );
    if (!data) {
      if (!context.env.OPENWEATHERMAP_API_KEY) {
        return Response.json(
          { error: 'Weather is not configured' },
          { status: 503 }
        );
      }
      data = await fetchWeatherData(context.env);
      await context.env.WEATHER_KV.put(
        'philippines_weather',
        JSON.stringify(data),
        {
          expirationTtl: 3600 * 6,
        }
      );
    }
    if (city && !data[city]) {
      return Response.json(
        { error: 'Weather temporarily unavailable for this city' },
        { status: 503 }
      );
    }
    return Response.json(city ? { [city]: data[city] } : data);
  } catch {
    console.error('[weather] Unable to load weather data');
    return Response.json(
      { error: 'Weather service temporarily unavailable' },
      { status: 502 }
    );
  }
}

export async function scheduled(controller: ScheduledController, env: Env) {
  try {
    // Fetch weather data for all cities
    const weatherData = await fetchWeatherData(env);
    const cachedData = await env.WEATHER_KV.get<WeatherResponseData>(
      'philippines_weather',
      { type: 'json' }
    );

    // Store the data in Cloudflare KV
    await env.WEATHER_KV.put(
      'philippines_weather',
      JSON.stringify({ ...cachedData, ...weatherData }),
      {
        expirationTtl: 3600 * 6, // Expire after 6 hours
      }
    );

    return {
      success: true,
      message: `Weather data updated for ${Object.keys(weatherData).length} Philippine cities`,
      timestamp: new Date().toISOString(),
    };
  } catch {
    console.error('[weather] Scheduled refresh failed');
    return {
      success: false,
      error: 'Weather refresh failed',
    };
  }
}
