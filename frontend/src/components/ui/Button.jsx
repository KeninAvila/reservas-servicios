import { Loader2 } from 'lucide-react';

// Porcelana: botones pill, un solo acento jade, transiciones de 200ms.
const VARIANTS = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-soft',
  dark:      'bg-ink text-white hover:bg-brand-950 shadow-soft',
  secondary: 'bg-white text-ink border border-sand hover:border-brand-400 hover:text-brand-700',
  ghost:     'text-ink/70 hover:bg-ink/5',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 shadow-soft',
  dangerOutline: 'bg-white text-danger-600 border border-danger-200 hover:bg-danger-50',
  whatsapp:  'bg-[#25D366] text-white hover:bg-[#1ebe5b] shadow-soft',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}
