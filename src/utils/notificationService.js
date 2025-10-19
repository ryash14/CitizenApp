/**
 * Service for handling browser notifications
 */

class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = 'Notification' in window;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      throw new Error('Notification permission has been denied');
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   * @returns {Notification} Notification instance
   */
  showNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Notifications are not supported');
      return null;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'aqi-alert',
      requireInteraction: true,
      ...options
    };

    return new Notification(title, defaultOptions);
  }

  /**
   * Show AQI alert notification
   * @param {number} aqi - Current AQI value
   * @param {number} threshold - User's alert threshold
   * @param {string} location - User's location
   */
  showAQIAlert(aqi, threshold, location = 'your area') {
    const title = `🚨 Air Quality Alert`;
    const body = `AQI in ${location} is ${aqi}, exceeding your threshold of ${threshold}. Consider staying indoors.`;
    
    const notification = this.showNotification(title, {
      body,
      icon: '/logo192.png',
      tag: 'aqi-alert',
      data: { aqi, threshold, location },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });

    if (notification) {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  }

  /**
   * Show general notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, warning, error)
   */
  showGeneralNotification(title, message, type = 'info') {
    const icons = {
      info: '/logo192.png',
      warning: '/logo192.png',
      error: '/logo192.png'
    };

    const notification = this.showNotification(title, {
      body: message,
      icon: icons[type] || icons.info,
      tag: `general-${type}`,
    });

    if (notification) {
      // Auto-close after 5 seconds for general notifications
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  /**
   * Check if notifications are enabled
   * @returns {boolean} Whether notifications are enabled
   */
  isEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Get permission status
   * @returns {string} Permission status
   */
  getPermissionStatus() {
    return this.permission;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;