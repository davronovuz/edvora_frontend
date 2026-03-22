import api from './api';

export const subjectsService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/subjects/', { params });
      return response;
    } catch (error) {
      console.log('Subjects fetch error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    const response = await api.get(`/subjects/${id}/`);
    return response;
  },

  create: async (data) => {
    const response = await api.post('/subjects/', data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.patch(`/subjects/${id}/`, data);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}/`);
    return response;
  },
};