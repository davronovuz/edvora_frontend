import api from './api';

export const coursesService = {
  getAll: (params = {}) => api.get('/courses/', { params }),
  getById: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}/`, data),
  delete: (id) => api.delete(`/courses/${id}/`),
};
