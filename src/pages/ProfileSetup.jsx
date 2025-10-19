import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, Bell, User, Navigation } from 'lucide-react';
import { getCurrentLocation, geocodeAddress } from '../utils/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import notificationService from '../utils/notificationService';
import emailService from '../utils/emailService';

const ProfileSetup = () => {
  const [user, loading] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    location: null,
    healthCondition: 'None',
    aqiThreshold: 150,
    notificationsEnabled: true,
    dailyEmailEnabled: false,
    dailyEmailTime: '08:00'
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, loading, navigate]);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFormData({
          name: userData.name || user.displayName || '',
          location: userData.preferences?.location || '',
          healthCondition: userData.preferences?.healthCondition || 'None',
          aqiThreshold: userData.preferences?.aqiThreshold || 150,
          notificationsEnabled: userData.preferences?.notificationsEnabled !== false
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'location') {
      // Handle manual location input
      setFormData({
        ...formData,
        location: {
          lat: null,
          lng: null,
          city: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    setError('');
  };

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');

    try {
      const location = await getCurrentLocation();
      if (location.isDefault) {
        setFormData({
          ...formData,
          location: 'Delhi, India (Default)'
        });
      } else {
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            
            // Try multiple ways to get city name
            let city = addressComponents.find(component => 
              component.types.includes('locality')
            )?.long_name;
            
            if (!city) {
              city = addressComponents.find(component => 
                component.types.includes('administrative_area_level_2')
              )?.long_name;
            }
            
            if (!city) {
              city = addressComponents.find(component => 
                component.types.includes('administrative_area_level_1')
              )?.long_name;
            }
            
            if (!city) {
              city = addressComponents.find(component => 
                component.types.includes('sublocality') || 
                component.types.includes('sublocality_level_1')
              )?.long_name;
            }
            
            // Use formatted address as fallback
            if (!city) {
              const formattedAddress = data.results[0].formatted_address;
              city = formattedAddress.split(',')[0] || 'Current Location';
            }
            
            console.log('Geocoding result:', { addressComponents, city, fullResult: data.results[0] });
            
            setFormData({
              ...formData,
              location: {
                lat: location.lat,
                lng: location.lng,
                city: city
              }
            });
          } else {
            console.log('No geocoding results, using coordinates');
            setFormData({
              ...formData,
              location: {
                lat: location.lat,
                lng: location.lng,
                city: `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
              }
            });
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          setFormData({
            ...formData,
            location: {
              lat: location.lat,
              lng: location.lng,
              city: 'Unknown City'
            }
          });
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      setError('Unable to get your location. Please enter it manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleNotificationSetup = async () => {
    if (formData.notificationsEnabled) {
      try {
        await notificationService.requestPermission();
      } catch (error) {
        console.error('Notification permission error:', error);
        setError('Unable to enable notifications. You can enable them later in settings.');
      }
    }
  };

  const handleEmailSetup = async () => {
    if (formData.dailyEmailEnabled && formData.location) {
      try {
        await emailService.initialize();
        emailService.scheduleDailyEmail(
          user.uid,
          user.email,
          formData.dailyEmailTime,
          formData.location
        );
        console.log('Daily email scheduled successfully');
      } catch (error) {
        console.error('Email setup error:', error);
        // Don't show error to user as this is not critical
      }
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Please enter your name');
          return false;
        }
        break;
      case 2:
        if (!formData.location || (!formData.location.lat && !formData.location.city)) {
          setError('Please set your location');
          return false;
        }
        break;
      case 3:
        if (formData.aqiThreshold < 50 || formData.aqiThreshold > 500) {
          setError('AQI threshold must be between 50 and 500');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const geocodeManualLocation = async () => {
    if (formData.location && !formData.location.lat && formData.location.city) {
      try {
        const result = await geocodeAddress(formData.location.city);
        setFormData({
          ...formData,
          location: {
            lat: result.lat,
            lng: result.lng,
            city: formData.location.city
          }
        });
      } catch (error) {
        console.error('Geocoding error:', error);
        setError('Unable to find coordinates for the entered location. Please use "Get Current Location" or enter a valid city name.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSaving(true);
    setError('');

    try {
      // Geocode manual location if needed
      const locationValid = await geocodeManualLocation();
      if (!locationValid) {
        setSaving(false);
        return;
      }

      await handleNotificationSetup();
      await handleEmailSetup();
      
      // Use setDoc to create or update the document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: formData.name,
        location: formData.location,
        healthConditions: [formData.healthCondition],
        aqiThreshold: parseInt(formData.aqiThreshold),
        notificationsEnabled: formData.notificationsEnabled,
        dailyEmailEnabled: formData.dailyEmailEnabled,
        dailyEmailTime: formData.dailyEmailTime,
        profileComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true }); // merge: true will update if exists, create if not

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || saving) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text={saving ? "Setting up your profile..." : "Loading..."} />
      </div>
    );
  }

  const healthConditions = [
    { value: 'None', label: 'No specific health conditions' },
    { value: 'Asthma', label: 'Asthma' },
    { value: 'Heart Disease', label: 'Heart Disease' },
    { value: 'Child', label: 'Child (under 12)' },
    { value: 'Elderly', label: 'Elderly (65+)' }
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">What's your name?</h2>
              <p className="text-gray-300">Help us personalize your experience</p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Where are you located?</h2>
              <p className="text-gray-300">We'll monitor air quality in your area</p>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location?.city || ''}
                  onChange={handleInputChange}
                  className="input-field flex-1"
                  placeholder="Enter your city or address"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="btn-primary flex items-center space-x-2 px-4"
                >
                  <Navigation className="w-4 h-4" />
                  {locationLoading ? 'Getting...' : 'Use Current'}
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Health Information</h2>
              <p className="text-gray-300">Help us provide personalized recommendations</p>
            </div>
            
            <div>
              <label htmlFor="healthCondition" className="block text-sm font-medium text-gray-300 mb-2">
                Health Condition
              </label>
              <select
                id="healthCondition"
                name="healthCondition"
                value={formData.healthCondition}
                onChange={handleInputChange}
                className="input-field"
              >
                {healthConditions.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="aqiThreshold" className="block text-sm font-medium text-gray-300 mb-2">
                AQI Alert Threshold
              </label>
              <input
                type="number"
                id="aqiThreshold"
                name="aqiThreshold"
                value={formData.aqiThreshold}
                onChange={handleInputChange}
                min="50"
                max="500"
                className="input-field"
                placeholder="150"
              />
              <p className="text-xs text-gray-400 mt-1">
                You'll receive alerts when AQI exceeds this value (50-500)
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Bell className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Enable Notifications</h2>
              <p className="text-gray-300">Stay informed about air quality changes</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    name="notificationsEnabled"
                    checked={formData.notificationsEnabled}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="notificationsEnabled" className="font-medium text-white">
                      Enable Air Quality Alerts
                    </label>
                    <p className="text-sm text-gray-300 mt-1">
                      Receive browser notifications when AQI exceeds your threshold of {formData.aqiThreshold}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="dailyEmailEnabled"
                    name="dailyEmailEnabled"
                    checked={formData.dailyEmailEnabled}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="dailyEmailEnabled" className="font-medium text-white">
                      Daily Email Reports
                    </label>
                    <p className="text-sm text-gray-300 mt-1">
                      Receive daily air quality reports via email regardless of AQI levels
                    </p>
                    
                    {formData.dailyEmailEnabled && (
                      <div className="mt-3">
                        <label htmlFor="dailyEmailTime" className="block text-sm font-medium text-gray-300 mb-1">
                          Preferred Time
                        </label>
                        <select
                          id="dailyEmailTime"
                          name="dailyEmailTime"
                          value={formData.dailyEmailTime}
                          onChange={handleInputChange}
                          className="input-field text-sm"
                        >
                          <option value="06:00">6:00 AM</option>
                          <option value="07:00">7:00 AM</option>
                          <option value="08:00">8:00 AM</option>
                          <option value="09:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="18:00">6:00 PM</option>
                          <option value="19:00">7:00 PM</option>
                          <option value="20:00">8:00 PM</option>
                          <option value="21:00">9:00 PM</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 border border-slate-600/50 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-white mb-2">Profile Summary</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Location:</strong> {formData.location?.city || 'Not set'}</p>
                <p><strong>Health Condition:</strong> {formData.healthCondition}</p>
                <p><strong>Alert Threshold:</strong> AQI {formData.aqiThreshold}</p>
                <p><strong>Browser Alerts:</strong> {formData.notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                <p><strong>Daily Email:</strong> {formData.dailyEmailEnabled ? `Enabled (${formData.dailyEmailTime})` : 'Disabled'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">Step {step} of 4</span>
            <span className="text-sm text-gray-400">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-glass backdrop-blur-2xl border border-white/10">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm backdrop-blur-sm">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;