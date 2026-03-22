import api from './api';

export const notificationsService = {
  getAll: (params = {}) => api.get('/notifications/', { params }),
  getById: (id) => api.get(`/notifications/${id}/`),
  create: (data) => api.post('/notifications/', data),
  update: (id, data) => api.patch(`/notifications/${id}/`, data),
  markAsRead: (id) => api.patch(`/notifications/${id}/`, { is_read: true }),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  sendBulk: (data) => api.post('/notifications/send_bulk/', data),
  sendSms: (data) => api.post('/notifications/send-sms/', data),
};

export const notificationTemplatesService = {
  getAll: (params = {}) => api.get('/notification-templates/', { params }),
  getById: (id) => api.get(`/notification-templates/${id}/`),
  create: (data) => api.post('/notification-templates/', data),
  update: (id, data) => api.patch(`/notification-templates/${id}/`, data),
};

export const autoSmsService = {
  getAll: (params = {}) => api.get('/auto-sms/', { params }),
  getById: (id) => api.get(`/auto-sms/${id}/`),
  create: (data) => api.post('/auto-sms/', data),
  update: (id, data) => api.patch(`/auto-sms/${id}/`, data),
  delete: (id) => api.delete(`/auto-sms/${id}/`),
};

export const remindersService = {
  getAll: (params = {}) => api.get('/reminders/', { params }),
  getById: (id) => api.get(`/reminders/${id}/`),
  create: (data) => api.post('/reminders/', data),
  update: (id, data) => api.patch(`/reminders/${id}/`, data),
  delete: (id) => api.delete(`/reminders/${id}/`),
  complete: (id) => api.post(`/reminders/${id}/complete/`),
};

export const holidaysService = {
  getAll: (params = {}) => api.get('/holidays/', { params }),
  getById: (id) => api.get(`/holidays/${id}/`),
  create: (data) => api.post('/holidays/', data),
  update: (id, data) => api.patch(`/holidays/${id}/`, data),
  delete: (id) => api.delete(`/holidays/${id}/`),
  checkDate: (date) => api.get('/holidays/check_date/', { params: { date } }),
  upcoming: () => api.get('/holidays/upcoming/'),
};
