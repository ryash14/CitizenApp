import React from 'react';
import { Droplets, Wind, Zap, Factory } from 'lucide-react';

const PollutantCard = ({ pollutant, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded-full w-4"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  const getIcon = (code) => {
    const iconProps = { className: "w-5 h-5" };
    switch (code) {
      case 'pm25':
      case 'pm10':
        return <Droplets {...iconProps} className="w-5 h-5 text-brown-600" />;
      case 'o3':
        return <Zap {...iconProps} className="w-5 h-5 text-blue-600" />;
      case 'no2':
      case 'so2':
        return <Factory {...iconProps} className="w-5 h-5 text-gray-600" />;
      default:
        return <Wind {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConcentrationLevel = (value, code) => {
    // Simplified thresholds for different pollutants
    const thresholds = {
      pm25: { low: 12, moderate: 35, high: 55 },
      pm10: { low: 54, moderate: 154, high: 254 },
      o3: { low: 54, moderate: 70, high: 85 },
      no2: { low: 53, moderate: 100, high: 360 },
      so2: { low: 35, moderate: 75, high: 185 }
    };

    const threshold = thresholds[code] || thresholds.pm25;
    
    if (value <= threshold.low) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= threshold.moderate) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (value <= threshold.high) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Very High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const concentration = pollutant.concentration?.value || 0;
  const units = pollutant.concentration?.units === 'PARTS_PER_BILLION' ? 'ppb' : 'μg/m³';
  const level = getConcentrationLevel(concentration, pollutant.code);

  return (
    <div className="card hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getIcon(pollutant.code)}
          <span className="font-semibold text-white">{pollutant.displayName}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${level.bg} ${level.color}`}>
          {level.level}
        </div>
      </div>
      
      <div className="mb-2">
        <span className="text-2xl font-bold text-white">{concentration}</span>
        <span className="text-sm text-gray-500 ml-1">{units}</span>
      </div>
      
      <div className="text-xs text-gray-600">
        {pollutant.fullName}
      </div>
      
      {pollutant.additionalInfo?.effects && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          <strong>Effects:</strong> {pollutant.additionalInfo.effects}
        </div>
      )}
    </div>
  );
};

export default PollutantCard;