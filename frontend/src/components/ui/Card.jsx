export default function Card({ as: Tag = 'div', hover = false, padding = 'p-5', className = '', children, ...props }) {
  return (
    <Tag
      className={`bg-white rounded-2xl border border-sand shadow-soft ${padding} ${
        hover ? 'transition-all duration-300 hover:shadow-card hover:border-brand-200 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h3 className="text-[11px] font-semibold text-ink/45 uppercase tracking-[0.18em]">{children}</h3>
      {action}
    </div>
  );
}
