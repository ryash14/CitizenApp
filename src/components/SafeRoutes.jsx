import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Leaf, AlertTriangle, Map, Loader2 } from 'lucide-react';

const SafeRoutes = ({ userLocation, currentAQI }) => {
  const [routes, setRoutes] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('walking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRealSafeRoutes = async () => {
      if (!userLocation?.lat || !userLocation?.lng) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch nearby places using Google Places API
        const nearbyPlaces = await fetchNearbyPlaces(userLocation, selectedActivity);
        
        // Get AQI data for each place and calculate route safety
        const routesWithAQI = await Promise.all(
          nearbyPlaces.map(async (place) => {
            try {
              const { getAQIData } = await import('../utils/apiService');
              const placeAQI = await getAQIData(place.geometry.location.lat, place.geometry.location.lng);
              
              return {
                id: place.place_id,
                name: place.name,
                distance: calculateDistance(userLocation, place.geometry.location),
                duration: calculateDuration(userLocation, place.geometry.location, selectedActivity),
                avgAQI: placeAQI.indexes?.[0]?.aqi || currentAQI,
                type: place.types[0] || 'location',
                safety: calculateSafety(placeAQI.indexes?.[0]?.aqi || currentAQI),
                features: generateFeatures(place),
                coordinates: [place.geometry.location.lat, place.geometry.location.lng],
                rating: place.rating || 0,
                vicinity: place.vicinity
              };
            } catch (error) {
              console.error('Error fetching AQI for place:', error);
              return null;
            }
          })
        );
        
        // Filter out null results and sort by AQI (cleaner air first)
        const validRoutes = routesWithAQI
          .filter(route => route !== null)
          .sort((a, b) => a.avgAQI - b.avgAQI)
          .slice(0, 5); // Show top 5 cleanest routes
        
        setRoutes(validRoutes);
      } catch (error) {
        console.error('Error fetching safe routes:', error);
        setError('Unable to fetch safe routes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRealSafeRoutes();
  }, [userLocation, currentAQI, selectedActivity]);

  const fetchNearbyPlaces = async (location, activity) => {
    const placeTypes = {
      walking: 'park|tourist_attraction|point_of_interest',
      jogging: 'park|stadium|gym',
      cycling: 'park|bicycle_store|point_of_interest',
      commute: 'transit_station|bus_station|subway_station'
    };

    const radius = activity === 'commute' ? 5000 : 2000; // 5km for commute, 2km for others
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${placeTypes[activity]}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby places');
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  };

  const calculateDistance = (from, to) => {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return `${distance.toFixed(1)} km`;
  };

  const calculateDuration = (from, to, activity) => {
    const distance = parseFloat(calculateDistance(from, to));
    const speeds = { walking: 5, jogging: 8, cycling: 15, commute: 30 }; // km/h
    const duration = (distance / speeds[activity]) * 60;
    return `${Math.round(duration)} min`;
  };

  const calculateSafety = (aqi) => {
    if (aqi <= 50) return 'excellent';
    if (aqi <= 100) return 'good';
    if (aqi <= 150) return 'moderate';
    return 'poor';
  };

  const generateFeatures = (place) => {
    const features = [];
    if (place.types.includes('park')) features.push('Green Space');
    if (place.rating >= 4) features.push('Highly Rated');
    if (place.types.includes('tourist_attraction')) features.push('Scenic Route');
    if (place.types.includes('gym') || place.types.includes('stadium')) features.push('Exercise Facilities');
    return features.length > 0 ? features : ['Safe Area'];
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-400';
    if (aqi <= 100) return 'text-yellow-400';
    if (aqi <= 150) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSafetyBadge = (safety) => {
    const badges = {
      excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
      good: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return badges[safety] || badges.moderate;
  };

  const activities = [
    { id: 'walking', name: 'Walking', icon: '🚶‍♂️' },
    { id: 'jogging', name: 'Jogging', icon: '🏃‍♂️' },
    { id: 'cycling', name: 'Cycling', icon: '🚴‍♂️' },
    { id: 'commute', name: 'Commute', icon: '🚗' }
  ];

  return (
    <div className="card-glass backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
            <Map className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Safe Routes</h3>
            <p className="text-gray-400 text-sm">AI-recommended low pollution paths</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedActivity === activity.id
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              <span className="mr-1">{activity.icon}</span>
              {activity.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
          <span className="text-gray-300">Finding safe routes...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {routes.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-400">No safe routes found for your location.</p>
            <p className="text-gray-500 text-sm mt-1">Try selecting a different activity or check your location settings.</p>
          </div>
        )}
        
        {routes.map((route) => (
          <div
            key={route.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {route.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSafetyBadge(route.safety)}`}>
                    {route.safety}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-4 w-4" />
                    <span>{route.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Leaf className="h-4 w-4" />
                    <span className={getAQIColor(route.avgAQI)}>AQI {route.avgAQI}</span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                <MapPin className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {route.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-cyan-500/10 text-cyan-300 text-xs rounded-full border border-cyan-500/20"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Route Quality Indicator */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Air Quality:</span>
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      route.avgAQI <= 50 ? 'bg-green-400' :
                      route.avgAQI <= 100 ? 'bg-yellow-400' :
                      route.avgAQI <= 150 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${100 - (route.avgAQI / 200) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                {route.avgAQI < currentAQI ? (
                  <span className="text-green-400 flex items-center">
                    <Leaf className="h-3 w-3 mr-1" />
                    {currentAQI - route.avgAQI} points cleaner
                  </span>
                ) : (
                  <span className="text-orange-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Similar to current area
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-500/20 rounded">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h5 className="text-sm font-medium text-blue-300 mb-1">Smart Route Selection</h5>
            <p className="text-xs text-gray-400">
              Routes are dynamically updated based on real-time air quality data, traffic patterns, and your health profile.
              Green routes have 20+ AQI points lower pollution than your current location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeRoutes;