import api from './api';

export const auditService = {
  getAll: (params = {}) => api.get('/audit/', { params }),
  getById: (id) => api.get(`/audit/${id}/`),
  getSummary: (days = 7) => api.get('/audit/summary/', { params: { days } }),
  getObjectHistory: (model, objectId) => api.get('/audit/object_history/', { params: { model, object_id: objectId } }),
};