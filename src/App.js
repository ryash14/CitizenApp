import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Settings from './pages/Settings';
import PolicyDashboard from './pages/PolicyDashboard';
import NotFound from './pages/NotFound';

function App() {
  const [user, loading] = useAuthState(auth);

  // Handle Google Sign-in redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Google sign-in successful:', result.user);
          
          // Check if user profile exists, create if not
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          if (!userDoc.exists()) {
            console.log('Creating profile for new Google user');
            await setDoc(doc(db, 'users', result.user.uid), {
              uid: result.user.uid,
              name: result.user.displayName || 'User',
              email: result.user.email,
              location: null,
              healthConditions: ['None'],
              aqiThreshold: 150,
              notificationsEnabled: true,
              profileComplete: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/profile-setup" 
              element={user ? <ProfileSetup /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={user ? <Settings /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/policy-dashboard" 
              element={user ? <PolicyDashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} />} 
            />
            <Route 
              path="*" 
              element={<NotFound />} 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;