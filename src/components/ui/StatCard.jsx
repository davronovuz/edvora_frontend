import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TONE = {
  primary: { bg: 'bg-indigo-50', icon: 'text-indigo-600', accent: 'border-indigo-200' },
  success: { bg: 'bg-green-50',  icon: 'text-green-600',  accent: 'border-green-200' },
  warning: { bg: 'bg-amber-50',  icon: 'text-amber-600',  accent: 'border-amber-200' },
  danger:  { bg: 'bg-red-50',    icon: 'text-red-600',    accent: 'border-red-200' },
  info:    { bg: 'bg-blue-50',   icon: 'text-blue-600',   accent: 'border-blue-200' },
  neutral: { bg: 'bg-gray-50',   icon: 'text-gray-600',   accent: 'border-gray-200' },
};

/**
 * Statistik karta — Dashboard, Moliya, Hisobot sahifalari uchun.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  loading = false,
  onClick,
}) {
  const t = TONE[tone] || TONE.primary;
  const clickable = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      className={`card p-4 border-l-4 ${t.accent} ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {loading ? <span className="inline-block w-20 h-6 rounded bg-gray-200 animate-pulse" /> : value}
          </p>
          {hint && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg} ${t.icon}`}>
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
