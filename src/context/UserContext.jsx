import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, apiGetProfile } from '../services/api';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('hsmart_token') || null);
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profileData = await apiGetProfile();
        setUser(profileData);
      } catch (err) {
        console.error('Failed to load user profile. Token might be invalid.', err);
        // Clear token if invalid
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      // apiLogin already saves to localStorage, but we also update state here
      const newToken = response.data?.token || response.token;
      setToken(newToken);
      // We don't fetch profile immediately here because useEffect depends on token change
      // Alternatively, we could fetch here to be instant
      return response;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hsmart_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
