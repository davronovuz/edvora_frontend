import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  permissions: authService.getPermissions(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, permissions } = await authService.login(email, password);
      set({ 
        user, 
        permissions: permissions || {}, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      'Email yoki parol xato!';
      set({ 
        error: message, 
        isLoading: false 
      });
      return false;
    }
  },

  // Logout
  logout: () => {
    authService.logout();
    set({ user: null, permissions: {}, isAuthenticated: false });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Has permission
  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions?.[permission] === true;
  },
}));