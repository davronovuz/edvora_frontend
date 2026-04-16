import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const VARIANTS = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300',
  outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm',
  success: 'bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

/**
 * Yagona Button komponenti.
 * Loading=true bo'lsa o'zi disabled bo'ladi va spinner ko'rsatadi.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500
        ${v} ${s} ${className}`}
      {...rest}
    >
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
      ) : icon ? (
        <FontAwesomeIcon icon={icon} className="w-4 h-4" />
      ) : null}
      {children}
      {iconRight && !loading && <FontAwesomeIcon icon={iconRight} className="w-4 h-4" />}
    </button>
  );
}
