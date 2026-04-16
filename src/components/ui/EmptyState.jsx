import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';

/**
 * Bo'sh holat — ro'yxat bo'sh bo'lganda ko'rsatiladi.
 */
export default function EmptyState({
  icon = faInbox,
  title = "Ma'lumot yo'q",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
      >
        <FontAwesomeIcon icon={icon} className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
