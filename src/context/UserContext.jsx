import { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, apiGetProfile, apiLogout, resolveMediaUrl } from '../services/api';
import { useToast } from './ToastContext';

const UserContext = createContext();

// Đảm bảo avatarUrl luôn trỏ về origin app dùng được (tránh lỗi cert host nội bộ).
const normalizeUser = (rawUser) => (rawUser
  ? { ...rawUser, avatarUrl: resolveMediaUrl(rawUser.avatarUrl) }
  : rawUser);

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const toast = useToast();
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
        setUser(normalizeUser(profileData));
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
    let nextUser = normalizeUser(response.user);
    if (response.user) {
      setUser(nextUser);
    } else {
      const profile = normalizeUser(await apiGetProfile());
      nextUser = profile;
      setUser(profile);
    }
    toast.success(`Đăng nhập thành công. Chào mừng ${nextUser?.fullName || nextUser?.username || 'bạn'} quay lại!`);
    return response;
  };

  const refreshProfile = async () => {
    const profile = normalizeUser(await apiGetProfile());
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort revoke; clear local session regardless.
    }
    setToken(null);
    setUser(null);
    toast.info('Bạn đã đăng xuất khỏi H-Smart.');
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
