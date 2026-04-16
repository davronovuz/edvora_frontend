// Markazlashtirilgan format helper'lar — moliya/UI sahifalar shu yerdan ishlatadi.
// O'zbek lokal: ming ajratuvchi sifatida bo'sh joy.

const UZS = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
});

const UZS_FRACTION = new Intl.NumberFormat('uz-UZ', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Pul summasini formatlash. Default: butun son + " so'm".
 * @param {number|string|null|undefined} value
 * @param {{ withCurrency?: boolean, fraction?: boolean }} [opts]
 */
export function formatMoney(value, opts = {}) {
  const { withCurrency = true, fraction = false } = opts;
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return withCurrency ? "0 so'm" : '0';
  const formatter = fraction ? UZS_FRACTION : UZS;
  const text = formatter.format(num);
  return withCurrency ? `${text} so'm` : text;
}

export function formatNumber(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0';
  return UZS.format(num);
}

/**
 * Sanani formatlash. Default: 'DD.MM.YYYY'.
 * Variant: 'long' → '15-aprel, 2026', 'datetime' → '15.04.2026 14:30'
 */
export function formatDate(value, variant = 'short') {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  if (variant === 'datetime') {
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
  }
  if (variant === 'long') {
    const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
    return `${d.getDate()}-${months[d.getMonth()]}, ${yyyy}`;
  }
  return `${dd}.${mm}.${yyyy}`;
}

export function formatMonth(month, year) {
  const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
  const m = months[(Number(month) || 1) - 1] || '';
  return year ? `${m} ${year}` : m;
}
