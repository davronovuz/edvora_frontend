import api from './api';

export const subjectsService = {
  getAll: (params = {}) => api.get('/subjects/', { params }),
  getById: (id) => api.get(`/subjects/${id}/`),
  create: (data) => api.post('/subjects/', data),
  update: (id, data) => api.patch(`/subjects/${id}/`, data),
  delete: (id) => api.delete(`/subjects/${id}/`),
};
