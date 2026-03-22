import api from './api';

export const examsService = {
  getAll: (params = {}) => api.get('/exams/', { params }),
  getById: (id) => api.get(`/exams/${id}/`),
  create: (data) => api.post('/exams/', data),
  update: (id, data) => api.patch(`/exams/${id}/`, data),
  delete: (id) => api.delete(`/exams/${id}/`),
  getResults: (id) => api.get(`/exams/${id}/results/`),
  bulkGrade: (id, data) => api.post(`/exams/${id}/bulk_grade/`, data),
  getStatistics: (params = {}) => api.get('/exams/statistics/', { params }),
};

export const examResultsService = {
  getAll: (params = {}) => api.get('/exam-results/', { params }),
  create: (data) => api.post('/exam-results/', data),
  update: (id, data) => api.patch(`/exam-results/${id}/`, data),
};

export const homeworksService = {
  getAll: (params = {}) => api.get('/homeworks/', { params }),
  getById: (id) => api.get(`/homeworks/${id}/`),
  create: (data) => api.post('/homeworks/', data),
  update: (id, data) => api.patch(`/homeworks/${id}/`, data),
  delete: (id) => api.delete(`/homeworks/${id}/`),
  getSubmissions: (id) => api.get(`/homeworks/${id}/submissions/`),
};

export const homeworkSubmissionsService = {
  getAll: (params = {}) => api.get('/homework-submissions/', { params }),
  create: (data) => api.post('/homework-submissions/', data),
  grade: (id, data) => api.post(`/homework-submissions/${id}/grade/`, data),
};

export const lessonPlansService = {
  getAll: (params = {}) => api.get('/lesson-plans/', { params }),
  getById: (id) => api.get(`/lesson-plans/${id}/`),
  create: (data) => api.post('/lesson-plans/', data),
  update: (id, data) => api.patch(`/lesson-plans/${id}/`, data),
  delete: (id) => api.delete(`/lesson-plans/${id}/`),
};