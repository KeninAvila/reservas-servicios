import { X } from 'lucide-react';

export default function Modal({ onClose, title, kicker, children, maxWidth = 'sm:max-w-md' }) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeInSlow"
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`bg-white w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl shadow-lift animate-slideUp max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="min-w-0">
            {kicker && <p className="caption text-brand-600 mb-1">{kicker}</p>}
            <h2 className="font-display font-semibold text-xl text-ink truncate">{title}</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 w-9 h-9 rounded-full bg-cream hover:bg-sand flex items-center justify-center text-ink/50 hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
