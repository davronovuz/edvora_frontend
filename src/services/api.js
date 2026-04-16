import axios from 'axios';

const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  : `${window.location.origin}/api/v1`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — token qo'shish
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh jarayonida bir nechta so'rov kelsa, barchasini kutish
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor — token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Refresh allaqachon ishlayapti — navbatga qo'shish
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        processQueue(null, access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Backend javob envelope'ini ochish.
 * Backend `{success: true, data: ...}` qaytarsa — `data` ni qaytaradi.
 * Boshqa shakllarda — javobni o'zini qaytaradi.
 *
 * Ishlatish:
 *     const items = unwrap(await api.get('/students/'));
 */
export function unwrap(response) {
  const body = response?.data ?? response;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
}

/**
 * Ro'yxat javobini normallashtirish.
 * Qo'llab-quvvatlanadi:
 *     - {success, data: [...]}        → [...]
 *     - {success, data: {results: [...]}} → [...]
 *     - {results: [...]} (DRF paginated) → [...]
 *     - [...]                          → [...]
 *
 * Sahifalash bo'lsa ham faqat results massivini qaytaradi.
 * To'liq pagination obyekti kerak bo'lsa `unwrap` ishlating.
 */
export function unwrapList(response) {
  const data = unwrap(response);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export default api;
