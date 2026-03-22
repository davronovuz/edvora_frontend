import api from './api';

export const usersService = {
  getAll: (params = {}) => api.get('/users/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  getPermissions: (id) => api.get(`/users/${id}/permissions/`),
  updatePermissions: (id, data) => api.put(`/users/${id}/permissions/`, data),
};