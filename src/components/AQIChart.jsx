import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const AQIChart = ({ aqiData, forecastData }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    if (aqiData && forecastData) {
      generateChartData();
    }
  }, [aqiData, forecastData, selectedTimeframe]);

  const generateChartData = () => {
    const currentAQI = aqiData.indexes?.[0]?.aqi || 0;
    const forecast = forecastData.hourlyForecasts || [];
    
    // Generate hourly data for the last 24 hours (simulated) + forecast
    const data = [];
    const now = new Date();
    
    // Add historical data (simulated based on current AQI with variations)
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 20; // ±10 AQI variation
      data.push({
        time: time.toISOString(),
        aqi: Math.max(0, Math.round(currentAQI + variation)),
        label: time.getHours() + ':00',
        type: 'historical'
      });
    }
    
    // Add forecast data
    forecast.slice(0, 24).forEach((item, index) => {
      const time = new Date(now.getTime() + (index + 1) * 60 * 60 * 1000);
      data.push({
        time: item.dateTime,
        aqi: item.indexes?.[0]?.aqi || currentAQI,
        label: time.getHours() + ':00',
        type: 'forecast'
      });
    });
    
    setChartData(data);
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10B981'; // green
    if (aqi <= 100) return '#F59E0B'; // yellow
    if (aqi <= 150) return '#F97316'; // orange
    if (aqi <= 200) return '#EF4444'; // red
    if (aqi <= 300) return '#8B5CF6'; // purple
    return '#EC4899'; // pink
  };

  const maxAQI = Math.max(...chartData.map(d => d.aqi), 100);
  const minAQI = Math.min(...chartData.map(d => d.aqi), 0);

  return (
    <div className="card-glass backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">AQI Trend Analysis</h3>
            <p className="text-gray-400 text-sm">Real-time and forecast data</p>
          </div>
        </div>
        
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="48h">48 Hours</option>
          <option value="7d">7 Days</option>
        </select>
      </div>

      {chartData.length > 0 && (
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="relative h-64 bg-slate-900/30 rounded-lg p-4 overflow-hidden">
            <svg width="100%" height="100%" className="absolute inset-0">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((value) => (
                <g key={value}>
                  <line
                    x1="0"
                    y1={`${100 - (value / maxAQI) * 100}%`}
                    x2="100%"
                    y2={`${100 - (value / maxAQI) * 100}%`}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x="10"
                    y={`${100 - (value / maxAQI) * 100}%`}
                    fill="rgba(255,255,255,0.5)"
                    fontSize="12"
                    dy="-5"
                  >
                    {value}
                  </text>
                </g>
              ))}
              
              {/* AQI Line */}
              <polyline
                fill="none"
                stroke="url(#aqiGradient)"
                strokeWidth="3"
                points={chartData.map((point, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = 100 - ((point.aqi - minAQI) / (maxAQI - minAQI)) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data Points */}
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const y = 100 - ((point.aqi - minAQI) / (maxAQI - minAQI)) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={getAQIColor(point.aqi)}
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${point.label}: AQI ${point.aqi}`}</title>
                  </circle>
                );
              })}
              
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="aqiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">Historical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300">Forecast</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-400">
              <span>Min: {minAQI}</span>
              <span>Max: {maxAQI}</span>
              <span>Avg: {Math.round(chartData.reduce((sum, d) => sum + d.aqi, 0) / chartData.length)}</span>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-white">24h Trend</span>
              </div>
              <p className="text-xs text-gray-400">
                {chartData.length > 24 && chartData[chartData.length - 1].aqi > chartData[0].aqi ? 
                  'Increasing' : 'Improving'}
              </p>
            </div>
            
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Peak Hours</span>
              </div>
              <p className="text-xs text-gray-400">
                {chartData.length > 0 ? 
                  `${chartData.reduce((max, d, i) => d.aqi > chartData[max].aqi ? i : max, 0)}:00` : 
                  'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIChart;