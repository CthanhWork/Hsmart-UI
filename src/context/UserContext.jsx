import { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, apiGetProfile } from '../services/api';

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
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
        localStorage.removeItem('hsmart_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    const response = await apiLogin(username, password);
    setToken(response.accessToken);
    if (response.user) {
      setUser(response.user);
    } else {
      const profile = await apiGetProfile();
      setUser(profile);
    }
    return response;
  };

  const refreshProfile = async () => {
    const profile = await apiGetProfile();
    setUser(profile);
    return profile;
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
    refreshProfile,
    isAuthenticated: !!token,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
