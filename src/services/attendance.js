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

export const holidayService = {
  getAll: (params = {}) => api.get('/holidays/', { params }),
  create: (data) => api.post('/holidays/', data),
  update: (id, data) => api.patch(`/holidays/${id}/`, data),
  delete: (id) => api.delete(`/holidays/${id}/`),
  checkDate: (date) => api.get('/holidays/check-date/', { params: { date } }),
  upcoming: () => api.get('/holidays/upcoming/'),
};