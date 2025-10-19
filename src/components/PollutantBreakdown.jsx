import React from 'react';
import { Droplets, Wind, Zap, Factory, AlertTriangle } from 'lucide-react';

const PollutantBreakdown = ({ pollutants }) => {
  if (!pollutants || pollutants.length === 0) {
    return (
      <div className="card-glass backdrop-blur-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
        <p className="text-gray-400">No pollutant data available</p>
      </div>
    );
  }

  const getPollutantIcon = (code) => {
    const iconProps = { className: "w-5 h-5" };
    switch (code) {
      case 'pm25':
      case 'pm10':
        return <Droplets {...iconProps} className="w-5 h-5 text-orange-400" />;
      case 'o3':
        return <Zap {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'no2':
      case 'so2':
        return <Factory {...iconProps} className="w-5 h-5 text-red-400" />;
      default:
        return <Wind {...iconProps} className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPollutantColor = (code) => {
    switch (code) {
      case 'pm25': return '#F97316'; // orange
      case 'pm10': return '#EAB308'; // yellow
      case 'o3': return '#3B82F6'; // blue
      case 'no2': return '#EF4444'; // red
      case 'so2': return '#8B5CF6'; // purple
      default: return '#6B7280'; // gray
    }
  };

  const getConcentrationLevel = (value, code) => {
    const thresholds = {
      pm25: { low: 12, moderate: 35, high: 55 },
      pm10: { low: 54, moderate: 154, high: 254 },
      o3: { low: 54, moderate: 70, high: 85 },
      no2: { low: 53, moderate: 100, high: 360 },
      so2: { low: 35, moderate: 75, high: 185 }
    };

    const threshold = thresholds[code] || thresholds.pm25;
    
    if (value <= threshold.low) return { level: 'Low', percentage: 25 };
    if (value <= threshold.moderate) return { level: 'Moderate', percentage: 50 };
    if (value <= threshold.high) return { level: 'High', percentage: 75 };
    return { level: 'Very High', percentage: 100 };
  };

  // Calculate total concentration for percentage calculation
  const totalConcentration = pollutants.reduce((sum, p) => sum + (p.concentration?.value || 0), 0);

  return (
    <div className="card-glass backdrop-blur-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
          <Droplets className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Pollutant Breakdown</h3>
          <p className="text-gray-400 text-sm">Real-time concentration levels</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Donut Chart Visualization */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg width="192" height="192" className="transform -rotate-90">
              {pollutants.map((pollutant, index) => {
                const concentration = pollutant.concentration?.value || 0;
                const percentage = totalConcentration > 0 ? (concentration / totalConcentration) * 100 : 0;
                const circumference = 2 * Math.PI * 70; // radius = 70
                const strokeDasharray = circumference;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                
                // Calculate rotation for each segment
                const previousPercentages = pollutants.slice(0, index).reduce((sum, p) => {
                  return sum + (totalConcentration > 0 ? ((p.concentration?.value || 0) / totalConcentration) * 100 : 0);
                }, 0);
                const rotation = (previousPercentages / 100) * 360;

                return (
                  <circle
                    key={pollutant.code}
                    cx="96"
                    cy="96"
                    r="70"
                    fill="transparent"
                    stroke={getPollutantColor(pollutant.code)}
                    strokeWidth="12"
                    strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                    strokeDashoffset="0"
                    transform={`rotate(${rotation} 96 96)`}
                    className="transition-all duration-500"
                  />
                );
              })}
              
              {/* Center circle */}
              <circle
                cx="96"
                cy="96"
                r="50"
                fill="rgba(15, 23, 42, 0.8)"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2"
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{pollutants.length}</div>
                <div className="text-xs text-gray-400">Pollutants</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pollutant List */}
        <div className="space-y-3">
          {pollutants.map((pollutant) => {
            const concentration = pollutant.concentration?.value || 0;
            const units = pollutant.concentration?.units === 'PARTS_PER_BILLION' ? 'ppb' : 'μg/m³';
            const level = getConcentrationLevel(concentration, pollutant.code);
            const percentage = totalConcentration > 0 ? (concentration / totalConcentration) * 100 : 0;

            return (
              <div key={pollutant.code} className="p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getPollutantIcon(pollutant.code)}
                    <div>
                      <h4 className="font-semibold text-white">{pollutant.displayName}</h4>
                      <p className="text-xs text-gray-400">{pollutant.fullName}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {concentration} <span className="text-sm text-gray-400">{units}</span>
                    </div>
                    <div className="text-xs text-gray-400">{percentage.toFixed(1)}% of total</div>
                  </div>
                </div>

                {/* Concentration Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Concentration Level</span>
                    <span className={`font-medium ${
                      level.level === 'Low' ? 'text-green-400' :
                      level.level === 'Moderate' ? 'text-yellow-400' :
                      level.level === 'High' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {level.level}
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${level.percentage}%`,
                        backgroundColor: getPollutantColor(pollutant.code)
                      }}
                    ></div>
                  </div>
                </div>

                {/* Health Impact */}
                {pollutant.additionalInfo?.effects && (
                  <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-gray-400">
                    <strong className="text-gray-300">Health Impact:</strong> {pollutant.additionalInfo.effects}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <div className="text-sm font-medium text-blue-300 mb-1">Dominant Pollutant</div>
            <div className="text-lg font-bold text-white">
              {pollutants.reduce((max, p) => 
                (p.concentration?.value || 0) > (max.concentration?.value || 0) ? p : max
              ).displayName}
            </div>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
            <div className="text-sm font-medium text-orange-300 mb-1">Risk Level</div>
            <div className="text-lg font-bold text-white">
              {pollutants.some(p => getConcentrationLevel(p.concentration?.value || 0, p.code).level === 'Very High') ? 'High' :
               pollutants.some(p => getConcentrationLevel(p.concentration?.value || 0, p.code).level === 'High') ? 'Moderate' : 'Low'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollutantBreakdown;