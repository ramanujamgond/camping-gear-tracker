import api from './api';

const tripService = {
  // Get all trips
  async getTrips(params = {}) {
    try {
      const response = await api.get('/trips', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },

  // Get trip by ID
  async getTripById(id) {
    try {
      const response = await api.get(`/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  },

  // Create new trip
  async createTrip(tripData) {
    try {
      const response = await api.post('/trips', tripData);
      return response.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  // Update trip
  async updateTrip(id, tripData) {
    try {
      const response = await api.put(`/trips/${id}`, tripData);
      return response.data;
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
  },

  // Close trip
  async closeTrip(id) {
    try {
      const response = await api.post(`/trips/${id}/close`);
      return response.data;
    } catch (error) {
      console.error('Error closing trip:', error);
      throw error;
    }
  },

  // Delete trip
  async deleteTrip(id) {
    try {
      const response = await api.delete(`/trips/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw error;
    }
  },

  // Get trip items
  async getTripItems(tripId) {
    try {
      const response = await api.get(`/trips/${tripId}/items`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trip items:', error);
      throw error;
    }
  },

  // Add item to trip
  async addItemToTrip(tripId, itemData) {
    try {
      const response = await api.post(`/trips/${tripId}/items`, itemData);
      return response.data;
    } catch (error) {
      console.error('Error adding item to trip:', error);
      throw error;
    }
  },

  // Mark item as returned
  async markItemReturned(tripId, itemId, notes = '', status = 'returned', qrCodeId = null) {
    try {
      const payload = {
        notes,
        status,
      };
      
      // Include QR code if provided (required for 'returned' status)
      if (qrCodeId) {
        payload.qr_code_id = qrCodeId;
      }
      
      const response = await api.put(`/trips/${tripId}/items/${itemId}/return`, payload);
      return response.data;
    } catch (error) {
      console.error('Error marking item as returned:', error);
      throw error;
    }
  },

  // Mark item as lost
  async markItemLost(tripId, itemId) {
    try {
      const response = await api.put(`/trips/${tripId}/items/${itemId}/lost`);
      return response.data;
    } catch (error) {
      console.error('Error marking item as lost:', error);
      throw error;
    }
  },

  // Mark item as not found
  async markItemNotFound(tripId, itemId) {
    try {
      const response = await api.put(`/trips/${tripId}/items/${itemId}/not-found`);
      return response.data;
    } catch (error) {
      console.error('Error marking item as not found:', error);
      throw error;
    }
  },

  // Remove item from trip
  async removeItemFromTrip(tripId, itemId) {
    try {
      const response = await api.delete(`/trips/${tripId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing item from trip:', error);
      throw error;
    }
  },
};

export default tripService;
