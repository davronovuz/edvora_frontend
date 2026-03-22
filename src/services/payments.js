import api from './api';

export const paymentsService = {
  getAll: (params = {}) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.patch(`/payments/${id}/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
};

export const invoicesService = {
  getAll: (params = {}) => api.get('/invoices/', { params }),
  getById: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
};

export const discountsService = {
  getAll: (params = {}) => api.get('/discounts/', { params }),
  getById: (id) => api.get(`/discounts/${id}/`),
  create: (data) => api.post('/discounts/', data),
  update: (id, data) => api.patch(`/discounts/${id}/`, data),
  delete: (id) => api.delete(`/discounts/${id}/`),
};