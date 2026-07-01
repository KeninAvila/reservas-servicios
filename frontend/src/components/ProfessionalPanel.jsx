import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Power, Edit2, MapPin, Calendar, Clock, Phone, CheckCircle, XCircle, Flag, ClipboardList, Settings2 } from 'lucide-react';
import api from '../services/api';
import ProfileSetupForm from './ProfileSetupForm';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ESTADO_BADGE = {
  PENDIENTE:    { label: 'Pendiente',    cls: 'bg-amber-100 text-amber-800' },
  ACEPTADA:     { label: 'Aceptada',     cls: 'bg-emerald-100 text-emerald-800' },
  RECHAZADA:    { label: 'Rechazada',    cls: 'bg-red-100 text-red-800' },
  FINALIZADA:   { label: 'Finalizada',   cls: 'bg-slate-100 text-slate-600' },
  CANCELADA:    { label: 'Cancelada',    cls: 'bg-slate-100 text-slate-500' },
  REPROGRAMADA: { label: 'Reprogramada', cls: 'bg-purple-100 text-purple-800' },
  EXPIRADA:     { label: 'Expirada',     cls: 'bg-slate-100 text-slate-400' },
};

function buildDefaultHorarios() {
  return DIAS.map((_, i) => ({
    dia_semana:  i,
    hora_inicio: '09:00',
    hora_fin:    '18:00',
    activo:      i >= 1 && i <= 5, // lunes-viernes activos por defecto
  }));
}

export default function ProfessionalPanel({
  professionals, bookings, activeProfId, loggedInUser,
  onUpdateBookings, onLogout,
}) {
  const rawProf = loggedInUser || professionals.find(p => p.id === activeProfId);
  if (!rawProf) return null;

  const displayName = rawProf.nombre || rawProf.name || '';
  const avatarUrl   = rawProf.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&size=128`;
  const profStatus  = rawProf.status || 'activo';

  // ── Estado de perfil ──────────────────────────────────────────────────────
  const [hasProfile,       setHasProfile]       = useState(loggedInUser ? null : true);
  const [profileData,      setProfileData]      = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // ── Servicios ─────────────────────────────────────────────────────────────
  const [localServices,    setLocalServices]    = useState([]);
  const [loadingServices,  setLoadingServices]  = useState(false);
  const [isAddingService,  setIsAddingService]  = useState(false);
  const [newServiceName,   setNewServiceName]   = useState('');
  const [newServiceDesc,   setNewServiceDesc]   = useState('');
  const [newServicePrice,  setNewServicePrice]  = useState(25);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [serviceError,     setServiceError]     = useState('');

  // ── Horarios ──────────────────────────────────────────────────────────────
  const [horarios,         setHorarios]         = useState(buildDefaultHorarios());
  const [savingHorarios,   setSavingHorarios]   = useState(false);
  const [horarioMsg,       setHorarioMsg]       = useState('');

  // ── Configuración de agenda ───────────────────────────────────────────────
  const [configAgenda,     setConfigAgenda]     = useState({ intervalo_agenda: 15, anticipacion_horas: 2, max_reserva_dias: 60 });
  const [savingConfig,     setSavingConfig]     = useState(false);
  const [configMsg,        setConfigMsg]        = useState('');

  // ── Excepciones de horario ────────────────────────────────────────────────
  const [excepciones,      setExcepciones]      = useState([]);
  const [newExcFecha,      setNewExcFecha]      = useState('');
  const [newExcMotivo,     setNewExcMotivo]     = useState('');
  const [excMsg,           setExcMsg]           = useState('');
  const [savingExc,        setSavingExc]        = useState(false);

  // ── Reservas ──────────────────────────────────────────────────────────────
  const [reservas,         setReservas]         = useState([]);
  const [loadingReservas,  setLoadingReservas]  = useState(false);
  const [reservaFiltro,    setReservaFiltro]    = useState('PENDIENTE');
  const [reservaMsg,       setReservaMsg]       = useState('');

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [panelTab, setPanelTab] = useState('agenda');

  // ── Carga inicial de perfil ───────────────────────────────────────────────
  const refetchProfile = useCallback(() =>
    api.get('/router.php?route=professional/profile')
      .then(res => { if (res.data.success) setProfileData(res.data.data); })
      .catch(() => {}),
  []);

  useEffect(() => {
    if (!loggedInUser) return;
    api.get('/router.php?route=professional/profile')
      .then(res => {
        const data = res.data.success ? res.data.data : null;
        setProfileData(data);
        setHasProfile(!!data);
      })
      .catch(() => setHasProfile(false));
  }, [loggedInUser]);

  // ── Carga de servicios ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedInUser || hasProfile !== true) return;
    setLoadingServices(true);
    api.get('/router.php?route=professional/service/list')
      .then(res => { if (res.data.success) setLocalServices(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, [loggedInUser, hasProfile]);

  // ── Carga de horarios + config + excepciones ──────────────────────────────
  useEffect(() => {
    if (!loggedInUser || hasProfile !== true) return;

    api.get('/router.php?route=professional/schedule')
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          const guardados = res.data.data;
          setHorarios(prev => prev.map(def => {
            const g = guardados.find(h => parseInt(h.dia_semana) === def.dia_semana);
            return g ? { ...def, hora_inicio: g.hora_inicio.slice(0, 5), hora_fin: g.hora_fin.slice(0, 5), activo: !!parseInt(g.activo) } : def;
          }));
        }
      })
      .catch(() => {});

    api.get('/router.php?route=professional/config')
      .then(res => { if (res.data.success) setConfigAgenda(res.data.data); })
      .catch(() => {});

    api.get('/router.php?route=professional/excepciones')
      .then(res => { if (res.data.success) setExcepciones(res.data.data); })
      .catch(() => {});
  }, [loggedInUser, hasProfile]);

  // ── Carga de reservas ─────────────────────────────────────────────────────
  const fetchReservas = useCallback((estado) => {
    if (!loggedInUser) return;
    setLoadingReservas(true);
    setReservaMsg('');
    const qs = estado ? `&estado=${estado}` : '';
    api.get(`/router.php?route=professional/reservas${qs}`)
      .then(res => { if (res.data.success) setReservas(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingReservas(false));
  }, [loggedInUser]);

  useEffect(() => {
    if (panelTab === 'agenda' && hasProfile === true) {
      fetchReservas(reservaFiltro);
    }
  }, [panelTab, hasProfile, reservaFiltro, fetchReservas]);

  // ── Servicios CRUD ────────────────────────────────────────────────────────
  async function handleAddService(e) {
    e.preventDefault();
    setServiceError('');
    if (!newServiceName.trim() || !newServiceDesc.trim()) return;
    try {
      const res = await api.post('/router.php?route=professional/service/upsert', {
        nombre: newServiceName.trim(), descripcion: newServiceDesc.trim(),
        precio: newServicePrice, duracion_min: newServiceDuration,
      });
      if (res.data.success) {
        const list = await api.get('/router.php?route=professional/service/list');
        if (list.data.success) setLocalServices(list.data.data);
        setNewServiceName(''); setNewServiceDesc(''); setIsAddingService(false);
      } else {
        setServiceError(res.data.message);
      }
    } catch { setServiceError('Error de conexión.'); }
  }

  async function handleDeleteService(id) {
    setServiceError('');
    try {
      const res = await api.delete('/router.php?route=professional/service/delete', { data: { id } });
      if (res.data.success) setLocalServices(prev => prev.filter(s => s.id !== id));
      else setServiceError(res.data.message);
    } catch { setServiceError('Error de conexión.'); }
  }

  async function handleToggleStatus(id, currentEstado) {
    const nuevoEstado = currentEstado === 'activo' ? 'inactivo' : 'activo';
    try {
      const res = await api.patch('/router.php?route=professional/service/status', { id, estado: nuevoEstado });
      if (res.data.success)
        setLocalServices(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
    } catch {}
  }

  // ── Horarios ──────────────────────────────────────────────────────────────
  function toggleDia(i) {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, activo: !h.activo } : h));
  }

  function changeHora(i, campo, val) {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [campo]: val } : h));
  }

  async function handleSaveHorarios() {
    setSavingHorarios(true);
    setHorarioMsg('');
    try {
      const res = await api.post('/router.php?route=professional/schedule/save', { horarios });
      setHorarioMsg(res.data.success ? '✓ Horarios guardados.' : res.data.message);
    } catch { setHorarioMsg('Error de conexión.'); }
    finally { setSavingHorarios(false); setTimeout(() => setHorarioMsg(''), 3000); }
  }

  // ── Config de agenda ─────────────────────────────────────────────────────
  async function handleSaveConfig() {
    setSavingConfig(true);
    setConfigMsg('');
    try {
      const res = await api.post('/router.php?route=professional/config/save', configAgenda);
      setConfigMsg(res.data.success ? '✓ Configuración guardada.' : res.data.message);
    } catch { setConfigMsg('Error de conexión.'); }
    finally { setSavingConfig(false); setTimeout(() => setConfigMsg(''), 3000); }
  }

  // ── Excepciones ───────────────────────────────────────────────────────────
  async function handleAddExcepcion(e) {
    e.preventDefault();
    if (!newExcFecha) return;
    setSavingExc(true);
    setExcMsg('');
    try {
      const res = await api.post('/router.php?route=professional/excepciones/create', { fecha: newExcFecha, motivo: newExcMotivo });
      if (res.data.success) {
        setNewExcFecha(''); setNewExcMotivo('');
        const list = await api.get('/router.php?route=professional/excepciones');
        if (list.data.success) setExcepciones(list.data.data);
      } else {
        setExcMsg(res.data.message);
      }
    } catch { setExcMsg('Error de conexión.'); }
    finally { setSavingExc(false); }
  }

  async function handleDeleteExcepcion(id) {
    try {
      const res = await api.delete('/router.php?route=professional/excepciones/delete', { data: { id } });
      if (res.data.success) setExcepciones(prev => prev.filter(e => e.id !== id));
    } catch {}
  }

  // ── Reservas acciones ─────────────────────────────────────────────────────
  async function handleReservaStatus(id, estado, respuesta = null) {
    setReservaMsg('');
    try {
      const payload = { id, estado };
      if (respuesta) payload.respuesta = respuesta;
      const res = await api.patch('/router.php?route=professional/reservas/status', payload);
      if (res.data.success) {
        fetchReservas(reservaFiltro);
      } else {
        setReservaMsg(res.data.message);
      }
    } catch { setReservaMsg('Error de conexión.'); }
  }

  // ── Checks de estado ─────────────────────────────────────────────────────
  const statusColor = profStatus === 'activo' ? 'text-indigo-500'
    : profStatus === 'pendiente' ? 'text-amber-500'
    : 'text-red-500';

  if (hasProfile === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-slate-400">Cargando tu perfil...</p>
      </div>
    );
  }

  if (hasProfile === false) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shadow-md shadow-indigo-100" />
            <h1 className="font-black text-slate-900 text-sm">{displayName}</h1>
          </div>
          <button onClick={onLogout} className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors">Salir</button>
        </header>
        <ProfileSetupForm onComplete={() => { refetchProfile(); setHasProfile(true); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-xl object-cover shadow-md shadow-indigo-100" />
          <div>
            <h1 className="font-black text-slate-900 text-sm leading-tight">{displayName}</h1>
            <span className={`text-[9px] font-bold uppercase ${statusColor}`}>● {profStatus}</span>
          </div>
        </div>
        <button onClick={onLogout} className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">Salir</button>
      </header>

      {/* Tabs principales */}
      <div className="flex bg-slate-100 p-1 mx-4 mt-4 rounded-xl gap-1 text-xs font-bold">
        <button onClick={() => setPanelTab('agenda')} className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all ${panelTab === 'agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <ClipboardList size={13} /> Reservas
        </button>
        <button onClick={() => setPanelTab('configuracion')} className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all ${panelTab === 'configuracion' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Settings2 size={13} /> Configuración
        </button>
      </div>

      {/* ── TAB: AGENDA / RESERVAS ── */}
      {panelTab === 'agenda' && (
        <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-8">
          {/* Filtro de estado */}
          <div className="flex gap-1.5 flex-wrap">
            {['PENDIENTE', 'ACEPTADA', 'FINALIZADA', 'RECHAZADA'].map(est => (
              <button
                key={est}
                onClick={() => setReservaFiltro(est)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${reservaFiltro === est ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
              >
                {ESTADO_BADGE[est]?.label}
              </button>
            ))}
            <button
              onClick={() => setReservaFiltro('')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${reservaFiltro === '' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              Todas
            </button>
          </div>

          {reservaMsg && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{reservaMsg}</div>
          )}

          {loadingReservas ? (
            <p className="text-xs text-slate-400 text-center py-10">Cargando reservas...</p>
          ) : reservas.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-medium">No hay reservas {ESTADO_BADGE[reservaFiltro]?.label?.toLowerCase() || ''}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservas.map(r => {
                const badge = ESTADO_BADGE[r.estado] || { label: r.estado, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{r.servicio_nombre}</h3>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{r.uuid}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span>{r.fecha}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span>{r.hora.slice(0, 5)} · {r.duracion_min} min</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1 text-slate-700">
                      <p><strong>Cliente:</strong> {r.cliente_nombre}</p>
                      <p className="flex items-center gap-1">
                        <Phone size={10} className="text-slate-400 shrink-0" />
                        <a href={`tel:${r.cliente_telefono}`} className="text-indigo-600 hover:underline">{r.cliente_telefono}</a>
                      </p>
                      {r.cliente_nota && <p className="text-slate-500 italic">"{r.cliente_nota}"</p>}
                    </div>
                    <p className="text-xs font-bold text-slate-800">${parseFloat(r.precio).toFixed(2)}</p>
                    {/* Acciones según estado */}
                    {r.estado === 'PENDIENTE' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleReservaStatus(r.id, 'ACEPTADA')} className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors">
                          <CheckCircle size={13} /> Aceptar
                        </button>
                        <button onClick={() => handleReservaStatus(r.id, 'RECHAZADA')} className="flex items-center justify-center gap-1 border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 rounded-xl text-xs transition-colors">
                          <XCircle size={13} /> Rechazar
                        </button>
                      </div>
                    )}
                    {r.estado === 'ACEPTADA' && (
                      <button onClick={() => handleReservaStatus(r.id, 'FINALIZADA')} className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors">
                        <Flag size={13} /> Marcar como finalizada
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ── TAB: CONFIGURACION ── */}
      {panelTab === 'configuracion' && isEditingProfile && (
        <ProfileSetupForm
          initialData={profileData}
          onCancel={() => setIsEditingProfile(false)}
          onComplete={() => { refetchProfile(); setIsEditingProfile(false); }}
        />
      )}

      {panelTab === 'configuracion' && !isEditingProfile && (
        <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-8">

          {/* Mi Perfil */}
          {profileData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Mi Perfil</h3>
                <button onClick={() => setIsEditingProfile(true)} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5 font-semibold">
                  <Edit2 size={12} /> Editar
                </button>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
                <p><strong>Categoría:</strong> {profileData.categoria}</p>
                <p className="flex items-start gap-1">
                  <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                  <span>{profileData.direccion_1}{profileData.direccion_2 ? `, ${profileData.direccion_2}` : ''}</span>
                </p>
                <p className="text-slate-600">{profileData.descripcion}</p>
              </div>
            </div>
          )}

          {/* Servicios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Servicios</h3>
              <button onClick={() => { setIsAddingService(!isAddingService); setServiceError(''); }} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5 font-semibold">
                <Plus size={14} /> Añadir
              </button>
            </div>

            {serviceError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{serviceError}</div>
            )}

            {isAddingService && (
              <form onSubmit={handleAddService} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-slate-700">Nuevo Servicio</span>
                <input type="text" required placeholder="Nombre del servicio" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
                <input type="text" required placeholder="Descripción del servicio" value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Precio ($)</span>
                    <input type="number" required min="0.01" step="0.01" value={newServicePrice} onChange={e => setNewServicePrice(Number(e.target.value))} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Duración (min)</span>
                    <input type="number" required min="5" max="480" value={newServiceDuration} onChange={e => setNewServiceDuration(Number(e.target.value))} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 text-xs pt-1">
                  <button type="button" onClick={() => { setIsAddingService(false); setServiceError(''); }} className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-3 py-1 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Añadir</button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-1.5">
              {loadingServices ? (
                <p className="text-xs text-slate-400 text-center py-4">Cargando servicios...</p>
              ) : localServices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aún no tienes servicios. Añade el primero.</p>
              ) : localServices.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                  <div className="text-xs min-w-0 flex-1 mr-2">
                    <span className="font-bold text-slate-800 block truncate">{s.nombre}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.duracion_min} min · ${parseFloat(s.precio).toFixed(2)}</span>
                    {s.descripcion && <span className="text-[10px] text-slate-400 block truncate">{s.descripcion}</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button title={s.estado === 'inactivo' ? 'Activar' : 'Desactivar'} onClick={() => handleToggleStatus(s.id, s.estado || 'activo')} className={`p-1.5 rounded-lg transition-colors ${s.estado === 'inactivo' ? 'text-slate-400 bg-slate-100 hover:bg-slate-200' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                      <Power size={13} />
                    </button>
                    <button onClick={() => handleDeleteService(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Horarios de Atención</h3>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
              {horarios.map((h, i) => (
                <div key={h.dia_semana} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-b-0 text-xs gap-2">
                  <span className={`font-semibold w-20 shrink-0 ${h.activo ? 'text-slate-800' : 'text-slate-400'}`}>{DIAS[h.dia_semana]}</span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" checked={h.activo} onChange={() => toggleDia(i)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <input type="time" disabled={!h.activo} value={h.hora_inicio} onChange={e => changeHora(i, 'hora_inicio', e.target.value)} className={`text-xs py-1 px-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 ${!h.activo ? 'bg-slate-50 text-slate-400' : 'bg-white'}`} />
                    <span className="text-slate-400">–</span>
                    <input type="time" disabled={!h.activo} value={h.hora_fin} onChange={e => changeHora(i, 'hora_fin', e.target.value)} className={`text-xs py-1 px-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 ${!h.activo ? 'bg-slate-50 text-slate-400' : 'bg-white'}`} />
                  </div>
                </div>
              ))}
            </div>

            {horarioMsg && (
              <p className={`text-xs font-semibold ${horarioMsg.startsWith('✓') ? 'text-indigo-600' : 'text-red-600'}`}>{horarioMsg}</p>
            )}

            <button
              onClick={handleSaveHorarios}
              disabled={savingHorarios}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm shadow-indigo-200"
            >
              {savingHorarios ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>

          {/* Configuración de agenda */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Configuración de Agenda</h3>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Intervalo entre turnos (min)</label>
                <select
                  value={configAgenda.intervalo_agenda}
                  onChange={e => setConfigAgenda(prev => ({ ...prev, intervalo_agenda: Number(e.target.value) }))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {[5, 10, 15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} minutos</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Anticipación mínima para reservar (horas)</label>
                <input
                  type="number" min="1" max="48"
                  value={configAgenda.anticipacion_horas}
                  onChange={e => setConfigAgenda(prev => ({ ...prev, anticipacion_horas: Number(e.target.value) }))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Máximo días en avance para reservar</label>
                <input
                  type="number" min="1" max="365"
                  value={configAgenda.max_reserva_dias}
                  onChange={e => setConfigAgenda(prev => ({ ...prev, max_reserva_dias: Number(e.target.value) }))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            {configMsg && (
              <p className={`text-xs font-semibold ${configMsg.startsWith('✓') ? 'text-indigo-600' : 'text-red-600'}`}>{configMsg}</p>
            )}
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm shadow-indigo-200"
            >
              {savingConfig ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>

          {/* Excepciones de horario */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Días no disponibles</h3>
            <form onSubmit={handleAddExcepcion} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newExcFecha}
                  onChange={e => setNewExcFecha(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 col-span-2"
                />
                <input
                  type="text"
                  placeholder="Motivo (opcional)"
                  value={newExcMotivo}
                  onChange={e => setNewExcMotivo(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 col-span-2"
                />
              </div>
              {excMsg && <p className="text-xs text-red-600">{excMsg}</p>}
              <button type="submit" disabled={savingExc} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                {savingExc ? 'Guardando...' : '+ Marcar día no disponible'}
              </button>
            </form>

            <div className="space-y-1.5">
              {excepciones.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Sin días bloqueados.</p>
              ) : excepciones.map(ex => (
                <div key={ex.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <div className="text-xs">
                    <span className="font-bold text-red-700">{ex.fecha}</span>
                    {ex.motivo && <span className="text-red-500 ml-2">— {ex.motivo}</span>}
                  </div>
                  <button onClick={() => handleDeleteExcepcion(ex.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </main>
      )}
    </div>
  );
}
