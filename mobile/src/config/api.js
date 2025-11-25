// API Configuration
// For physical device, use your computer's IP address
const API_BASE_URL = 'http://192.168.29.226:3000/api/v1';

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
