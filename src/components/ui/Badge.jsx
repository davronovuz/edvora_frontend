// Status badge — moliya statuslari uchun yagona ko'rinish.
// Variant nomlari domen-mustaqil; sahifalar status → variant moslashtiradi.

const VARIANTS = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const SIZES = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  children,
  className = '',
}) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap ${v} ${s} ${className}`}
    >
      {Icon}
      {children}
    </span>
  );
}
