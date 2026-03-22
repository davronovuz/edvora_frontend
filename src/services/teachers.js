import api from './api';

export const teachersService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/teachers/', { params });
      return response;
    } catch (error) {
      console.log('Teachers fetch error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    const response = await api.get(`/teachers/${id}/`);
    return response;
  },

  create: async (data) => {
    console.log('📤 Creating teacher:', data);
    try {
      const response = await api.post('/teachers/', data);
      return response;
    } catch (error) {
      console.log('❌ Create error:', error.response?.data);
      throw error;
    }
  },

  update: async (id, data) => {
    console.log('📤 Updating teacher:', data);
    try {
      const response = await api.patch(`/teachers/${id}/`, data);
      return response;
    } catch (error) {
      console.log('❌ Update error:', error.response?.data);
      throw error;
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/teachers/${id}/`);
    return response;
  },
};