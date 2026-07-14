import { useState, useEffect } from 'react';
import { CalendarDays, Clock, User, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, X } from 'lucide-react';
import api from '../services/api';

const ESTADO_STYLES = {
  PENDIENTE:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: <AlertCircle size={14} />, label: 'Pendiente' },
  ACEPTADA:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  icon: <CheckCircle2 size={14} />, label: 'Aceptada' },
  RECHAZADA:    { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: <XCircle size={14} />, label: 'Rechazada' },
  CANCELADA:    { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   icon: <XCircle size={14} />, label: 'Cancelada' },
  FINALIZADA:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 size={14} />, label: 'Finalizada' },
  REPROGRAMADA: { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  icon: <AlertCircle size={14} />, label: 'Reprogramada' },
  EXPIRADA:     { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-200',   icon: <XCircle size={14} />, label: 'Expirada' },
};

function formatFecha(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHora(hora) {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  const hNum = Number(h);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

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
  const estadoStyle = reserva ? (ESTADO_STYLES[reserva.estado] ?? ESTADO_STYLES.PENDIENTE) : null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg flex flex-col border-x border-slate-200">

        {/* Header */}
        <div className="bg-indigo-600 px-4 pt-6 pb-5 text-white">
          <button
            onClick={() => { window.location.hash = ''; }}
            className="flex items-center gap-1 text-indigo-200 text-xs mb-3 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} /> Inicio
          </button>
          <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-bold mb-1">Estado de tu cita</p>
          <h1 className="text-base font-bold leading-tight">Seguimiento de reserva</h1>
          <p className="text-indigo-300 text-[10px] mt-1 font-mono">{uuid}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-500">Buscando tu reserva...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl">😕</div>
              <p className="text-sm font-bold text-slate-700">No encontrada</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          )}

          {!loading && reserva && (
            <div className="space-y-3">

              {/* Estado card */}
              <div className={`rounded-2xl border ${estadoStyle.bg} ${estadoStyle.border} p-4`}>
                <div className={`flex items-center gap-2 ${estadoStyle.text} text-xs font-bold mb-1`}>
                  {estadoStyle.icon}
                  {estadoStyle.label}
                </div>
                {reserva.estado === 'PENDIENTE' && (
                  <p className={`text-[10px] ${estadoStyle.text} opacity-80`}>El profesional confirmará tu cita pronto.</p>
                )}
                {reserva.estado === 'ACEPTADA' && (
                  <p className={`text-[10px] ${estadoStyle.text} opacity-80`}>¡Tu cita está confirmada! Te esperamos.</p>
                )}
                {reserva.estado === 'CANCELADA' && (
                  <p className={`text-[10px] ${estadoStyle.text} opacity-80`}>Esta reserva fue cancelada.</p>
                )}
                {reserva.estado === 'RECHAZADA' && (
                  <p className={`text-[10px] ${estadoStyle.text} opacity-80`}>El profesional no pudo aceptar esta cita.</p>
                )}
                {reserva.estado === 'FINALIZADA' && (
                  <p className={`text-[10px] ${estadoStyle.text} opacity-80`}>¡Cita completada! Gracias por tu visita.</p>
                )}
              </div>

              {/* Info card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <User size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Cliente</p>
                    <p className="text-sm font-semibold text-slate-800">{reserva.cliente_nombre}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                    <CalendarDays size={14} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Fecha y hora</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{formatFecha(reserva.fecha)}</p>
                    <p className="text-xs text-slate-500">{formatHora(reserva.hora)} · {reserva.duracion_min} min</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Servicio</p>
                    <p className="text-sm font-semibold text-slate-800">{reserva.servicio_nombre}</p>
                    <p className="text-xs text-slate-500">Profesional: {reserva.profesional_nombre}</p>
                  </div>
                </div>

                {reserva.precio && (
                  <>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Precio</span>
                      <span className="text-sm font-bold text-slate-800">${Number(reserva.precio).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Error cancelación */}
              {cancelError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {cancelError}
                </div>
              )}

              {/* Canceled success */}
              {canceled && (
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs text-center">
                  Reserva cancelada correctamente.
                </div>
              )}

              {/* ── Sección profesional ── */}
              {reserva.estado === 'PENDIENTE' && !esProfesionalDueño && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-600">¿Eres el profesional de esta cita?</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Inicia sesión con tu cuenta profesional para aceptar o rechazar esta reserva.
                  </p>
                  <button
                    onClick={() => { window.location.hash = ''; }}
                    className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}

              {canRespond && !showRespondConfirm && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-indigo-700">Gestionar esta cita</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRespondConfirm('aceptar')}
                      className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={() => setShowRespondConfirm('rechazar')}
                      className="flex-1 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              )}

              {showRespondConfirm && (
                <div className={`rounded-2xl border p-4 space-y-3 ${showRespondConfirm === 'aceptar' ? 'border-indigo-200 bg-indigo-50' : 'border-red-200 bg-red-50'}`}>
                  <p className={`text-xs font-bold ${showRespondConfirm === 'aceptar' ? 'text-indigo-700' : 'text-red-700'}`}>
                    ¿Confirmas {showRespondConfirm === 'aceptar' ? 'aceptar' : 'rechazar'} esta cita?
                  </p>
                  {respondError && <p className="text-xs text-red-600">{respondError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRespondConfirm(null)}
                      className="flex-1 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleResponder(showRespondConfirm)}
                      disabled={responding}
                      className={`flex-1 py-2 text-white text-xs font-bold rounded-xl disabled:opacity-60 transition-colors ${showRespondConfirm === 'aceptar' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {responding ? 'Procesando...' : 'Sí, confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel button */}
              {canCancel && !showConfirm && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-2.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors"
                >
                  Cancelar cita
                </button>
              )}

              {/* Confirm cancel */}
              {showConfirm && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <p className="text-xs font-bold text-red-700">¿Seguro que quieres cancelar esta cita?</p>
                  <p className="text-[10px] text-red-600">Esta acción no se puede deshacer. Solo puedes cancelar con al menos 2 horas de anticipación.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-2 border border-slate-300 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      {canceling ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 text-center">
          <p className="text-[9px] text-slate-400 font-mono">Guarda este enlace para ver el estado de tu cita en cualquier momento.</p>
        </div>

      </div>
    </div>
  );
}
