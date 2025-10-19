// Quick API test function
export const testAPIConnection = async () => {
  console.log('🧪 Testing API connection...');
  
  // Test with Delhi coordinates
  const testLat = 28.6139;
  const testLng = 77.2090;
  
  try {
    const { getAQIData } = await import('./apiService');
    console.log('📍 Testing with Delhi coordinates:', testLat, testLng);
    
    const result = await getAQIData(testLat, testLng);
    console.log('✅ API test successful:', result);
    return result;
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
};

// Call this in browser console: testAPIConnection()
window.testAPIConnection = testAPIConnection;