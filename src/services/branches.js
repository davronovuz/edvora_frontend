import api from './api';

export const branchesService = {
  getAll: (params = {}) => api.get('/branches/', { params }),
  getById: (id) => api.get(`/branches/${id}/`),
  create: (data) => api.post('/branches/', data),
  update: (id, data) => api.patch(`/branches/${id}/`, data),
  delete: (id) => api.delete(`/branches/${id}/`),
  getStatistics: (id) => api.get(`/branches/${id}/statistics/`),
};
