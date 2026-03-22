import api from './api';

export const groupsService = {
  getAll: (params = {}) => api.get('/groups/', { params }),
  getById: (id) => api.get(`/groups/${id}/`),
  create: (data) => api.post('/groups/', data),
  update: (id, data) => api.patch(`/groups/${id}/`, data),
  delete: (id) => api.delete(`/groups/${id}/`),
  getStudents: (id) => api.get(`/groups/${id}/students/`),
  addStudent: (id, data) => api.post(`/groups/${id}/add_student/`, data),
  removeStudent: (groupId, studentId) => api.post(`/groups/${groupId}/remove-student/${studentId}/`),
  transferStudent: (id, data) => api.post(`/groups/${id}/transfer_student/`, data),
  getScheduleConflicts: () => api.get('/groups/schedule_conflicts/'),
};