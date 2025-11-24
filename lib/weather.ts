import { fetchWeatherApi } from 'openmeteo';

export type WeatherData = {
  currentTemperature: number;
  currentWeatherCode: number;
  currentRain: number;
  currentWindSpeed: number;
  currentWindDirection: number;
  currentPrecipitationProbability: number;
  currentHumidity?: number;
  currentPressure?: number;
  currentVisibility?: number;
  currentUVIndex?: number;
  forecast: {
    time: Date[];
    temperature: number[];
    rain: number[];
    weatherCode: number[];
    precipitationProbability: number[];
    windSpeed: number[];
    windDirection: number[];
  };
  dailyForecast?: {
    time: Date[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitationProbability: number[];
    sunrise: Date[];
    sunset: Date[];
  };
};

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let weatherCache: { data: WeatherData; timestamp: number } | null = null;

// Error handling and retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Get coordinates from environment variables with fallbacks and validation
function getCoordinates(): { latitude: number; longitude: number } {
  const defaultLatitude = 42.402831722; // Tivat, Montenegro
  const defaultLongitude = 18.720663784;
  
  const latitude = process.env.NEXT_PUBLIC_WEATHER_LATITUDE 
    ? parseFloat(process.env.NEXT_PUBLIC_WEATHER_LATITUDE) 
    : defaultLatitude;
  
  const longitude = process.env.NEXT_PUBLIC_WEATHER_LONGITUDE 
    ? parseFloat(process.env.NEXT_PUBLIC_WEATHER_LONGITUDE) 
    : defaultLongitude;
  
  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    console.warn('Invalid coordinates, using defaults');
    return { latitude: defaultLatitude, longitude: defaultLongitude };
  }
  
  return { latitude, longitude };
}

// Retry mechanism with exponential backoff
async function fetchWithRetry(url: string, params: any, retries = MAX_RETRIES): Promise<any> {
  try {
    const responses = await fetchWeatherApi(url, params);
    return responses;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Weather API call failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, params, retries - 1);
    }
    throw error;
  }
}

// Helper function to safely convert to number array
function toNumberArray(data: any): number[] {
  if (Array.isArray(data)) {
    return data.map(item => Number(item) || 0);
  }
  return [];
}

// Helper function to safely convert to Date array
function toDateArray(timestamps: any, utcOffsetSeconds: number): Date[] {
  if (Array.isArray(timestamps)) {
    return timestamps.map((timestamp: number) => 
      new Date((Number(timestamp) + utcOffsetSeconds) * 1000)
    );
  }
  return [];
}

export async function getWeather(): Promise<WeatherData> {
  // Check cache first
  if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
    console.log('Returning cached weather data');
    return weatherCache.data;
  }

  try {
    // Get coordinates from environment variables
    const { latitude, longitude } = getCoordinates();
    
    const params = {
      "latitude": latitude,
      "longitude": longitude,
      "current": [
        "temperature_2m", 
        "relative_humidity_2m",
        "pressure_msl",
        "visibility",
        "uv_index"
      ],
      "hourly": [
        "temperature_2m", 
        "rain", 
        "weather_code", 
        "wind_direction_10m", 
        "wind_speed_10m", 
        "precipitation_probability"
      ],
      "daily": [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunrise",
        "sunset"
      ],
      "timezone": "auto",
      "forecast_days": 3
    };
    
    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWithRetry(url, params);
    
    // Process first location
    const response = responses[0];
    const utcOffsetSeconds = response.utcOffsetSeconds();
    
    const current = response.current()!;
    const hourly = response.hourly()!;
    const daily = response.daily()!;

    // Process current weather data
    const currentData = {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature2m: Number(current.variables(0)!.value()) || 0,
      humidity: Number(current.variables(1)!.value()) || 0,
      pressure: Number(current.variables(2)!.value()) || 0,
      visibility: Number(current.variables(3)!.value()) || 0,
      uvIndex: Number(current.variables(4)!.value()) || 0,
    };

    // Process hourly forecast data
    const hourlyData = {
      time: toDateArray(hourly.time(), utcOffsetSeconds),
      temperature2m: toNumberArray(hourly.variables(0)!.valuesArray()),
      rain: toNumberArray(hourly.variables(1)!.valuesArray()),
      weatherCode: toNumberArray(hourly.variables(2)!.valuesArray()),
      windDirection10m: toNumberArray(hourly.variables(3)!.valuesArray()),
      windSpeed10m: toNumberArray(hourly.variables(4)!.valuesArray()),
      precipitationProbability: toNumberArray(hourly.variables(5)!.valuesArray()),
    };

    // Process daily forecast data
    const dailyData = {
      time: toDateArray(daily.time(), utcOffsetSeconds),
      weatherCode: toNumberArray(daily.variables(0)!.valuesArray()),
      temperature2mMax: toNumberArray(daily.variables(1)!.valuesArray()),
      temperature2mMin: toNumberArray(daily.variables(2)!.valuesArray()),
      precipitationProbabilityMax: toNumberArray(daily.variables(3)!.valuesArray()),
      sunrise: toDateArray(daily.variables(4)!.valuesArray(), utcOffsetSeconds),
      sunset: toDateArray(daily.variables(5)!.valuesArray(), utcOffsetSeconds),
    };

    // Create comprehensive weather data structure
    const weatherData: WeatherData = {
      currentTemperature: currentData.temperature2m,
      currentWeatherCode: hourlyData.weatherCode[0] || 0,
      currentRain: hourlyData.rain[0] || 0,
      currentWindSpeed: hourlyData.windSpeed10m[0] || 0,
      currentWindDirection: hourlyData.windDirection10m[0] || 0,
      currentPrecipitationProbability: hourlyData.precipitationProbability[0] || 0,
      currentHumidity: currentData.humidity,
      currentPressure: currentData.pressure,
      currentVisibility: currentData.visibility,
      currentUVIndex: currentData.uvIndex,
      forecast: {
        time: hourlyData.time.slice(0, 24), // Next 24 hours
        temperature: hourlyData.temperature2m.slice(0, 24),
        rain: hourlyData.rain.slice(0, 24),
        weatherCode: hourlyData.weatherCode.slice(0, 24),
        precipitationProbability: hourlyData.precipitationProbability.slice(0, 24),
        windSpeed: hourlyData.windSpeed10m.slice(0, 24),
        windDirection: hourlyData.windDirection10m.slice(0, 24),
      },
      dailyForecast: {
        time: dailyData.time.slice(0, 3), // Next 3 days
        temperatureMax: dailyData.temperature2mMax.slice(0, 3),
        temperatureMin: dailyData.temperature2mMin.slice(0, 3),
        weatherCode: dailyData.weatherCode.slice(0, 3),
        precipitationProbability: dailyData.precipitationProbabilityMax.slice(0, 3),
        sunrise: dailyData.sunrise.slice(0, 3),
        sunset: dailyData.sunset.slice(0, 3),
      }
    };
    
    // Update cache
    weatherCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    return weatherData;

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    
    // Return fallback data if available in cache
    if (weatherCache) {
      console.log('Returning stale cached data due to API failure');
      return weatherCache.data;
    }
    
    // Return minimal fallback data
    return getFallbackWeatherData();
  }
}

// Fallback data for when API fails
function getFallbackWeatherData(): WeatherData {
  const now = new Date();
  const forecastTimes = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now);
    time.setHours(now.getHours() + i);
    return time;
  });

  return {
    currentTemperature: 15,
    currentWeatherCode: 2, // Partly cloudy
    currentRain: 0,
    currentWindSpeed: 10,
    currentWindDirection: 180,
    currentPrecipitationProbability: 10,
    forecast: {
      time: forecastTimes,
      temperature: Array(24).fill(15),
      rain: Array(24).fill(0),
      weatherCode: Array(24).fill(2),
      precipitationProbability: Array(24).fill(10),
      windSpeed: Array(24).fill(10),
      windDirection: Array(24).fill(180),
    }
  };
}

// Enhanced weather description with more details
export function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Freezing fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Heavy drizzle',
    56: 'Light freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Moderate rain showers',
    82: 'Heavy rain showers',
    85: 'Light snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with light hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return weatherCodes[code] || 'Unknown weather conditions';
}

// Enhanced weather icon mapping with more specific icons
export function getWeatherIcon(code: number): string {
  const iconMap: Record<number, string> = {
    0: 'sun',           // Clear sky
    1: 'sun',           // Mainly clear
    2: 'cloud-sun',     // Partly cloudy
    3: 'cloud',         // Overcast
    45: 'cloud-fog',    // Fog
    48: 'cloud-fog',    // Freezing fog
    51: 'cloud-drizzle', // Light drizzle
    53: 'cloud-drizzle', // Moderate drizzle
    55: 'cloud-drizzle', // Heavy drizzle
    56: 'cloud-hail',   // Light freezing drizzle
    57: 'cloud-hail',   // Heavy freezing drizzle
    61: 'cloud-rain',   // Light rain
    63: 'cloud-rain',   // Moderate rain
    65: 'cloud-rain',   // Heavy rain
    66: 'cloud-hail',   // Light freezing rain
    67: 'cloud-hail',   // Heavy freezing rain
    71: 'cloud-snow',   // Light snow
    73: 'cloud-snow',   // Moderate snow
    75: 'cloud-snow',   // Heavy snow
    77: 'cloud-snow',   // Snow grains
    80: 'cloud-rain',   // Light rain showers
    81: 'cloud-rain',   // Moderate rain showers
    82: 'cloud-rain',   // Heavy rain showers
    85: 'cloud-snow',   // Light snow showers
    86: 'cloud-snow',   // Heavy snow showers
    95: 'cloud-lightning', // Thunderstorm
    96: 'cloud-lightning', // Thunderstorm with light hail
    99: 'cloud-lightning', // Thunderstorm with heavy hail
  };
  
  return iconMap[code] || 'cloud';
}

// Enhanced wind direction with more precise bearings
export function getWindDirection(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Helper to get weather severity level for airport operations
export function getWeatherSeverity(code: number): 'low' | 'medium' | 'high' {
  const severeCodes = [65, 67, 75, 82, 86, 95, 96, 99]; // Heavy rain, snow, thunderstorms
  const moderateCodes = [63, 66, 73, 80, 85]; // Moderate precipitation
  
  if (severeCodes.includes(code)) return 'high';
  if (moderateCodes.includes(code)) return 'medium';
  return 'low';
}

// Helper to check if weather might cause flight delays
export function mightCauseDelays(code: number, windSpeed: number, visibility?: number): boolean {
  const severeWeather = getWeatherSeverity(code) === 'high';
  const highWinds = windSpeed > 50; // km/h
  const lowVisibility = visibility !== undefined && visibility < 1000; // meters
  
  return severeWeather || highWinds || lowVisibility;
}

// Clear cache manually (useful for testing or manual refresh)
export function clearWeatherCache(): void {
  weatherCache = null;
}

// Get cache status for debugging
export function getCacheStatus(): { isCached: boolean; age: number | null } {
  if (!weatherCache) {
    return { isCached: false, age: null };
  }
  
  return {
    isCached: true,
    age: Date.now() - weatherCache.timestamp
  };
}