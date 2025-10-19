import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Bell, BellOff, User, MapPin, Heart, AlertTriangle, LogOut, Save, Mail, Send } from 'lucide-react';
import emailService from '../utils/emailService';

const Settings = () => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: '',
    location: { city: '', lat: null, lng: null },
    healthCondition: 'None',
    aqiThreshold: 150,
    notificationsEnabled: true,
    dailyEmailEnabled: false,
    dailyEmailTime: '08:00'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile({ ...userProfile, ...userDoc.data() });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get city name
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components;
              
              // Enhanced city detection with multiple fallbacks
              let city = null;
              
              // Priority 1: locality (city)
              city = addressComponents.find(component => 
                component.types.includes('locality')
              )?.long_name;
              
              // Priority 2: sublocality_level_1 (neighborhood/district)
              if (!city) {
                city = addressComponents.find(component => 
                  component.types.includes('sublocality_level_1')
                )?.long_name;
              }
              
              // Priority 3: administrative_area_level_2 (county/district)
              if (!city) {
                city = addressComponents.find(component => 
                  component.types.includes('administrative_area_level_2')
                )?.long_name;
              }
              
              // Priority 4: administrative_area_level_3 (smaller admin area)
              if (!city) {
                city = addressComponents.find(component => 
                  component.types.includes('administrative_area_level_3')
                )?.long_name;
              }
              
              // Priority 5: administrative_area_level_1 (state/province)
              if (!city) {
                city = addressComponents.find(component => 
                  component.types.includes('administrative_area_level_1')
                )?.long_name;
              }
              
              // Priority 6: postal_town
              if (!city) {
                city = addressComponents.find(component => 
                  component.types.includes('postal_town')
                )?.long_name;
              }
              
              // Priority 7: Parse formatted address
              if (!city) {
                const formattedAddress = data.results[0].formatted_address;
                console.log('Formatted address:', formattedAddress);
                const parts = formattedAddress.split(',').map(part => part.trim());
                
                // Try to find a meaningful city name from address parts
                for (let i = 0; i < Math.min(parts.length, 3); i++) {
                  const part = parts[i];
                  // Skip if it's just numbers (like postal codes) or very short
                  if (part && !/^\d+$/.test(part) && part.length > 2) {
                    city = part;
                    break;
                  }
                }
              }
              
              // Final fallback
              if (!city) {
                city = 'Location Found';
              }
              
              console.log('Detected city:', city);
              console.log('Address components:', addressComponents);
              
              setUserProfile(prev => ({
                ...prev,
                location: {
                  city: city,
                  lat: latitude,
                  lng: longitude
                }
              }));
              
              setMessage(`Location detected: ${city}`);
              setTimeout(() => setMessage(''), 3000);
            }
          } catch (error) {
            console.error('Error getting city name:', error);
            setUserProfile(prev => ({
              ...prev,
              location: {
                ...prev.location,
                lat: latitude,
                lng: longitude
              }
            }));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      setMessage('Geolocation is not supported by this browser.');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        updatedAt: new Date()
      });
      
      // Handle email scheduling
      if (userProfile.dailyEmailEnabled) {
        const scheduleResult = emailService.scheduleDailyEmail(
          user.uid,
          user.email,
          userProfile.name || 'User',
          userProfile.dailyEmailTime,
          userProfile
        );
        
        if (scheduleResult.success) {
          setMessage(`Settings saved! Daily emails scheduled for ${userProfile.dailyEmailTime}. Next email: ${scheduleResult.nextEmailDate}`);
        } else {
          setMessage(`Settings saved but email scheduling failed: ${scheduleResult.error}`);
        }
      } else {
        const cancelled = emailService.cancelScheduledEmail(user.uid);
        setMessage(cancelled ? 'Settings saved! Daily emails cancelled.' : 'Settings saved! No scheduled emails to cancel.');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendRealDataEmail = async () => {
    if (!user?.email) return;
    
    setSendingTestEmail(true);
    try {
      const result = await emailService.sendRealDataEmail(
        user.email,
        userProfile.name || 'User',
        userProfile
      );
      
      if (result.success) {
        setMessage('Real data email sent successfully! Check your inbox.');
      } else {
        setMessage(`Error sending email: ${result.error || 'Please check your email configuration.'}`);
      }
    } catch (error) {
      console.error('Error sending real data email:', error);
      setMessage('Error sending email. Please try again.');
    } finally {
      setSendingTestEmail(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white text-shadow">Settings</h1>
              <p className="text-gray-300 mt-2">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg backdrop-blur-sm ${
            message.includes('Error') ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card-glass backdrop-blur-xl p-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Location Settings */}
            <div className="card-glass backdrop-blur-xl p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Location</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userProfile.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className="flex-1 input-field"
                      placeholder="Enter your city"
                    />
                    <button
                      onClick={getCurrentLocation}
                      className="btn-primary"
                    >
                      Use Current
                    </button>
                  </div>
                </div>

                {userProfile.location.lat && userProfile.location.lng && (
                  <div className="text-sm text-gray-400">
                    Coordinates: {userProfile.location.lat.toFixed(4)}, {userProfile.location.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Health & Preferences */}
            <div className="card-glass backdrop-blur-xl p-6">
              <div className="flex items-center mb-4">
                <Heart className="h-5 w-5 text-red-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Health & Preferences</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Health Condition
                  </label>
                  <select
                    value={userProfile.healthCondition}
                    onChange={(e) => handleInputChange('healthCondition', e.target.value)}
                    className="input-field"
                  >
                    <option value="None">None</option>
                    <option value="Asthma">Asthma</option>
                    <option value="Heart Disease">Heart Disease</option>
                    <option value="Child">Child (under 12)</option>
                    <option value="Elderly">Elderly (65+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AQI Alert Threshold
                  </label>
                  <select
                    value={userProfile.aqiThreshold}
                    onChange={(e) => handleInputChange('aqiThreshold', parseInt(e.target.value))}
                    className="input-field"
                  >
                    <option value={50}>50 - Good</option>
                    <option value={100}>100 - Moderate</option>
                    <option value={150}>150 - Unhealthy for Sensitive Groups</option>
                    <option value={200}>200 - Unhealthy</option>
                    <option value={300}>300 - Very Unhealthy</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    You'll receive notifications when AQI exceeds this level
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="card-glass backdrop-blur-xl p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {userProfile.notificationsEnabled ? (
                      <Bell className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm font-medium text-white">
                      AQI Alerts
                    </span>
                  </div>
                  <button
                    onClick={() => handleInputChange('notificationsEnabled', !userProfile.notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      userProfile.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Get notified when air quality in your area becomes unhealthy
                </p>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-white">
                        Daily Email Reports
                      </span>
                    </div>
                    <button
                      onClick={() => handleInputChange('dailyEmailEnabled', !userProfile.dailyEmailEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        userProfile.dailyEmailEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          userProfile.dailyEmailEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    Receive daily air quality reports via email
                  </p>

                  {userProfile.dailyEmailEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Time
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Hour</label>
                            <select
                              value={userProfile.dailyEmailTime.split(':')[0]}
                              onChange={(e) => {
                                const minutes = userProfile.dailyEmailTime.split(':')[1] || '00';
                                handleInputChange('dailyEmailTime', `${e.target.value}:${minutes}`);
                              }}
                              className="input-field text-sm"
                            >
                              {Array.from({length: 24}, (_, i) => (
                                <option key={i} value={i.toString().padStart(2, '0')}>
                                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Minute</label>
                            <select
                              value={userProfile.dailyEmailTime.split(':')[1] || '00'}
                              onChange={(e) => {
                                const hour = userProfile.dailyEmailTime.split(':')[0] || '08';
                                handleInputChange('dailyEmailTime', `${hour}:${e.target.value}`);
                              }}
                              className="input-field text-sm"
                            >
                              {Array.from({length: 60}, (_, i) => (
                                <option key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={sendRealDataEmail}
                          disabled={sendingTestEmail || !userProfile?.location?.lat}
                          className="w-full flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 text-sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendingTestEmail ? 'Sending...' : 'Send Real Data Email'}
                        </button>
                        
                        {!userProfile?.location?.lat && (
                          <p className="text-xs text-yellow-400 text-center">
                            📍 Set your location above to send real data emails
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-glass backdrop-blur-xl p-6">
              <div className="space-y-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;