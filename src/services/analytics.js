import api from './api';

export const analyticsService = {
  // Dashboard endpoints (har biri alohida)
  getSummary: () => api.get('/analytics/dashboard/summary/'),
  getFinanceChart: () => api.get('/analytics/dashboard/finance_chart/'),
  getStudentsChart: () => api.get('/analytics/dashboard/students_chart/'),
  getAttendanceChart: () => api.get('/analytics/dashboard/attendance_chart/'),
  getLeadsChart: () => api.get('/analytics/dashboard/leads_chart/'),
  getRecentActivity: () => api.get('/analytics/dashboard/recent_activity/'),
  getTopGroups: () => api.get('/analytics/dashboard/top_groups/'),
  getDebtorsSummary: () => api.get('/analytics/dashboard/debtors_summary/'),
  getBillingChart: () => api.get('/analytics/dashboard/billing_chart/'),
  getBillingDebtors: () => api.get('/analytics/dashboard/billing_debtors/'),
  getBillingSummary: (params) => api.get('/analytics/dashboard/billing_summary/', { params }),

  // Report endpoints
  getStudentsReport: (params) => api.get('/analytics/reports/students_report/', { params }),
  getFinanceReport: (params) => api.get('/analytics/reports/finance_report/', { params }),
  getAttendanceReport: (params) => api.get('/analytics/reports/attendance_report/', { params }),
  getTeachersReport: (params) => api.get('/analytics/reports/teachers_report/', { params }),
  getLeadConversion: (params) => api.get('/analytics/reports/lead_conversion/', { params }),
  getTeacherPerformance: (params) => api.get('/analytics/reports/teacher_performance/', { params }),
  getWriteOffReport: (params) => api.get('/analytics/reports/write_off_report/', { params }),
};
