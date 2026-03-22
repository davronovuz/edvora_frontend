import api from './api';

export const coursesService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/courses/', { params });
      return response;
    } catch (error) {
      console.log('Courses fetch error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    const response = await api.get(`/courses/${id}/`);
    return response;
  },

create: async (data) => {
  console.log('📤 Creating course:', data);
  try {
    const response = await api.post('/courses/', data);
    return response;
  } catch (error) {
    console.log('❌ Error response data:', JSON.stringify(error.response?.data));
    throw error;
  }
},

  update: async (id, data) => {
    try {
      const response = await api.patch(`/courses/${id}/`, data);
      return response;
    } catch (error) {
      console.log('❌ Update error:', error.response?.data);
      throw error;
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/courses/${id}/`);
    return response;
  },
};