import api from './api';

export const leadsService = {
  getAll: (params = {}) => api.get('/leads/', { params }),
  getById: (id) => api.get(`/leads/${id}/`),
  create: (data) => api.post('/leads/', data),
  update: (id, data) => api.patch(`/leads/${id}/`, data),
  delete: (id) => api.delete(`/leads/${id}/`),
};

export const leadActivitiesService = {
  getAll: (params = {}) => api.get('/lead-activities/', { params }),
  getById: (id) => api.get(`/lead-activities/${id}/`),
  create: (data) => api.post('/lead-activities/', data),
};