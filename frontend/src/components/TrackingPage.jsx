import { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, CheckCircle2, XCircle, AlertCircle, SearchX } from 'lucide-react';
import api from '../services/api';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { EstadoBadge } from './ui/Badge';
import { Spinner } from './ui/Skeleton';
import { ErrorNote } from './ui/Field';
import { fmtFechaLarga, fmtHora, fmtPrecio } from '../lib/format';

function citaYaOcurrio(fecha, hora) {
  return new Date(`${fecha}T${hora}`) <= new Date();
}

const ESTADO_HERO = {
  PENDIENTE:    { icon: AlertCircle,  cls: 'bg-gold-100 text-gold-700',    msg: 'El profesional confirmará tu cita pronto.' },
  ACEPTADA:     { icon: CheckCircle2, cls: 'bg-brand-50 text-brand-700',   msg: 'Tu cita está confirmada. Te esperamos.' },
  RECHAZADA:    { icon: XCircle,      cls: 'bg-danger-50 text-danger-600', msg: 'El profesional no pudo aceptar esta cita.' },
  CANCELADA:    { icon: XCircle,      cls: 'bg-sand text-ink/50',          msg: 'Esta reserva fue cancelada.' },
  FINALIZADA:   { icon: CheckCircle2, cls: 'bg-brand-50 text-brand-700',   msg: 'Cita completada. Gracias por tu visita.' },
  REPROGRAMADA: { icon: AlertCircle,  cls: 'bg-gold-100 text-gold-700',    msg: 'Esta cita fue reprogramada.' },
  EXPIRADA:     { icon: XCircle,      cls: 'bg-sand text-ink/50',          msg: 'Esta reserva expiró.' },
};

export default function TrackingPage({ uuid }) {
  const [reserva, setReserva]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [canceling,   setCanceling]   = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [canceled,    setCanceled]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [authUser,    setAuthUser]    = useState(null);
  const [responding,  setResponding]  = useState(false);
  const [respondError, setRespondError] = useState('');
  const [showRespondConfirm, setShowRespondConfirm] = useState(null);

  useEffect(() => {
    api.get(`/router.php?route=public/tracking&uuid=${uuid}`)
      .then(res => {
        if (res.data.success) setReserva(res.data.data);
        else setError('Reserva no encontrada.');
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setLoading(false));

    api.get('/router.php?route=auth/me')
      .then(res => { if (res.data.success) setAuthUser(res.data.data); })
      .catch(() => {});
  }, [uuid]);

  async function handleCancel() {
    setCanceling(true);
    setCancelError('');
    try {
      const res = await api.post('/router.php?route=public/reserva/cancel', { uuid });
      if (res.data.success) {
        setCanceled(true);
        setReserva(prev => ({ ...prev, estado: 'CANCELADA' }));
      } else {
        setCancelError(res.data.message || 'No se pudo cancelar.');
      }
    } catch {
      setCancelError('Error de conexión.');
    } finally {
      setCanceling(false);
      setShowConfirm(false);
    }
  }

  async function handleResponder(accion) {
    setResponding(true);
    setRespondError('');
    try {
      const res = await api.post('/router.php?route=professional/reserva/responder', { uuid, accion });
      if (res.data.success) {
        setReserva(prev => ({ ...prev, estado: res.data.data.estado }));
      } else {
        setRespondError(res.data.message || 'No se pudo actualizar.');
      }
    } catch {
      setRespondError('Error de conexión.');
    } finally {
      setResponding(false);
      setShowRespondConfirm(null);
    }
  }

  const canCancel  = reserva && ['PENDIENTE', 'ACEPTADA'].includes(reserva.estado) && !canceled;
  // Solo el profesional dueño de la reserva, con sesión activa
  const esProfesionalDueño = authUser?.id_rol === 2 && authUser?.id === reserva?.profesional_user_id;
  const canRespond = reserva && reserva.estado === 'PENDIENTE' && esProfesionalDueño;
  const hero = reserva ? (ESTADO_HERO[reserva.estado] ?? ESTADO_HERO.PENDIENTE) : null;

  return (
    <div className="min-h-screen bg-cream text-ink antialiased flex flex-col">

      {/* Header */}
      <header className="glass border-b border-ink/5 sticky top-0 z-40">
        <div className="max-w-lg md:max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo onClick={() => { window.location.hash = ''; }} />
          <button
            onClick={() => { window.location.hash = ''; }}
            className="text-xs font-semibold text-ink/55 hover:text-brand-700 transition-colors"
          >
            ← Inicio
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg md:max-w-xl mx-auto px-5 py-8">

        <p className="caption text-brand-600">Seguimiento de reserva</p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight mt-1.5">Estado de tu cita</h1>
        <p className="font-mono text-[10px] text-ink/30 mt-1.5 tracking-wider uppercase">{uuid}</p>

        {loading && <Spinner label="Buscando tu reserva…" />}

        {!loading && error && (
          <div className="mt-8 bg-white rounded-2xl border border-sand py-14 px-6 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto">
              <SearchX size={22} className="text-ink/30" strokeWidth={1.5} />
            </div>
            <p className="font-display font-semibold text-lg text-ink mt-5">Reserva no encontrada</p>
            <p className="text-sm text-ink/50 mt-1.5">{error}</p>
          </div>
        )}

        {!loading && reserva && (
          <div className="mt-7 space-y-4 animate-fadeIn">

            {/* Estado */}
            <div className="bg-white rounded-2xl border border-sand p-5 flex items-center gap-4">
              <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${hero.cls}`}>
                <hero.icon size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <EstadoBadge estado={reserva.estado} />
                <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{hero.msg}</p>
              </div>
            </div>

            {/* Detalle */}
            <div className="bg-white rounded-2xl border border-sand overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-4 border-b border-sand">
                <span className="w-9 h-9 rounded-full bg-cream flex items-center justify-center shrink-0">
                  <User size={15} className="text-brand-600" />
                </span>
                <div className="min-w-0">
                  <p className="caption text-ink/40">Cliente</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">{reserva.cliente_nombre}</p>
                </div>
              </div>

              <div className="px-5 py-4 flex items-start gap-4 border-b border-sand">
                <span className="w-9 h-9 rounded-full bg-cream flex items-center justify-center shrink-0">
                  <CalendarDays size={15} className="text-brand-600" />
                </span>
                <div className="min-w-0">
                  <p className="caption text-ink/40">Fecha y hora</p>
                  <p className="text-sm font-semibold text-ink mt-0.5 capitalize">{fmtFechaLarga(reserva.fecha)}</p>
                  <p className="text-xs text-ink/50 mt-0.5">{fmtHora(reserva.hora)} · {reserva.duracion_min} min</p>
                </div>
              </div>

              <div className="px-5 py-4 flex items-start gap-4">
                <span className="w-9 h-9 rounded-full bg-cream flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-brand-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="caption text-ink/40">Servicio</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">{reserva.servicio_nombre}</p>
                  <p className="text-xs text-ink/50 mt-0.5">Profesional: {reserva.profesional_nombre}</p>
                </div>
              </div>

              {reserva.precio && (
                <div className="px-5 py-4 flex items-center justify-between border-t border-sand bg-cream/50">
                  <span className="text-sm text-ink/50">Total</span>
                  <span className="font-display font-semibold text-lg text-brand-700 tabular-nums">{fmtPrecio(reserva.precio)}</span>
                </div>
              )}
            </div>

            <ErrorNote>{cancelError}</ErrorNote>

            {canceled && (
              <p className="text-sm text-ink/55 text-center bg-white border border-sand rounded-2xl py-3">
                Reserva cancelada correctamente.
              </p>
            )}

            {/* ── Sección profesional ── */}
            {reserva.estado === 'PENDIENTE' && !esProfesionalDueño && (
              <div className="bg-white rounded-2xl border border-sand p-5">
                <p className="text-sm font-semibold text-ink">¿Eres el profesional de esta cita?</p>
                <p className="text-xs text-ink/50 leading-relaxed mt-1.5">
                  Inicia sesión con tu cuenta profesional para aceptar o rechazar esta reserva.
                </p>
                <Button size="sm" full className="mt-4" onClick={() => { window.location.hash = ''; }}>
                  Iniciar sesión
                </Button>
              </div>
            )}

            {canRespond && !showRespondConfirm && (
              <div className="bg-white rounded-2xl border border-brand-200 p-5">
                <p className="text-sm font-semibold text-ink">Gestionar esta cita</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm" className="flex-1"
                    disabled={citaYaOcurrio(reserva.fecha, reserva.hora)}
                    title={citaYaOcurrio(reserva.fecha, reserva.hora) ? 'La fecha y hora de esta cita ya pasó' : undefined}
                    onClick={() => setShowRespondConfirm('aceptar')}
                  >
                    <CheckCircle2 size={14} /> Aceptar
                  </Button>
                  <Button variant="dangerOutline" size="sm" className="flex-1" onClick={() => setShowRespondConfirm('rechazar')}>
                    <XCircle size={14} /> Rechazar
                  </Button>
                </div>
                {citaYaOcurrio(reserva.fecha, reserva.hora) && (
                  <p className="text-[10px] text-ink/40 mt-2 text-center">Esta cita ya pasó de fecha — solo puedes rechazarla.</p>
                )}
              </div>
            )}

            {showRespondConfirm && (
              <div className={`bg-white rounded-2xl border p-5 space-y-4 ${showRespondConfirm === 'aceptar' ? 'border-brand-200' : 'border-danger-200'}`}>
                <p className="text-sm font-semibold text-ink">
                  ¿Confirmas {showRespondConfirm === 'aceptar' ? 'aceptar' : 'rechazar'} esta cita?
                </p>
                <ErrorNote>{respondError}</ErrorNote>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowRespondConfirm(null)}>
                    Volver
                  </Button>
                  <Button
                    variant={showRespondConfirm === 'aceptar' ? 'primary' : 'danger'}
                    size="sm"
                    className="flex-1"
                    loading={responding}
                    onClick={() => handleResponder(showRespondConfirm)}
                  >
                    {responding ? 'Procesando…' : 'Sí, confirmar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel button */}
            {canCancel && !showConfirm && (
              <Button variant="dangerOutline" full onClick={() => setShowConfirm(true)}>
                Cancelar cita
              </Button>
            )}

            {/* Confirm cancel */}
            {showConfirm && (
              <div className="bg-white rounded-2xl border border-danger-200 p-5 space-y-4">
                <p className="text-sm font-semibold text-ink">¿Seguro que quieres cancelar esta cita?</p>
                <p className="text-xs text-ink/50 leading-relaxed">
                  Esta acción no se puede deshacer. Solo puedes cancelar con al menos 2 horas de anticipación.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowConfirm(false)}>
                    Volver
                  </Button>
                  <Button variant="danger" size="sm" className="flex-1" loading={canceling} onClick={handleCancel}>
                    {canceling ? 'Cancelando…' : 'Sí, cancelar'}
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 pb-6 pt-2 text-center">
        <p className="text-[11px] text-ink/35">Guarda este enlace para consultar el estado de tu cita en cualquier momento.</p>
      </footer>

    </div>
  );
}
