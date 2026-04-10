import api from './api';

export const billingProfilesService = {
  getAll: (params = {}) => api.get('/billing/profiles/', { params }),
  getById: (id) => api.get(`/billing/profiles/${id}/`),
  create: (data) => api.post('/billing/profiles/', data),
  update: (id, data) => api.patch(`/billing/profiles/${id}/`, data),
  delete: (id) => api.delete(`/billing/profiles/${id}/`),
  modes: () => api.get('/billing/profiles/modes/'),
};

export const billingInvoicesService = {
  getAll: (params = {}) => api.get('/billing/invoices/', { params }),
  getById: (id) => api.get(`/billing/invoices/${id}/`),
  generate: (data) => api.post('/billing/invoices/generate/', data),
  generateGroup: (data) => api.post('/billing/invoices/generate-group/', data),
  cancel: (id) => api.post(`/billing/invoices/${id}/cancel/`),
  allocatePayment: (data) => api.post('/billing/invoices/allocate-payment/', data),
  debtors: (params = {}) => api.get('/billing/invoices/debtors/', { params }),
  summary: (params = {}) => api.get('/billing/invoices/summary/', { params }),
};

export const billingLeavesService = {
  getAll: (params = {}) => api.get('/billing/leaves/', { params }),
  getById: (id) => api.get(`/billing/leaves/${id}/`),
  create: (data) => api.post('/billing/leaves/', data),
  update: (id, data) => api.patch(`/billing/leaves/${id}/`, data),
  delete: (id) => api.delete(`/billing/leaves/${id}/`),
  approve: (id) => api.post(`/billing/leaves/${id}/approve/`),
  reject: (id) => api.post(`/billing/leaves/${id}/reject/`),
};

export const billingDiscountsService = {
  getAll: (params = {}) => api.get('/billing/discounts/', { params }),
  getById: (id) => api.get(`/billing/discounts/${id}/`),
  create: (data) => api.post('/billing/discounts/', data),
  update: (id, data) => api.patch(`/billing/discounts/${id}/`, data),
  delete: (id) => api.delete(`/billing/discounts/${id}/`),
};
