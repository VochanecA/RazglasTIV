import { fetchWeatherApi } from 'openmeteo';

export type WeatherData = {
  currentTemperature: number;
  currentWeatherCode: number;
  currentRain: number;
  currentWindSpeed: number;
  currentWindDirection: number;
  currentPrecipitationProbability: number;
  forecast: {
    time: Date[];
    temperature: number[];
    rain: number[];
    weatherCode: number[];
    precipitationProbability: number[];
  };
};

// Get coordinates from environment variables with fallbacks
function getCoordinates(): { latitude: number; longitude: number } {
  // Default to Tivat, Montenegro if not specified
  const latitude = process.env.NEXT_PUBLIC_WEATHER_LATITUDE 
    ? parseFloat(process.env.NEXT_PUBLIC_WEATHER_LATITUDE) 
    : 42.402831722;
  
  const longitude = process.env.NEXT_PUBLIC_WEATHER_LONGITUDE 
    ? parseFloat(process.env.NEXT_PUBLIC_WEATHER_LONGITUDE) 
    : 18.720663784;
  
  return { latitude, longitude };
}

export async function getWeather(): Promise<WeatherData> {
  // Get coordinates from environment variables
  const { latitude, longitude } = getCoordinates();
  
  const params = {
    "latitude": latitude,
    "longitude": longitude,
    "hourly": [
      "temperature_2m", 
      "rain", 
      "weather_code", 
      "wind_direction_10m", 
      "wind_speed_10m", 
      "wind_gusts_10m", 
      "precipitation_probability", 
      "precipitation"
    ],
    "timezone": "auto",
    "forecast_days": 3
  };
  
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  
  // Process first location
  const response = responses[0];
  
  // Attributes for timezone and location
  const utcOffsetSeconds = response.utcOffsetSeconds();
  
  const hourly = response.hourly()!;
  
  // Create weather data structure
  const weatherData = {
    hourly: {
      time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      ),
      temperature2m: hourly.variables(0)!.valuesArray()!,
      rain: hourly.variables(1)!.valuesArray()!,
      weatherCode: hourly.variables(2)!.valuesArray()!,
      windDirection10m: hourly.variables(3)!.valuesArray()!,
      windSpeed10m: hourly.variables(4)!.valuesArray()!,
      windGusts10m: hourly.variables(5)!.valuesArray()!,
      precipitationProbability: hourly.variables(6)!.valuesArray()!,
      precipitation: hourly.variables(7)!.valuesArray()!,
    },
  };
  
  // Get current hour index (first value)
  const currentIndex = 0;
  
  // Extract current conditions
  const currentWeatherData: WeatherData = {
    currentTemperature: weatherData.hourly.temperature2m[currentIndex],
    currentWeatherCode: weatherData.hourly.weatherCode[currentIndex],
    currentRain: weatherData.hourly.rain[currentIndex],
    currentWindSpeed: weatherData.hourly.windSpeed10m[currentIndex],
    currentWindDirection: weatherData.hourly.windDirection10m[currentIndex],
    currentPrecipitationProbability: weatherData.hourly.precipitationProbability[currentIndex],
    forecast: {
      time: weatherData.hourly.time.slice(0, 24), // Next 24 hours
      temperature: Array.from(weatherData.hourly.temperature2m).slice(0, 24),
      rain: Array.from(weatherData.hourly.rain).slice(0, 24),
      weatherCode: Array.from(weatherData.hourly.weatherCode).slice(0, 24),
      precipitationProbability: Array.from(weatherData.hourly.precipitationProbability).slice(0, 24)
    }
  };
  
  return currentWeatherData;
}

// Helper function to get weather description from code
export function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  
  return weatherCodes[code] || 'Unknown';
}

// Helper to get weather icon based on weather code
export function getWeatherIcon(code: number): string {
  if (code === 0) return 'sun';
  if (code === 1) return 'sun';
  if (code === 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code >= 45 && code <= 48) return 'cloud-fog';
  if (code >= 51 && code <= 57) return 'cloud-drizzle';
  if (code >= 61 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'cloud-snow';
  if (code >= 80 && code <= 82) return 'cloud-rain';
  if (code >= 85 && code <= 86) return 'cloud-snow';
  if (code >= 95) return 'cloud-lightning';
  
  return 'cloud';
}

// Get wind direction as a compass direction
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}