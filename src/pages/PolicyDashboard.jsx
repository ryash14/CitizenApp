import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Factory,
  Car,
  Flame,
  Wind,
  ArrowLeft,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Calendar,
} from "lucide-react";

const PolicyDashboard = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [selectedRegion, setSelectedRegion] = useState("delhi-ncr");

  // Mock data for policy dashboard
  const sourceContribution = [
    {
      source: "Vehicular Emissions",
      percentage: 35,
      trend: "up",
      color: "bg-red-500",
    },
    {
      source: "Stubble Burning",
      percentage: 28,
      trend: "down",
      color: "bg-orange-500",
    },
    {
      source: "Industrial",
      percentage: 20,
      trend: "stable",
      color: "bg-yellow-500",
    },
    {
      source: "Construction",
      percentage: 12,
      trend: "down",
      color: "bg-blue-500",
    },
    { source: "Others", percentage: 5, trend: "stable", color: "bg-gray-500" },
  ];

  const interventions = [
    {
      name: "Odd-Even Policy",
      effectiveness: 78,
      status: "active",
      impact: "-15% vehicular emissions",
      duration: "15 days",
      cost: "₹2.5 Cr",
      aqiReduction: 12,
    },
    {
      name: "Construction Ban",
      effectiveness: 65,
      status: "active",
      impact: "-8% dust pollution",
      duration: "30 days",
      cost: "₹50 Cr",
      aqiReduction: 8,
    },
    {
      name: "Firecracker Ban",
      effectiveness: 85,
      status: "seasonal",
      impact: "-25% PM2.5 spike",
      duration: "Festival period",
      cost: "₹5 Cr",
      aqiReduction: 20,
    },
  ];

  const aiRecommendations = [
    {
      priority: "high",
      title: "Implement Emergency Vehicle Restrictions",
      description:
        "Current AQI levels suggest immediate vehicular restrictions in Central Delhi",
      expectedImpact: "18-22% AQI reduction",
      timeframe: "Immediate",
      confidence: 92,
    },
    {
      priority: "medium",
      title: "Enhance Public Transport Frequency",
      description:
        "Increase metro and bus frequency by 30% to reduce private vehicle usage",
      expectedImpact: "8-12% emission reduction",
      timeframe: "2-3 days",
      confidence: 85,
    },
    {
      priority: "medium",
      title: "Deploy Water Sprinklers on Major Roads",
      description:
        "Target dust suppression on 15 major arterial roads during peak hours",
      expectedImpact: "5-8% dust reduction",
      timeframe: "1 day",
      confidence: 78,
    },
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-red-500/50 bg-red-500/10";
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "low":
        return "border-green-500/50 bg-green-500/10";
      default:
        return "border-gray-500/50 bg-gray-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white text-shadow">
                    Policy Dashboard
                  </h1>
                  <p className="text-gray-300 text-lg">
                    AI-Powered Policy Intelligence & Intervention Analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="input-field bg-slate-800/50 border-slate-600/50 text-white"
              >
                <option value="delhi-ncr">Delhi NCR</option>
                <option value="mumbai">Mumbai</option>
                <option value="bangalore">Bangalore</option>
              </select>

              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input-field bg-slate-800/50 border-slate-600/50 text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <span className="text-xs text-gray-400">Current Status</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">Severe</div>
            <div className="text-sm text-gray-400">
              AQI: 287 (+12 from yesterday)
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-xs text-gray-400">
                Active Interventions
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">3</div>
            <div className="text-sm text-gray-400">Avg. Effectiveness: 76%</div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingDown className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-xs text-gray-400">Projected Impact</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">-18%</div>
            <div className="text-sm text-gray-400">AQI reduction in 7 days</div>
          </div>

          <div className="card-glass p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Lightbulb className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-xs text-gray-400">AI Confidence</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">89%</div>
            <div className="text-sm text-gray-400">Recommendation accuracy</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Source Contribution */}
          <div className="card-glass">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Pollution Source Breakdown
              </h3>
              <div className="text-sm text-gray-400">Real-time Analysis</div>
            </div>

            <div className="space-y-4">
              {sourceContribution.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${source.color}`}></div>
                    <span className="text-white font-medium">
                      {source.source}
                    </span>
                    {getTrendIcon(source.trend)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${source.color} transition-all duration-500`}
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-semibold w-12 text-right">
                      {source.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Effectiveness */}
          <div className="card-glass">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Intervention Effectiveness
              </h3>
              <div className="text-sm text-gray-400">Current Policies</div>
            </div>

            <div className="space-y-4">
              {interventions.map((intervention, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-white font-semibold">
                        {intervention.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          intervention.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : intervention.status === "seasonal"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {intervention.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {intervention.effectiveness}%
                      </div>
                      <div className="text-xs text-gray-400">Effectiveness</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Impact</div>
                      <div className="text-cyan-400 font-medium">
                        {intervention.impact}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Duration</div>
                      <div className="text-white">{intervention.duration}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">AQI Reduction</div>
                      <div className="text-green-400 font-medium">
                        -{intervention.aqiReduction}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card-glass">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                <Lightbulb className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  AI-Generated Recommendations
                </h3>
                <p className="text-gray-400 text-sm">
                  Targeted interventions for maximum impact
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-400">Updated 5 min ago</div>
          </div>

          <div className="space-y-4">
            {aiRecommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(
                  rec.priority
                )}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-semibold">{rec.title}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === "high"
                            ? "bg-red-500/20 text-red-400"
                            : rec.priority === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">
                      {rec.description}
                    </p>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Expected Impact</div>
                        <div className="text-cyan-400 font-medium">
                          {rec.expectedImpact}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Timeframe</div>
                        <div className="text-white">{rec.timeframe}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">AI Confidence</div>
                        <div className="text-green-400 font-medium">
                          {rec.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="ml-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                    Implement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDashboard;
