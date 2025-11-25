import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await authService.initAuth();
      const storedUser = await authService.getUser();
      
      // Validate token by making a test request
      if (storedUser) {
        try {
          // Try to get users to validate token
          await authService.getUsers();
          setUser(storedUser);
        } catch (error) {
          // Token is invalid, clear auth
          console.log('Token expired, clearing auth');
          await authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (pin, userId = null) => {
    const result = await authService.login(pin, userId);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
