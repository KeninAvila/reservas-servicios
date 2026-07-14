import { Loader2 } from 'lucide-react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

// Tarjeta fantasma para listas de profesionales / reservas.
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-sand p-5 flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/45">
      <Loader2 size={26} className="animate-spin text-brand-500" strokeWidth={1.75} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
