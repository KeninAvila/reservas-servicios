import { estadoInfo } from '../../lib/format';

const TONES = {
  brand:   'bg-brand-50 text-brand-700 border-brand-100',
  success: 'bg-brand-50 text-brand-700 border-brand-100',
  warning: 'bg-gold-100 text-gold-700 border-gold-200',
  danger:  'bg-danger-50 text-danger-700 border-danger-100',
  gold:    'bg-gold-100 text-gold-700 border-gold-200',
  neutral: 'bg-sand text-ink/55 border-sand',
};

export default function Badge({ tone = 'neutral', dot = true, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

// Badge de estado de reserva — usa el mapa único de lib/format.
export function EstadoBadge({ estado, className = '' }) {
  const info = estadoInfo(estado);
  return <Badge tone={info.tone} className={className}>{info.label}</Badge>;
}
