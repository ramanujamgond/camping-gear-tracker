import api from './api';

export const categoryService = {
  // List all categories
  listCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },
};

export default categoryService;
