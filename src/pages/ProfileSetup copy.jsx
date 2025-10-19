import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, Bell, User, Navigation } from 'lucide-react';
import { getCurrentLocation, geocodeAddress } from '../utils/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import notificationService from '../utils/notificationService';

const ProfileSetup = () => {
  const [user, loading] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    healthCondition: 'None',
    aqiThreshold: 150,
    notificationsEnabled: true
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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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
            setFormData({
              ...formData,
              location: data.results[0].formatted_address
            });
          } else {
            setFormData({
              ...formData,
              location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            });
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          setFormData({
            ...formData,
            location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
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

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Please enter your name');
          return false;
        }
        break;
      case 2:
        if (!formData.location.trim()) {
          setError('Please enter your location');
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

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSaving(true);
    setError('');

    try {
      await handleNotificationSetup();
      
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        profileComplete: true,
        preferences: {
          location: formData.location,
          healthCondition: formData.healthCondition,
          aqiThreshold: parseInt(formData.aqiThreshold),
          notificationsEnabled: formData.notificationsEnabled
        },
        updatedAt: new Date().toISOString()
      });

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
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
              <User className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">What's your name?</h2>
              <p className="text-gray-600">Help us personalize your experience</p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
              <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Where are you located?</h2>
              <p className="text-gray-600">We'll monitor air quality in your area</p>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field flex-1"
                  placeholder="Enter your city or address"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="btn-secondary flex items-center space-x-2 px-4"
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
              <Heart className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Health Information</h2>
              <p className="text-gray-600">Help us provide personalized recommendations</p>
            </div>
            
            <div>
              <label htmlFor="healthCondition" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="aqiThreshold" className="block text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-xs text-gray-500 mt-1">
                You'll receive alerts when AQI exceeds this value (50-500)
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Bell className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Enable Notifications</h2>
              <p className="text-gray-600">Stay informed about air quality changes</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
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
                  <label htmlFor="notificationsEnabled" className="font-medium text-gray-800">
                    Enable Air Quality Alerts
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive browser notifications when AQI exceeds your threshold of {formData.aqiThreshold}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Profile Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Location:</strong> {formData.location}</p>
                <p><strong>Health Condition:</strong> {formData.healthCondition}</p>
                <p><strong>Alert Threshold:</strong> AQI {formData.aqiThreshold}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="btn-secondary"
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
                className="btn-primary"
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