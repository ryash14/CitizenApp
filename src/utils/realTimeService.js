/**
 * Real-time data service for enhanced app functionality
 */

class RealTimeService {
  constructor() {
    this.subscribers = new Map();
    this.updateInterval = null;
    this.isActive = false;
  }

  /**
   * Start real-time updates
   * @param {number} interval - Update interval in milliseconds
   */
  start(interval = 300000) { // 5 minutes default
    if (this.isActive) return;
    
    this.isActive = true;
    this.updateInterval = setInterval(() => {
      this.notifySubscribers();
    }, interval);
    
    console.log('Real-time service started');
  }

  /**
   * Stop real-time updates
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
    console.log('Real-time service stopped');
  }

  /**
   * Subscribe to real-time updates
   * @param {string} key - Unique subscriber key
   * @param {function} callback - Callback function to execute on updates
   */
  subscribe(key, callback) {
    this.subscribers.set(key, callback);
    console.log(`Subscribed: ${key}`);
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} key - Subscriber key to remove
   */
  unsubscribe(key) {
    this.subscribers.delete(key);
    console.log(`Unsubscribed: ${key}`);
  }

  /**
   * Notify all subscribers of updates
   */
  async notifySubscribers() {
    console.log('Notifying subscribers of real-time updates');
    
    for (const [key, callback] of this.subscribers) {
      try {
        await callback();
      } catch (error) {
        console.error(`Error in subscriber ${key}:`, error);
      }
    }
  }

  /**
   * Get enhanced location data with nearby AQI stations
   * @param {object} location - User location {lat, lng}
   * @returns {Promise<object>} Enhanced location data
   */
  async getEnhancedLocationData(location) {
    try {
      // Get nearby AQI monitoring stations
      const nearbyStations = await this.getNearbyAQIStations(location);
      
      // Get area demographics for better recommendations
      const demographics = await this.getAreaDemographics(location);
      
      // Get traffic patterns
      const trafficData = await this.getTrafficPatterns(location);
      
      return {
        ...location,
        nearbyStations,
        demographics,
        trafficData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting enhanced location data:', error);
      return location;
    }
  }

  /**
   * Get nearby AQI monitoring stations
   */
  async getNearbyAQIStations(location) {
    try {
      // This would typically call a government API for monitoring stations
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&keyword=air+quality+monitoring&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.results.map(station => ({
          id: station.place_id,
          name: station.name,
          distance: this.calculateDistance(location, station.geometry.location),
          coordinates: station.geometry.location
        }));
      }
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
    }
    
    return [];
  }

  /**
   * Get area demographics for personalized recommendations
   */
  async getAreaDemographics(location) {
    // This would typically integrate with census or demographic APIs
    return {
      populationDensity: 'high',
      averageAge: 32,
      healthRisk: 'moderate',
      vulnerablePopulation: 25 // percentage
    };
  }

  /**
   * Get traffic patterns for route optimization
   */
  async getTrafficPatterns(location) {
    try {
      // This would integrate with Google Traffic API or similar
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
      
      return {
        currentLevel: isRushHour ? 'high' : 'moderate',
        peakHours: ['08:00-10:00', '17:00-20:00'],
        averageSpeed: isRushHour ? 15 : 35, // km/h
        congestionFactor: isRushHour ? 2.5 : 1.2
      };
    } catch (error) {
      console.error('Error fetching traffic patterns:', error);
      return { currentLevel: 'moderate', peakHours: [], averageSpeed: 25, congestionFactor: 1.5 };
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(from, to) {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Generate personalized health alerts based on real-time conditions
   */
  async generatePersonalizedAlerts(userProfile, currentAQI) {
    const alerts = [];
    
    // Health condition based alerts
    if (userProfile.healthConditions?.includes('Asthma') && currentAQI > 100) {
      alerts.push({
        type: 'health',
        priority: 'high',
        message: 'High AQI detected. Consider staying indoors and using your inhaler if needed.',
        action: 'Stay indoors'
      });
    }
    
    // Time-based alerts
    const currentHour = new Date().getHours();
    if (currentAQI > 150 && currentHour >= 6 && currentHour <= 10) {
      alerts.push({
        type: 'timing',
        priority: 'medium',
        message: 'Morning exercise not recommended due to high pollution levels.',
        action: 'Postpone outdoor activities'
      });
    }
    
    // Weather-based alerts (would integrate with weather API)
    const isWindy = Math.random() > 0.7; // Simulate weather data
    if (currentAQI > 200 && !isWindy) {
      alerts.push({
        type: 'weather',
        priority: 'high',
        message: 'Low wind conditions are trapping pollutants. Air quality may worsen.',
        action: 'Avoid outdoor activities'
      });
    }
    
    return alerts;
  }

  /**
   * Get air quality predictions using ML-like analysis
   */
  async getAQIPredictions(location, historicalData) {
    try {
      // Analyze patterns in historical data
      const trends = this.analyzeAQITrends(historicalData);
      
      // Generate predictions for next 24 hours
      const predictions = [];
      const baseAQI = historicalData[historicalData.length - 1]?.aqi || 100;
      
      for (let hour = 1; hour <= 24; hour++) {
        const futureTime = new Date(Date.now() + hour * 60 * 60 * 1000);
        const hourOfDay = futureTime.getHours();
        
        // Apply time-of-day patterns
        let predictedAQI = baseAQI;
        if (hourOfDay >= 7 && hourOfDay <= 10) predictedAQI *= 1.2; // Morning rush
        if (hourOfDay >= 17 && hourOfDay <= 20) predictedAQI *= 1.3; // Evening rush
        if (hourOfDay >= 22 || hourOfDay <= 5) predictedAQI *= 0.8; // Night reduction
        
        // Apply trend
        predictedAQI += trends.hourlyChange * hour;
        
        predictions.push({
          time: futureTime.toISOString(),
          aqi: Math.max(0, Math.round(predictedAQI)),
          confidence: Math.max(0.6, 1 - (hour * 0.02)) // Confidence decreases over time
        });
      }
      
      return predictions;
    } catch (error) {
      console.error('Error generating AQI predictions:', error);
      return [];
    }
  }

  /**
   * Analyze AQI trends from historical data
   */
  analyzeAQITrends(data) {
    if (!data || data.length < 2) {
      return { hourlyChange: 0, trend: 'stable', volatility: 'low' };
    }
    
    const recent = data.slice(-6); // Last 6 hours
    const changes = recent.slice(1).map((point, i) => point.aqi - recent[i].aqi);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    
    const volatility = Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length);
    
    return {
      hourlyChange: avgChange,
      trend: avgChange > 2 ? 'increasing' : avgChange < -2 ? 'decreasing' : 'stable',
      volatility: volatility > 10 ? 'high' : volatility > 5 ? 'medium' : 'low'
    };
  }
}

// Create and export singleton
const realTimeService = new RealTimeService();
export default realTimeService;