import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TONE = {
  primary: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600', accent: 'border-indigo-200 dark:border-indigo-700' },
  success: { bg: 'bg-green-50 dark:bg-green-900/20',   icon: 'text-green-600',   accent: 'border-green-200 dark:border-green-700' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/20',   icon: 'text-amber-600',   accent: 'border-amber-200 dark:border-amber-700' },
  danger:  { bg: 'bg-red-50 dark:bg-red-900/20',       icon: 'text-red-600',     accent: 'border-red-200 dark:border-red-700' },
  info:    { bg: 'bg-blue-50 dark:bg-blue-900/20',     icon: 'text-blue-600',    accent: 'border-blue-200 dark:border-blue-700' },
  neutral: { bg: 'bg-gray-50 dark:bg-gray-800/40',     icon: 'text-gray-600',    accent: 'border-gray-200 dark:border-gray-600' },
};

/**
 * Statistik karta — Dashboard, Moliya, Hisobot sahifalari uchun.
 *
 * Props:
 * - label / title: sarlavha matni
 * - value: asosiy qiymat
 * - hint / subtitle / subValue: qo'shimcha ma'lumot
 * - icon: FontAwesome icon
 * - tone?: 'primary'|'success'|'warning'|'danger'|'info'|'neutral'
 * - color?: string — qo'lda rang (tone dan ustunligi bor)
 * - bg?: string — icon background (color bilan birga)
 * - active?: boolean — tanlangan holat ko'rsatish
 * - loading?: boolean
 * - trend?: ReactNode
 * - onClick?: function
 */
export default function StatCard({
  label,
  title,
  value,
  hint,
  subtitle,
  subValue,
  icon,
  tone = 'primary',
  color,
  bg,
  active = false,
  loading = false,
  trend,
  onClick,
}) {
  const t = TONE[tone] || TONE.primary;
  const clickable = typeof onClick === 'function';
  const displayLabel = label ?? title;
  const displayHint = hint ?? subtitle ?? subValue;

  const accentClass = color ? '' : t.accent;
  const iconBgClass = bg ? '' : t.bg;
  const iconColorClass = color ? '' : t.icon;

  return (
    <div
      onClick={onClick}
      className={[
        'card p-4 border-l-4',
        accentClass,
        clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
        active ? 'ring-2 ring-inset ring-current' : '',
      ].join(' ')}
      style={color ? { borderLeftColor: color } : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {displayLabel}
          </p>
          <p className="mt-1 text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {loading ? <span className="inline-block w-20 h-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" /> : value}
          </p>
          {displayHint && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {displayHint}
            </p>
          )}
          {trend && <div className="mt-1">{trend}</div>}
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass} ${iconColorClass}`}
            style={bg ? { backgroundColor: bg, color: color } : undefined}
          >
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
