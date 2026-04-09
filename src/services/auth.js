import api from './api';

export const authService = {
  login: async (phone, password) => {
    const response = await api.post('/auth/login/', { phone, password });
    const { access, refresh, user } = response.data;

    // Backend permissions ni user ichida qaytaradi
    const permissions = user?.permissions || {};

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('permissions', JSON.stringify(permissions));

    return { user, permissions };
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getPermissions: () => {
    try {
      const permissions = localStorage.getItem('permissions');
      return permissions ? JSON.parse(permissions) : {};
    } catch {
      return {};
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getMe: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: confirmPassword,
    });
    return response.data;
  },
};