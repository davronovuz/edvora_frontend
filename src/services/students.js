import api from './api';

export const studentsService = {
  getAll: (params = {}) => api.get('/students/', { params }),
  getById: (id) => api.get(`/students/${id}/`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  getStatistics: () => api.get('/students/statistics/'),
  getDebtors: () => api.get('/students/debtors/'),

  // Freeze / Unfreeze / Archive
  freeze: (id, data) => api.post(`/students/${id}/freeze/`, data),
  unfreeze: (id) => api.post(`/students/${id}/unfreeze/`),
  archive: (id, data) => api.post(`/students/${id}/archive/`, data),

  // Groups
  getGroups: (id) => api.get(`/students/${id}/groups/`),

  // Progress & history
  getProgressSummary: (id) => api.get(`/students/${id}/progress-summary/`),
  getTransferHistory: (id) => api.get(`/students/${id}/transfer-history/`),

  // Tags
  getTags: (id) => api.get(`/students/${id}/tags/`),
  addTag: (id, tagId) => api.post(`/students/${id}/tags/`, { tag_id: tagId }),
  removeTag: (id, tagId) => api.delete(`/students/${id}/tags/${tagId}/`),
};

// Tags service
export const tagsService = {
  getAll: (params = {}) => api.get('/tags/', { params }),
  getById: (id) => api.get(`/tags/${id}/`),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.patch(`/tags/${id}/`, data),
  delete: (id) => api.delete(`/tags/${id}/`),
};
