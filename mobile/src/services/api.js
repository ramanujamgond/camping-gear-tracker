import axios from 'axios';
import config from '../config/api';

const api = axios.create({
  baseURL: config.BASE_URL,
  timeout: config.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Don't log 404 errors as they're expected for new items
    if (error.response?.status !== 404) {
      console.error('API Error:', error.response?.data || error.message);
    }
    
    // Auto-logout on authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('@camping_gear_token');
      await AsyncStorage.removeItem('@camping_gear_user');
      delete api.defaults.headers.common['Authorization'];
    }
    
    return Promise.reject(error);
  }
);

export default api;
