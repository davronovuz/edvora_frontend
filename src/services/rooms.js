import api from './api';

export const roomsService = {
  getAll: (params = {}) => api.get('/rooms/', { params }),
  getById: (id) => api.get(`/rooms/${id}/`),
  create: (data) => api.post('/rooms/', data),
  update: (id, data) => api.patch(`/rooms/${id}/`, data),
  delete: (id) => api.delete(`/rooms/${id}/`),
  getSchedule: (id, date) => api.get(`/rooms/${id}/schedule/`, { params: { date } }),
  checkAvailability: (id, params) => api.get(`/rooms/${id}/availability/`, { params }),
  getAvailable: (params) => api.get('/rooms/available/', { params }),
};