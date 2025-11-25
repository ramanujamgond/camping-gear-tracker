import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = '@camping_gear_token';
const USER_KEY = '@camping_gear_user';

export const authService = {
  // Login with PIN
  login: async (pin) => {
    const payload = { pin };
    
    const response = await api.post('/auth/login', payload);
    
    if (response.data.success) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
  },

  // Get stored token
  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  // Get stored user
  getUser: async () => {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  // Check if authenticated
  isAuthenticated: async () => {
    const token = await authService.getToken();
    return !!token;
  },

  // Initialize auth (set token in headers if exists)
  initAuth: async () => {
    const token = await authService.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Get all users (admin only)
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Create user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  // Get API base URL
  getApiUrl: () => {
    return api.defaults.baseURL;
  },
};

export default authService;
