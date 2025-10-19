import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import AQICard from "../components/AQICard";
import PollutantCard from "../components/PollutantCard";
import ForecastChart from "../components/ForecastChart";
import HealthRecommendations from "../components/HealthRecommendations";
import SafeRoutes from "../components/SafeRoutes";
import AQIChart from "../components/AQIChart";
import PollutantBreakdown from "../components/PollutantBreakdown";
import LoadingScreen from "../components/LoadingScreen";
import DebugInfo from "../components/DebugInfo";
import { getAQIData, getForecastData } from "../utils/apiService";
import { Settings, BarChart3, Wind } from "lucide-react";
import emailService from "../utils/emailService";
import "../utils/testAPI"; // Import test function for debugging

const Dashboard = () => {
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Loading timeout reached, stopping loading state");
      setLoadingTimeout(true);
      setIsLoading(false);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          console.log("Fetching user profile for:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User profile found:", userData);
            setUserProfile(userData);
          } else {
            console.log("No user profile found, redirecting to profile setup");
            navigate("/profile-setup");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user, navigate]);

  useEffect(() => {
    const fetchAQIData = async () => {
      if (userProfile?.location?.lat && userProfile?.location?.lng) {
        try {
          console.log("Fetching AQI data for location:", userProfile.location);
          setIsLoading(true);

          // Initialize email service
          await emailService.initialize();
          
          // Set up daily email if enabled
          if (userProfile.dailyEmailEnabled && user?.email) {
            emailService.scheduleDailyEmail(
              user.uid,
              user.email,
              userProfile.name || 'User',
              userProfile.dailyEmailTime || '08:00',
              userProfile
            );
          }

          // Fetch AQI data first (priority)
          const aqi = await getAQIData(
            userProfile.location.lat,
            userProfile.location.lng
          );
          console.log("AQI data received:", aqi);
          setAqiData(aqi);
          setIsLoading(false); // Show AQI immediately

          // Fetch forecast data in background
          setTimeout(async () => {
            try {
              const forecast = await getForecastData(
                userProfile.location.lat,
                userProfile.location.lng
              );
              console.log("Forecast data received:", forecast);
              setForecastData(forecast);
            } catch (error) {
              console.error("Error fetching forecast data:", error);
            }
          }, 100);
        } catch (error) {
          console.error("Error fetching AQI data:", error);
          setIsLoading(false);
        }
      } else if (userProfile && !userProfile.location?.lat) {
        console.log("No location found in profile, redirecting to setup");
        navigate("/profile-setup");
      } else if (userProfile === null) {
        // Still loading user profile
        console.log("User profile still loading...");
      }
    };

    if (userProfile !== null) {
      fetchAQIData();
    }
  }, [userProfile, navigate]);

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (isLoading && !aqiData) {
    return <LoadingScreen message="Loading air quality data..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            Error loading dashboard: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <Wind className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white text-shadow">
                  Welcome back, {userProfile?.name || user.displayName || "User"}!
                </h1>
                <p className="text-gray-300 mt-1 text-lg">
                  Hyperlocal Air Quality Intelligence for{" "}
                  <span className="text-cyan-400 font-semibold">
                    {userProfile?.location?.city || "your location"}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/policy-dashboard")}
                className="btn-secondary flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Policy Dashboard</span>
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{aqiData?.indexes?.[0]?.aqi || '--'}</div>
              <div className="text-sm text-gray-400">Current AQI</div>
            </div>
            <div className="card-glass p-4 text-center">
              <div className="text-2xl font-bold text-green-400">3</div>
              <div className="text-sm text-gray-400">Safe Routes</div>
            </div>
            <div className="card-glass p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">2</div>
              <div className="text-sm text-gray-400">Active Alerts</div>
            </div>
            <div className="card-glass p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">85%</div>
              <div className="text-sm text-gray-400">Health Score</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {aqiData ? (
          <div className="space-y-8">
            {/* AQI Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AQICard data={aqiData} />
              <AQIChart aqiData={aqiData} forecastData={forecastData} />
            </div>

            {/* Health Recommendations - Collapsible */}
            <HealthRecommendations
              aqi={aqiData.indexes?.[0]?.aqi || 0}
              healthConditions={userProfile?.healthConditions || []}
              recommendations={aqiData.healthRecommendations}
            />

            {/* Pollutant Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PollutantBreakdown pollutants={aqiData.pollutants} />
              <div className="grid grid-cols-1 gap-4">
                {aqiData.pollutants && Array.isArray(aqiData.pollutants) &&
                  aqiData.pollutants.slice(0, 4).map((pollutant) => (
                    <PollutantCard
                      key={pollutant.code}
                      pollutant={pollutant}
                    />
                  ))}
              </div>
            </div>

            {/* Safe Routes */}
            <SafeRoutes 
              userLocation={userProfile?.location} 
              currentAQI={aqiData?.indexes?.[0]?.aqi || 0}
            />

            {/* Forecast Chart */}
            {forecastData && (
              <div className="card-glass backdrop-blur-xl">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Air Quality Forecast
                </h2>
                <ForecastChart data={forecastData} />
              </div>
            )}
          </div>
        ) : loadingTimeout ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
              <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unable to Load Air Quality Data
              </h3>
              <p className="text-gray-600 mb-4">
                We're having trouble fetching air quality data. This could be
                due to:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-4 space-y-1">
                <li>• Network connectivity issues</li>
                <li>• API service temporarily unavailable</li>
                <li>• Location not properly set</li>
              </ul>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate("/profile-setup")}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Check Location Settings
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No air quality data available. Please check your location
              settings.
            </p>
          </div>
        )}
      </div>

      {/* Debug Info - only in development */}
      {process.env.NODE_ENV === "development" && (
        <DebugInfo
          user={user}
          userProfile={userProfile}
          aqiData={aqiData}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Dashboard;
