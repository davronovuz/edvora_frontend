import api from './api';

export const teachersService = {
  getAll: (params = {}) => api.get('/teachers/', { params }),

  getById: (id) => api.get(`/teachers/${id}/`),

  create: (data) => api.post('/teachers/', data),

  update: (id, data) => api.patch(`/teachers/${id}/`, data),

  delete: (id) => api.delete(`/teachers/${id}/`),

  getGroups: (id) => api.get(`/teachers/${id}/groups/`),
};
