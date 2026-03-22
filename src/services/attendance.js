import api from './api';

export const attendanceService = {
  getAll: (params = {}) => api.get('/attendance/', { params }),
  getById: (id) => api.get(`/attendance/${id}/`),
  create: (data) => api.post('/attendance/', data),
  update: (id, data) => api.patch(`/attendance/${id}/`, data),
  delete: (id) => api.delete(`/attendance/${id}/`),
  bulkCreate: (data) => api.post('/attendance/bulk_create/', data),
  byGroup: (params) => api.get('/attendance/by_group/', { params }),
  byStudent: (params) => api.get('/attendance/by_student/', { params }),
  report: (params) => api.get('/attendance/report/', { params }),
};