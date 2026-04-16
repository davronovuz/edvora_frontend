import { useEffect, useState } from 'react';

/**
 * Qiymatni belgilangan kechikish bilan qaytaradi.
 * Qidiruv inputlari uchun: foydalanuvchi yozib bo'lguncha API chaqiruvini kechiktirish.
 *
 * @template T
 * @param {T} value
 * @param {number} delay - millisekundlarda
 * @returns {T}
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
