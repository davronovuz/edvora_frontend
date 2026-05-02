import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const VARIANTS = {
  danger:  { confirm: '#EF4444', hover: '#DC2626', label: 'Ha, o\'chirish' },
  warning: { confirm: '#EAB308', hover: '#CA8A04', label: 'Tasdiqlash' },
  primary: { confirm: '#F97316', hover: '#EA580C', label: 'Tasdiqlash' },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Tasdiqlaysizmi?',
  description,
  variant = 'danger',
  confirmText,
  cancelText = 'Bekor qilish',
  isLoading = false,
}) {
  const cfg = VARIANTS[variant] || VARIANTS.danger;
  const btnLabel = confirmText || cfg.label;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape' && !isLoading) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!isLoading) onClose(); }}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          animation: 'scaleIn 0.15s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${cfg.confirm}1a` }}
        >
          {variant === 'warning' ? (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={cfg.confirm} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={cfg.confirm} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          {description && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl border font-medium text-sm transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl font-medium text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: cfg.confirm }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = cfg.hover; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = cfg.confirm; }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : btnLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>,
    document.body,
  );
}
