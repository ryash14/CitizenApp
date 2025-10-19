import React from "react";
import { getAQICategory } from "../utils/aqiUtils";
import { Wind, AlertTriangle, CheckCircle } from "lucide-react";

const AQICard = React.memo(({ data, isLoading = false }) => {
  const aqi = data?.indexes?.[0]?.aqi || 0;
  const location = data?.regionCode || "Unknown";
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="text-center">
          <div className="h-16 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
        </div>
      </div>
    );
  }

  const category = getAQICategory(aqi);

  const getIcon = () => {
    if (aqi <= 100) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (aqi <= 200)
      return <AlertTriangle className="w-6 h-6 text-orange-600" />;
    return <Wind className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="card hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="text-lg font-semibold text-white">
            Air Quality Index
          </h3>
        </div>
        <span className="text-sm text-gray-500">{location}</span>
      </div>

      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full text-white font-bold text-2xl mb-4 shadow-lg"
          style={{ backgroundColor: category.color }}
        >
          {aqi}
        </div>

        <div
          className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${category.bgColor} ${category.textColor}`}
        >
          {category.label}
        </div>

        <div className="mt-4 text-gray-600">
          <p className="text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
});

AQICard.displayName = "AQICard";

export default AQICard;
