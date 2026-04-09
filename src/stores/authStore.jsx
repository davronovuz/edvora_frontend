import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  permissions: authService.getPermissions(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (phone, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, permissions } = await authService.login(phone, password);
      set({
        user,
        permissions: permissions || {},
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      const data = error.response?.data;
      // Backend xato formatlarini to'g'ri o'qish
      const message =
        data?.detail ||
        data?.error?.message ||
        data?.non_field_errors?.[0] ||
        data?.phone?.[0] ||
        data?.password?.[0] ||
        "Telefon raqam yoki parol noto'g'ri";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, permissions: {}, isAuthenticated: false, error: null });
  },

  // /auth/me/ dan yangi ma'lumot olish (token hali amal qilayotganini tekshirish)
  refreshUser: async () => {
    try {
      const userData = await authService.getMe();
      const permissions = userData?.permissions || {};
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('permissions', JSON.stringify(permissions));
      set({ user: userData, permissions, isAuthenticated: true });
      return true;
    } catch {
      // Token ishlamayapti — logout
      get().logout();
      return false;
    }
  },

  clearError: () => set({ error: null }),

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions?.[permission] === true;
  },
}));
