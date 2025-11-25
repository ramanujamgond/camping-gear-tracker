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
      
      // Just set the user if token exists
      // Token validation will happen on actual API calls
      if (storedUser) {
        setUser(storedUser);
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
