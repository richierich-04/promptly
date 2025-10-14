// Authentication Context for managing user state across the app
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange } from '../firebase/auth';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up authentication state listener
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    setError(error);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // Context value object
  const value = {
    currentUser,
    loading,
    error,
    setError: handleAuthError,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;