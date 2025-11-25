// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// For Android emulator, use: http://10.0.2.2:3000/api/v1
// For physical device, use your computer's IP: http://192.168.x.x:3000/api/v1

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    ITEMS: '/items',
    CATEGORIES: '/categories',
  },
  TIMEOUT: 10000,
};
