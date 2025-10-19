import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAQICategory } from '../utils/aqiUtils';

const ForecastChart = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="flex space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const forecastData = data?.hourlyForecasts || [];

  if (!forecastData || !forecastData.length) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">3-Day Forecast</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Forecast data not available</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (current, next) => {
    if (!next) return <Minus className="w-4 h-4 text-gray-400" />;
    if (current < next) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current > next) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-6">3-Day Forecast</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecastData.slice(0, 3).map((forecast, index) => {
          const aqi = forecast.indexes?.[0]?.aqi || 0;
          const category = getAQICategory(aqi);
          const nextAqi = forecastData[index + 1]?.indexes?.[0]?.aqi;
          
          return (
            <div key={index} className="text-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {formatDate(forecast.dateTime)}
                </span>
                {getTrendIcon(aqi, nextAqi)}
              </div>
              
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-lg"
                style={{ backgroundColor: category.color }}
              >
                {aqi}
              </div>
              
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${category.bgColor} ${category.textColor}`}>
                {category.label}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {forecast.indexes?.[0]?.dominantPollutant && (
                  <span>Main: {forecast.indexes[0].dominantPollutant.toUpperCase()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Forecast data updates every hour. Trends show expected changes in air quality.</p>
      </div>
    </div>
  );
};

export default ForecastChart;