import api from './api';

export const expenseCategoriesService = {
  getAll: (params = {}) => api.get('/finance/expense-categories/', { params }),
  getById: (id) => api.get(`/finance/expense-categories/${id}/`),
  create: (data) => api.post('/finance/expense-categories/', data),
  update: (id, data) => api.patch(`/finance/expense-categories/${id}/`, data),
  delete: (id) => api.delete(`/finance/expense-categories/${id}/`),
};

export const expensesService = {
  getAll: (params = {}) => api.get('/finance/expenses/', { params }),
  getById: (id) => api.get(`/finance/expenses/${id}/`),
  create: (data) => api.post('/finance/expenses/', data),
  update: (id, data) => api.patch(`/finance/expenses/${id}/`, data),
  delete: (id) => api.delete(`/finance/expenses/${id}/`),
  approve: (id) => api.post(`/finance/expenses/${id}/approve/`),
  statistics: (params = {}) => api.get('/finance/expenses/statistics/', { params }),
};

export const transactionsService = {
  getAll: (params = {}) => api.get('/finance/transactions/', { params }),
  getById: (id) => api.get(`/finance/transactions/${id}/`),
};

export const salariesService = {
  getAll: (params = {}) => api.get('/finance/salaries/', { params }),
  getById: (id) => api.get(`/finance/salaries/${id}/`),
  create: (data) => api.post('/finance/salaries/', data),
  update: (id, data) => api.patch(`/finance/salaries/${id}/`, data),
  delete: (id) => api.delete(`/finance/salaries/${id}/`),
  calculate: (data) => api.post('/finance/salaries/calculate/', data),
  approve: (id) => api.post(`/finance/salaries/${id}/approve/`),
  pay: (id) => api.post(`/finance/salaries/${id}/pay/`),
};

export const financeDashboardService = {
  summary: (params = {}) => api.get('/finance/dashboard/summary/', { params }),
  monthlyReport: (params = {}) => api.get('/finance/dashboard/monthly_report/', { params }),
};
