import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

/**
 * Yagona Modal komponenti — barcha sahifalar shu yerdan import qilsin.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - title?: ReactNode
 * - footer?: ReactNode
 * - size?: 'sm'|'md'|'lg'|'xl' (default 'md')
 * - closeOnBackdrop?: boolean (default true)
 * - children
 */
export default function Modal({
  open,
  onClose,
  title,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = SIZES[size] || SIZES.md;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={() => closeOnBackdrop && onClose?.()}
      />
      <div
        ref={dialogRef}
        className={`relative w-full ${sizeClass} max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in`}
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-base font-semibold truncate pr-4">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Yopish"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div
            className="px-5 py-3 border-t flex items-center justify-end gap-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
