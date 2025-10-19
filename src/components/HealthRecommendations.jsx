import React, { useState } from 'react';
import { Heart, Shield, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { getHealthRecommendations, getAQICategory } from '../utils/aqiUtils';

const HealthRecommendations = ({ aqi, healthConditions = [], recommendations, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <div className="card-glass animate-pulse">
        <div className="h-6 bg-white/10 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  const healthCondition = Array.isArray(healthConditions) ? healthConditions[0] : healthConditions || 'None';
  
  // Use API recommendations if available, otherwise generate them
  const finalRecommendations = recommendations 
    ? Object.values(recommendations).filter(rec => rec && rec.trim())
    : getHealthRecommendations(aqi, healthCondition);
  const category = getAQICategory(aqi);
  
  const getRecommendationIcon = (index) => {
    if (aqi <= 50) return <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />;
    if (aqi <= 100) return <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />;
    if (aqi <= 200) return <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />;
    return <Heart className="w-5 h-5 text-red-600 flex-shrink-0" />;
  };

  const getHeaderIcon = () => {
    if (aqi <= 100) return <Shield className="w-6 h-6 text-blue-600" />;
    return <Heart className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="card-glass backdrop-blur-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-3">
          {getHeaderIcon()}
          <h3 className="text-lg font-semibold text-white">AI Health Recommendations</h3>
          {healthCondition !== 'None' && (
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 text-sm rounded-full border border-cyan-500/30">
              {healthCondition}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {finalRecommendations.length} recommendations
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-white/10 pt-4">
      
      <div className="p-4 rounded-xl mb-6 bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
        <div className="flex items-center space-x-3 mb-3">
          <div 
            className="w-4 h-4 rounded-full shadow-lg"
            style={{ backgroundColor: category.color }}
          ></div>
          <span className="font-semibold text-white text-lg">
            {category.label}
          </span>
          <div className="ml-auto">
            <span className="text-2xl font-bold text-white">{aqi}</span>
            <span className="text-sm text-gray-400 ml-1">AQI</span>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              backgroundColor: category.color,
              width: `${Math.min((aqi / 500) * 100, 100)}%`
            }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-4">
        {finalRecommendations.map((recommendation, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
            {getRecommendationIcon(index)}
            <p className="text-gray-200 text-sm leading-relaxed flex-1">
              {recommendation}
            </p>
          </div>
        ))}
      </div>
      
          {healthCondition !== 'None' && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">
                  Personalized for {healthCondition}
                </span>
              </div>
              <p className="text-xs text-amber-400/80 mt-1">
                These recommendations are tailored to your health condition. Consult your healthcare provider for specific advice.
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecommendations;