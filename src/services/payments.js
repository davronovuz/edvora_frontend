import api from './api';

export const paymentsService = {
  getAll: (params = {}) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.patch(`/payments/${id}/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  refund: (id) => api.post(`/payments/${id}/refund/`),
  statistics: (params = {}) => api.get('/payments/statistics/', { params }),
  byStudent: (studentId) => api.get('/payments/by_student/', { params: { student_id: studentId } }),
  debtors: (params = {}) => api.get('/payments/debtors/', { params }),
};

export const invoicesService = {
  getAll: (params = {}) => api.get('/invoices/', { params }),
  getById: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
  generateMonthly: (data) => api.post('/invoices/generate_monthly/', data),
};

export const discountsService = {
  getAll: (params = {}) => api.get('/discounts/', { params }),
  getById: (id) => api.get(`/discounts/${id}/`),
  create: (data) => api.post('/discounts/', data),
  update: (id, data) => api.patch(`/discounts/${id}/`, data),
  delete: (id) => api.delete(`/discounts/${id}/`),
};
