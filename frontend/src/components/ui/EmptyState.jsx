export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`text-center py-14 px-6 rounded-2xl border border-dashed border-sand bg-white/60 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-4">
          <Icon size={24} className="text-brand-400" strokeWidth={1.5} />
        </div>
      )}
      <p className="font-display text-base text-ink">{title}</p>
      {description && <p className="text-sm text-ink/50 mt-1.5 max-w-xs mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
