import React, { useState } from 'react';

const DebugInfo = ({ user, userProfile, aqiData, isLoading }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-sm text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Debug Info</span>
        <button onClick={() => setShowDebug(false)} className="text-red-400">×</button>
      </div>
      
      <div className="space-y-1">
        <div>User: {user ? '✅ Logged in' : '❌ Not logged in'}</div>
        <div>Profile: {userProfile ? '✅ Loaded' : '❌ Missing'}</div>
        <div>Location: {userProfile?.location?.lat ? '✅ Set' : '❌ Missing'}</div>
        <div>AQI Data: {aqiData ? '✅ Loaded' : '❌ Missing'}</div>
        <div>Loading: {isLoading ? '🔄 Yes' : '✅ No'}</div>
        
        {userProfile?.location && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div>Lat: {userProfile.location.lat}</div>
            <div>Lng: {userProfile.location.lng}</div>
            <div>City: {userProfile.location.city}</div>
          </div>
        )}
        
        <button
          onClick={() => window.testAPIConnection?.()}
          className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs w-full"
        >
          Test API
        </button>
      </div>
    </div>
  );
};

export default DebugInfo;