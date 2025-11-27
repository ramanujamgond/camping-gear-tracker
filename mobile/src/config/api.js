// API Configuration
// __DEV__ is true in development, false in production builds

// const DEVELOPMENT_URL = 'http://192.168.29.226:3000/api/v1';
const DEVELOPMENT_URL = 'https://camping-gear-tracker-production.up.railway.app/api/v1';

// const PRODUCTION_URL = 'https://camping-gear-tracker.onrender.com/api/v1';
const PRODUCTION_URL = 'https://camping-gear-tracker-production.up.railway.app/api/v1';

const API_BASE_URL = __DEV__ ? DEVELOPMENT_URL : PRODUCTION_URL;

// For Android emulator, use: http://10.0.2.2:3000/api/v1
// For iOS simulator, use: http://localhost:3000/api/v1

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    ITEMS: '/items',
    CATEGORIES: '/categories',
  },
  TIMEOUT: 10000,
};
