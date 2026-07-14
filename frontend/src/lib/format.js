// Helpers de presentación compartidos — sin lógica de negocio.

export function avatarUrl(nombre) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || '?')}&background=0f766e&color=f7f7f5&size=256`;
}

export function fmtHora(h) {
  if (!h) return '';
  const [hr, mn] = h.split(':');
  const n = Number(hr);
  return `${n % 12 || 12}:${mn} ${n >= 12 ? 'PM' : 'AM'}`;
}

export function fmtHoraCorta(h) {
  if (!h) return '';
  const [hr, mn] = h.split(':');
  const n = Number(hr);
  return `${n % 12 || 12}:${mn} ${n >= 12 ? 'pm' : 'am'}`;
}

export function fmtFechaLarga(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtFechaCorta(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtPrecio(p) {
  return `$${Number(p ?? 0).toFixed(2)}`;
}

// Mapa único de estados de reserva — misma semántica de color en toda la app.
export const ESTADOS = {
  PENDIENTE:    { label: 'Pendiente',    tone: 'warning' },
  ACEPTADA:     { label: 'Confirmada',   tone: 'success' },
  RECHAZADA:    { label: 'Rechazada',    tone: 'danger'  },
  CANCELADA:    { label: 'Cancelada',    tone: 'neutral' },
  FINALIZADA:   { label: 'Finalizada',   tone: 'brand'   },
  REPROGRAMADA: { label: 'Reprogramada', tone: 'gold'    },
  EXPIRADA:     { label: 'Expirada',     tone: 'neutral' },
};

export function estadoInfo(estado) {
  return ESTADOS[estado] ?? { label: estado || '—', tone: 'neutral' };
}
