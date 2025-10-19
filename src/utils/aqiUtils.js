/**
 * Utility functions for AQI calculations and categorization
 */

// AQI Categories and their corresponding colors
export const AQI_CATEGORIES = {
  GOOD: { min: 0, max: 50, label: 'Good', color: '#00E400', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  MODERATE: { min: 51, max: 100, label: 'Moderate', color: '#FFFF00', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#FF7E00', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  UNHEALTHY: { min: 151, max: 200, label: 'Unhealthy', color: '#FF0000', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  VERY_UNHEALTHY: { min: 201, max: 300, label: 'Very Unhealthy', color: '#8F3F97', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  HAZARDOUS: { min: 301, max: 500, label: 'Hazardous', color: '#7E0023', bgColor: 'bg-red-200', textColor: 'text-red-900' }
};

/**
 * Get AQI category based on AQI value
 * @param {number} aqi - AQI value
 * @returns {object} AQI category object
 */
export const getAQICategory = (aqi) => {
  if (aqi <= 50) return AQI_CATEGORIES.GOOD;
  if (aqi <= 100) return AQI_CATEGORIES.MODERATE;
  if (aqi <= 150) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE;
  if (aqi <= 200) return AQI_CATEGORIES.UNHEALTHY;
  if (aqi <= 300) return AQI_CATEGORIES.VERY_UNHEALTHY;
  return AQI_CATEGORIES.HAZARDOUS;
};

/**
 * Get health recommendations based on AQI and user health condition
 * @param {number} aqi - AQI value
 * @param {string} healthCondition - User's health condition
 * @returns {array} Array of health recommendations
 */
export const getHealthRecommendations = (aqi, healthCondition = 'None') => {
  const category = getAQICategory(aqi);
  const recommendations = [];

  switch (category.label) {
    case 'Good':
      recommendations.push('Air quality is satisfactory. Enjoy outdoor activities!');
      break;
    case 'Moderate':
      recommendations.push('Air quality is acceptable for most people.');
      if (['Asthma', 'Heart Disease'].includes(healthCondition)) {
        recommendations.push('Consider reducing prolonged outdoor exertion if you experience symptoms.');
      }
      break;
    case 'Unhealthy for Sensitive Groups':
      recommendations.push('Sensitive groups should reduce outdoor activities.');
      if (['Asthma', 'Heart Disease', 'Child', 'Elderly'].includes(healthCondition)) {
        recommendations.push('Avoid prolonged outdoor activities. Consider wearing a mask outdoors.');
      }
      break;
    case 'Unhealthy':
      recommendations.push('Everyone should reduce outdoor activities.');
      recommendations.push('Wear a mask when going outside.');
      recommendations.push('Keep windows closed and use air purifiers indoors.');
      break;
    case 'Very Unhealthy':
      recommendations.push('Avoid all outdoor activities.');
      recommendations.push('Stay indoors with windows and doors closed.');
      recommendations.push('Use air purifiers and avoid outdoor exercise.');
      break;
    case 'Hazardous':
      recommendations.push('Emergency conditions - avoid all outdoor activities.');
      recommendations.push('Stay indoors and seal your home.');
      recommendations.push('Consider relocating temporarily if possible.');
      break;
    default:
      recommendations.push('Monitor air quality regularly.');
  }

  return recommendations;
};

/**
 * Convert coordinates to location string for API calls
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Location string for API
 */
export const formatLocationForAPI = (lat, lng) => {
  return `${lat},${lng}`;
};

/**
 * Calculate AQI from pollutant concentration (simplified US EPA formula)
 * @param {number} concentration - Pollutant concentration
 * @param {string} pollutant - Pollutant type (PM2.5, PM10, etc.)
 * @returns {number} Calculated AQI
 */
export const calculateAQI = (concentration, pollutant) => {
  // Simplified AQI calculation for PM2.5 (most common)
  if (pollutant === 'PM2_5') {
    if (concentration <= 12) return Math.round((50 / 12) * concentration);
    if (concentration <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (concentration - 12.1) + 51);
    if (concentration <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (concentration - 35.5) + 101);
    if (concentration <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (concentration - 55.5) + 151);
    if (concentration <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (concentration - 150.5) + 201);
    return Math.round(((500 - 301) / (500.4 - 250.5)) * (concentration - 250.5) + 301);
  }
  
  // For other pollutants, return a simplified calculation
  return Math.min(Math.round(concentration * 2), 500);
};