import api from './api';

export const itemService = {
  // Get item by QR code
  getItemByQrCode: async (qrCodeId) => {
    try {
      const response = await api.get(`/items/${qrCodeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, notFound: true, qrCodeId };
      }
      throw error;
    }
  },

  // Create new item
  createItem: async (itemData) => {
    const response = await api.post('/items', itemData);
    return response.data;
  },

  // Update item
  updateItem: async (id, itemData) => {
    const response = await api.put(`/items/${id}`, itemData);
    return response.data;
  },

  // Delete item
  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  // List items
  listItems: async (page = 1, limit = 20, search = '') => {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await api.get('/items', { params });
    return response.data;
  },

  // Upload images
  uploadImages: async (itemId, images) => {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      });
    });

    const response = await api.post(`/items/${itemId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default itemService;
