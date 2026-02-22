import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for an existing session on initial app load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const res = await fetch('/api/auth/check.php', {
          credentials: 'include', // FIX: send cookies with every request
        });
        const data = await res.json();
        if (data.success) {
          handleSignIn(data.data);
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const handleSignIn = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // FIX: actually call logout.php so the PHP session is destroyed server-side.
  // Without this, the session cookie stays alive and the user is still "logged
  // in" on the server even after clicking logout in the UI.
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout.php', {
        method: 'POST',
        credentials: 'include', // FIX: must send the session cookie
      });
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      // Always clear local state, even if the network call fails
      setUser(null);
      setIsLoggedIn(false);
    }
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
