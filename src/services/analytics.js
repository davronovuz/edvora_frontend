import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard/'),
  getReports: (params = {}) => api.get('/analytics/reports/', { params }),
  getLeadConversion: (params = {}) => api.get('/analytics/reports/lead_conversion/', { params }),
  getTeacherPerformance: (params = {}) => api.get('/analytics/reports/teacher_performance/', { params }),
  getWriteOffReport: (params = {}) => api.get('/analytics/reports/write_off_report/', { params }),
};
