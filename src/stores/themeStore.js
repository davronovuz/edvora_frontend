import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark' | 'system'
      
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
      
      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);
      },
    }),
    {
      name: 'edvora-theme',
    }
  )
);

// Apply theme to document
let systemMediaQuery = null;
let systemListener = null;

function applyTheme(theme) {
  const root = document.documentElement;

  // Avvalgi system listener ni tozalash
  if (systemMediaQuery && systemListener) {
    systemMediaQuery.removeEventListener('change', systemListener);
    systemMediaQuery = null;
    systemListener = null;
  }

  if (theme === 'system') {
    systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    root.classList.toggle('dark', systemMediaQuery.matches);
    systemListener = (e) => root.classList.toggle('dark', e.matches);
    systemMediaQuery.addEventListener('change', systemListener);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}