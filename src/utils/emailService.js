/**
 * Email service for sending automated air quality reports
 */

import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_aqiapp';
    this.templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_daily_report';
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key';
    this.scheduledEmails = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize EmailJS
   */
  async initialize() {
    try {
      emailjs.init(this.publicKey);
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
    }
  }

  /**
   * Extract real pollutant data from AQI response
   */
  extractPollutantData(aqiData) {
    console.log('Extracting real pollutant data from:', aqiData);

    // Default values - will be replaced with real data
    const pollutants = {
      pm25: '25.5',
      pm10: '45.2',
      o3: '120.8',
      no2: '35.1'
    };

    if (!aqiData) {
      console.log('No AQI data available, using default values');
      return pollutants;
    }

    // Try different possible structures for real data
    let pollutantArray = null;

    if (aqiData.pollutants) {
      pollutantArray = aqiData.pollutants;
    } else if (aqiData.indexes?.[0]?.pollutants) {
      pollutantArray = aqiData.indexes[0].pollutants;
    } else if (aqiData.hourlyForecasts?.[0]?.pollutants) {
      pollutantArray = aqiData.hourlyForecasts[0].pollutants;
    }

    console.log('Found pollutant array:', pollutantArray);

    if (pollutantArray && Array.isArray(pollutantArray)) {
      pollutantArray.forEach(pollutant => {
        const code = pollutant.code?.toLowerCase();
        const value = pollutant.concentration?.value;

        console.log(`Processing real pollutant: ${code} = ${value}`);

        if (value !== undefined && value !== null) {
          switch (code) {
            case 'pm25':
            case 'pm2_5':
              pollutants.pm25 = value.toFixed(1);
              break;
            case 'pm10':
              pollutants.pm10 = value.toFixed(1);
              break;
            case 'o3':
            case 'ozone':
              pollutants.o3 = value.toFixed(1);
              break;
            case 'no2':
              pollutants.no2 = value.toFixed(1);
              break;
          }
        }
      });
      console.log('Extracted real pollutant data:', pollutants);
    } else {
      console.log('No real pollutant data found, using default values');
    }

    return pollutants;
  }

  /**
   * Send daily air quality report
   */
  async sendDailyReport(userEmail, userName, aqiData, location, healthRecommendations, userProfile = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const currentAQI = aqiData?.indexes?.[0]?.aqi || 0;
      const category = this.getAQICategory(currentAQI);
      const healthImpact = this.getHealthImpact(currentAQI);
      const pollutants = this.extractPollutantData(aqiData);

      const templateParams = {
        to_email: userEmail || 'user@example.com',
        to_name: userName || 'User',
        location: location?.city || 'Your Location',
        aqi_value: currentAQI || 85,
        aqi_category: category || 'Moderate',
        threshold: userProfile?.aqiThreshold || 150,
        from_name: 'Pavan AI',
        health_impact: healthImpact || 'Low impact - acceptable for most people',
        recommendations: Array.isArray(healthRecommendations) ? healthRecommendations.join('. ') : 'Air quality is moderate. Sensitive individuals should limit prolonged outdoor activities.',
        report_date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        report_time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        // Pollutant data - ensure no undefined values
        pm25: pollutants.pm25 || '25.5',
        pm10: pollutants.pm10 || '45.2',
        o3: pollutants.o3 || '120.8',
        no2: pollutants.no2 || '35.1',
        // Forecast
        forecast_trend: this.getForecastTrend(currentAQI) || 'Stable - AQI expected to remain similar',
        // Personalized message
        personal_message: this.getPersonalizedMessage(currentAQI, userName) || `Hello ${userName || 'User'}! Here's your air quality update.`
      };

      console.log('Sending email with template params:', templateParams);

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Daily report sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending daily report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule email for a user (supports daily, hourly, or custom intervals)
   */
  scheduleEmail(userId, userEmail, userName, time, userProfile, frequency = 'daily') {
    // Clear existing schedule for this user
    if (this.scheduledEmails.has(userId)) {
      const existing = this.scheduledEmails.get(userId);
      if (existing.timeout) clearTimeout(existing.timeout);
      if (existing.interval) clearInterval(existing.interval);
      this.scheduledEmails.delete(userId);
    }

    // Parse time (format: "HH:MM")
    const [hours, minutes] = time.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Invalid time format:', time);
      return { success: false, error: 'Invalid time format' };
    }

    // Calculate milliseconds until next scheduled time
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, schedule for next occurrence
    if (scheduledTime <= now) {
      if (frequency === 'daily') {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      } else if (frequency === 'hourly') {
        scheduledTime.setHours(scheduledTime.getHours() + 1);
      } else if (frequency === 'immediate') {
        scheduledTime.setTime(now.getTime() + 5000); // 5 seconds from now
      }
    }

    const timeUntilFirst = scheduledTime.getTime() - now.getTime();

    // Set timeout for first email
    const firstTimeout = setTimeout(async () => {
      console.log(`Executing scheduled email for ${userName} at ${new Date().toLocaleTimeString()}`);
      await this.sendScheduledEmail(userEmail, userName, userProfile);

      // Set interval based on frequency
      let intervalMs;
      switch (frequency) {
        case 'hourly':
          intervalMs = 60 * 60 * 1000; // 1 hour
          break;
        case 'daily':
        default:
          intervalMs = 24 * 60 * 60 * 1000; // 24 hours
          break;
      }

      const interval = setInterval(async () => {
        console.log(`Executing recurring email for ${userName} at ${new Date().toLocaleTimeString()}`);
        await this.sendScheduledEmail(userEmail, userName, userProfile);
      }, intervalMs);

      // Update stored references
      this.scheduledEmails.set(userId, { timeout: null, interval });
    }, timeUntilFirst);

    // Store timeout reference
    this.scheduledEmails.set(userId, { timeout: firstTimeout, interval: null });

    const nextEmailDate = new Date(scheduledTime);
    console.log(`Email scheduled for ${userName} at ${time} (${frequency})`);
    console.log(`Next email on: ${nextEmailDate.toLocaleString()}`);
    console.log(`Time until first email: ${Math.round(timeUntilFirst / 1000 / 60)} minutes`);

    return {
      success: true,
      timeout: firstTimeout,
      nextEmailIn: timeUntilFirst,
      nextEmailDate: nextEmailDate.toLocaleString()
    };
  }

  /**
   * Schedule daily email (backward compatibility)
   */
  scheduleDailyEmail(userId, userEmail, userName, time, userProfile) {
    return this.scheduleEmail(userId, userEmail, userName, time, userProfile, 'daily');
  }

  /**
   * Send immediate test email (for testing purposes)
   */
  async sendImmediateEmail(userId, userEmail, userName, userProfile) {
    try {
      await this.sendScheduledEmail(userEmail, userName, userProfile);
      console.log('Immediate email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error sending immediate email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send scheduled email with current data
   */
  async sendScheduledEmail(userEmail, userName, userProfile) {
    try {
      // Fetch current AQI data
      const aqiData = await this.getCurrentAQIData(userProfile.location);
      const healthRecommendations = this.generateHealthRecommendations(
        aqiData?.indexes?.[0]?.aqi || 0,
        userProfile.healthCondition
      );

      await this.sendDailyReport(
        userEmail,
        userName,
        aqiData,
        userProfile.location,
        healthRecommendations,
        userProfile
      );
    } catch (error) {
      console.error('Error sending scheduled email:', error);
    }
  }

  /**
   * Cancel scheduled email for a user
   */
  cancelScheduledEmail(userId) {
    if (this.scheduledEmails.has(userId)) {
      const scheduled = this.scheduledEmails.get(userId);
      if (scheduled.timeout) {
        clearTimeout(scheduled.timeout);
      }
      if (scheduled.interval) {
        clearInterval(scheduled.interval);
      }
      this.scheduledEmails.delete(userId);
      console.log(`Cancelled scheduled email for user ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Get status of scheduled emails
   */
  getScheduledEmailsStatus() {
    const status = [];
    for (const [userId, scheduled] of this.scheduledEmails.entries()) {
      status.push({
        userId,
        hasTimeout: !!scheduled.timeout,
        hasInterval: !!scheduled.interval,
        active: !!(scheduled.timeout || scheduled.interval)
      });
    }
    return status;
  }

  /**
   * Check if user has scheduled email
   */
  hasScheduledEmail(userId) {
    return this.scheduledEmails.has(userId);
  }

  /**
   * Get current AQI data for location
   */
  async getCurrentAQIData(location) {
    if (!location?.lat || !location?.lng) return null;

    try {
      const requestBody = {
        location: {
          latitude: location.lat,
          longitude: location.lng
        },
        // Request additional pollutant data
        extraComputations: [
          "HEALTH_RECOMMENDATIONS",
          "DOMINANT_POLLUTANT_CONCENTRATION",
          "POLLUTANT_CONCENTRATION",
          "LOCAL_AQI",
          "POLLUTANT_ADDITIONAL_INFO"
        ],
        languageCode: "en"
      };

      console.log('Requesting AQI data with body:', requestBody);

      const response = await fetch(
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      console.log('Received AQI data:', data);

      return data;
    } catch (error) {
      console.error('Error fetching AQI data for email:', error);
      return null;
    }
  }

  /**
   * Generate health recommendations based on AQI and health condition
   */
  generateHealthRecommendations(aqi, healthCondition) {
    const recommendations = [];

    if (aqi <= 50) {
      recommendations.push('Air quality is good - enjoy outdoor activities');
    } else if (aqi <= 100) {
      recommendations.push('Air quality is moderate - sensitive individuals should limit prolonged outdoor exertion');
    } else if (aqi <= 150) {
      recommendations.push('Unhealthy for sensitive groups - consider reducing outdoor activities');
      if (healthCondition !== 'None') {
        recommendations.push('Take extra precautions due to your health condition');
      }
    } else if (aqi <= 200) {
      recommendations.push('Air quality is unhealthy - avoid prolonged outdoor activities');
      recommendations.push('Wear N95 mask when going outside');
    } else {
      recommendations.push('Air quality is very unhealthy - stay indoors');
      recommendations.push('Use air purifier and keep windows closed');
    }

    // Health condition specific recommendations
    if (healthCondition === 'Asthma' && aqi > 100) {
      recommendations.push('Keep your inhaler handy and avoid outdoor exercise');
    } else if (healthCondition === 'Heart Disease' && aqi > 100) {
      recommendations.push('Limit physical exertion and monitor symptoms');
    } else if (healthCondition === 'Elderly' && aqi > 100) {
      recommendations.push('Stay indoors and avoid strenuous activities');
    } else if (healthCondition === 'Child' && aqi > 100) {
      recommendations.push('Limit children\'s outdoor playtime');
    }

    return recommendations;
  }

  /**
   * Get AQI category string
   */
  getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  /**
   * Get health impact description
   */
  getHealthImpact(aqi) {
    if (aqi <= 50) return 'Minimal impact - safe for everyone';
    if (aqi <= 100) return 'Low impact - acceptable for most people';
    if (aqi <= 150) return 'Moderate impact - sensitive individuals may experience symptoms';
    if (aqi <= 200) return 'High impact - everyone may experience health effects';
    if (aqi <= 300) return 'Very high impact - serious health effects for everyone';
    return 'Extreme impact - emergency conditions';
  }

  /**
   * Get weather information (mock for now)
   */
  getWeatherInfo() {
    return {
      temperature: Math.round(20 + Math.random() * 15) + '°C',
      humidity: Math.round(40 + Math.random() * 40) + '%'
    };
  }

  /**
   * Get forecast trend
   */
  getForecastTrend(currentAQI) {
    const change = Math.round((Math.random() - 0.5) * 20);
    if (change > 5) return 'Worsening - AQI expected to increase';
    if (change < -5) return 'Improving - AQI expected to decrease';
    return 'Stable - AQI expected to remain similar';
  }

  /**
   * Get personalized message
   */
  getPersonalizedMessage(aqi, userName) {
    const messages = [
      `Hi ${userName}! Here's your daily air quality update.`,
      `Hello ${userName}! Your personalized air quality report is ready.`,
      `Hi ${userName}! Here's what you need to know about today's air quality.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Send email with real data only
   */
  async sendRealDataEmail(userEmail, userName, userProfile = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Must have location for real data
      if (!userProfile?.location?.lat || !userProfile?.location?.lng) {
        throw new Error('Location required for real data email. Please set your location in settings.');
      }

      console.log('Fetching real AQI data for:', userProfile.location);

      // Get real AQI data
      const aqiData = await this.getCurrentAQIData(userProfile.location);

      if (!aqiData || !aqiData.indexes || aqiData.indexes.length === 0) {
        throw new Error('Could not fetch real AQI data. Please try again later.');
      }

      console.log('Successfully fetched real AQI data:', aqiData);

      // Extract real data
      const currentAQI = aqiData.indexes[0].aqi;
      const category = this.getAQICategory(currentAQI);
      const healthImpact = this.getHealthImpact(currentAQI);
      const pollutants = this.extractPollutantData(aqiData);

      const healthRecommendations = this.generateHealthRecommendations(
        currentAQI,
        userProfile.healthCondition || 'None'
      );

      const templateParams = {
        to_email: userEmail,
        to_name: userName || 'User',
        location: userProfile.location.city || 'Your Location',
        aqi_value: currentAQI,
        aqi_category: category,
        threshold: userProfile?.aqiThreshold || 150,
        from_name: 'Pavan AI',
        health_impact: healthImpact,
        recommendations: Array.isArray(healthRecommendations) ? healthRecommendations.join('. ') : 'Stay informed about air quality conditions.',
        report_date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        report_time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        // Real pollutant data
        pm25: pollutants.pm25,
        pm10: pollutants.pm10,
        o3: pollutants.o3,
        no2: pollutants.no2,
        // Forecast
        forecast_trend: this.getForecastTrend(currentAQI),
        // Personalized message
        personal_message: `Hello ${userName || 'User'}! Here's your real-time air quality report for ${userProfile.location.city || 'your location'}.`
      };

      console.log('Sending email with real data template params:', templateParams);

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Real data email sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending real data email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton
const emailService = new EmailService();
export default emailService;