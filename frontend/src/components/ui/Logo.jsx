// Wordmark Porcelana — Geist en minúsculas con punto jade.
const SIZES = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export default function Logo({ size = 'md', onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      className={`font-display font-semibold tracking-tight text-ink leading-none ${SIZES[size] ?? SIZES.md} ${className}`}
    >
      servi<span className="text-brand-600">.</span>
    </Tag>
  );
}
