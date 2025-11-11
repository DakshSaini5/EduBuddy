import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // --- NEW: Add a loading state ---
  // This prevents the app from "flashing" the login page on refresh
  const [loading, setLoading] = useState(true);

  // --- NEW: Check for session on initial app load ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await fetch('/api/auth/check.php');
        const data = await res.json();
        
        if (data.success) {
          // User is already logged in, update the state
          handleSignIn(data.data);
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        // We're done checking, so stop loading
        setLoading(false);
      }
    };
    
    checkUserSession();
  }, []); // Empty array means this runs ONLY once on mount

  const handleSignIn = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, handleSignIn, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};