import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * URL search params'da state saqlash uchun hook.
 * Bo'sh qiymatlar (default'ga teng) URL'dan olib tashlanadi — toza link.
 *
 * Misol:
 *   const DEFAULTS = { search: '', status: '', page: 1 };
 *   const [filters, setFilters] = useUrlState(DEFAULTS);
 *   setFilters({ search: 'ali', page: 1 });
 *   setFilters(prev => ({ ...prev, status: 'active' }));
 */
export function useUrlState(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        if (typeof defaults[key] === 'number') {
          const num = Number(urlValue);
          result[key] = Number.isNaN(num) ? defaults[key] : num;
        } else {
          result[key] = urlValue;
        }
      }
    }
    return result;
  }, [searchParams, defaults]);

  const setState = useCallback((updater) => {
    setSearchParams((prev) => {
      const current = {};
      for (const key of Object.keys(defaults)) {
        const urlValue = prev.get(key);
        if (urlValue !== null) {
          current[key] = typeof defaults[key] === 'number' ? Number(urlValue) : urlValue;
        } else {
          current[key] = defaults[key];
        }
      }

      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };

      const newParams = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value === defaults[key] || value === '' || value == null) continue;
        newParams.set(key, String(value));
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams, defaults]);

  return [state, setState];
}
