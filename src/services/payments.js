import api from './api';

// Payments — to'lov qabul qilish va jurnal.
// Qarz/invoice bilan bog'liq ish `billingInvoicesService`'da (services/billing.js).
export const paymentsService = {
  getAll: (params = {}) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.patch(`/payments/${id}/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  refund: (id) => api.post(`/payments/${id}/refund/`),
  statistics: (params = {}) => api.get('/payments/statistics/', { params }),
  byStudent: (studentId) => api.get('/payments/by_student/', { params: { student_id: studentId } }),
};
