import { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudRain, CloudSnow, Droplets, Sun, Wind, CloudLightning, CloudFog, CloudDrizzle, CloudSun, RefreshCw } from 'lucide-react';
import { getWeather, WeatherData, getWeatherDescription, getWeatherIcon, getWindDirection } from '@/lib/weather';

// Komponenta mora biti definirana
function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getWeather();
      setWeather(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Set up automatic refresh every hour
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 60 * 60 * 1000); // 60 minutes * 60 seconds * 1000 milliseconds

    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  function getIconComponent(iconName: string) {
    switch (iconName) {
      case 'sun': return <Sun className="w-8 h-8 text-amber-500" />;
      case 'cloud-sun': return <CloudSun className="w-8 h-8 text-blue-400" />;
      case 'cloud': return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'cloud-rain': return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'cloud-snow': return <CloudSnow className="w-8 h-8 text-blue-300" />;
      case 'cloud-lightning': return <CloudLightning className="w-8 h-8 text-amber-500" />;
      case 'cloud-fog': return <CloudFog className="w-8 h-8 text-gray-400" />;
      case 'cloud-drizzle': return <CloudDrizzle className="w-8 h-8 text-blue-400" />;
      default: return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  }

  function formatLastUpdated() {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleRefresh = () => {
    fetchWeatherData();
  };

  if (loading && !refreshing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Weather</h3>
          <Cloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex items-center justify-center h-24">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Weather</h3>
          <Cloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex items-center justify-center h-24">
          <div className="text-center">
            <p className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</p>
            <button 
              onClick={handleRefresh}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md 
                        text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 
                        hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const weatherIconName = getWeatherIcon(weather.currentWeatherCode);
  const weatherDesc = getWeatherDescription(weather.currentWeatherCode);
  const windDirection = getWindDirection(weather.currentWindDirection);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Weather</h3>
          {lastUpdated && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
              Updated: {formatLastUpdated()}
            </span>
          )}
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="mr-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 
                      transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3 h-3 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Cloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getIconComponent(weatherIconName)}
          <div className="ml-3">
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">
              {Math.round(weather.currentTemperature)}°C
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{weatherDesc}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Droplets className="w-3 h-3 text-blue-500 mr-1" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Rain</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {weather.currentRain > 0 ? `${weather.currentRain} mm` : 'None'}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
              ({weather.currentPrecipitationProbability}%)
            </span>
          </p>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Wind className="w-3 h-3 text-blue-500 mr-1" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Wind</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {Math.round(weather.currentWindSpeed)} km/h
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
              {windDirection}
            </span>
          </p>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Droplets className="w-3 h-3 text-blue-500 mr-1" />
            <span className="text-xs text-slate-600 dark:text-slate-300">Humidity</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {weather.currentPrecipitationProbability}%
          </p>
        </div>
      </div>
    </div>
  );
}

// OBAVEZNO dodajte export
export default WeatherCard;