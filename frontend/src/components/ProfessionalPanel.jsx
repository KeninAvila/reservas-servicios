import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Power, Edit2, MapPin, Calendar, Clock, Phone, CheckCircle, XCircle,
  Flag, ClipboardList, Settings2, BarChart2, Share2, Check, ImagePlus, LogOut, Inbox,
} from 'lucide-react';
import api from '../services/api';
import ProfileSetupForm from './ProfileSetupForm';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import Card, { SectionTitle } from './ui/Card';
import EmptyState from './ui/EmptyState';
import { EstadoBadge } from './ui/Badge';
import { Input, Select, ErrorNote } from './ui/Field';
import { Spinner, SkeletonCard } from './ui/Skeleton';
import { estadoInfo, fmtPrecio } from '../lib/format';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [stats,         setStats]         = useState(null);
  const [loadingStats,  setLoadingStats]  = useState(false);
  const [linkCopied,    setLinkCopied]    = useState(false);

  // ── Banner upload ─────────────────────────────────────────────────────────
  const [bannerFile,       setBannerFile]       = useState(null);
  const [bannerPreview,    setBannerPreview]    = useState(null);
  const [uploadingBanner,  setUploadingBanner]  = useState(false);
  const [bannerMsg,        setBannerMsg]        = useState('');
  const bannerInputRef = useRef(null);

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
    if (panelTab === 'stats' && !stats && !loadingStats) {
      setLoadingStats(true);
      api.get('/router.php?route=professional/stats')
        .then(res => { if (res.data.success) setStats(res.data.data); })
        .catch(() => {})
        .finally(() => setLoadingStats(false));
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

  // ── Banner upload ─────────────────────────────────────────────────────────
  function handleBannerChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerMsg('');
  }

  async function handleBannerUpload() {
    if (!bannerFile) return;
    setUploadingBanner(true);
    setBannerMsg('');
    try {
      const form = new FormData();
      form.append('banner', bannerFile);
      const res = await api.post('/router.php?route=professional/banner/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setProfileData(prev => ({ ...prev, banner: res.data.data.banner }));
        setBannerFile(null);
        setBannerPreview(null);
        setBannerMsg('✓ Banner actualizado.');
      } else {
        setBannerMsg(res.data.message || 'Error al subir el banner.');
      }
    } catch { setBannerMsg('Error de conexión.'); }
    finally { setUploadingBanner(false); setTimeout(() => setBannerMsg(''), 4000); }
  }

  // ── Checks de estado ─────────────────────────────────────────────────────
  const statusColor = profStatus === 'activo' ? 'text-brand-600'
    : profStatus === 'pendiente' ? 'text-gold-600'
    : 'text-danger-600';

  const panelHeader = (
    <header className="bg-cream/90 backdrop-blur-md border-b border-sand sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={rawProf.avatar} name={displayName} size="sm" className="rounded-full" />
          <div className="min-w-0">
            <h1 className="font-display text-base text-ink leading-tight truncate">{displayName}</h1>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}>● {profStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasProfile === true && (
            <button
              onClick={() => {
                const profId = profileData?.id;
                if (!profId) return;
                const url = `${window.location.origin}${window.location.pathname}#/p/${profId}`;
                navigator.clipboard.writeText(url).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white border border-sand hover:border-brand-300 px-3.5 py-2 rounded-full transition-colors"
            >
              {linkCopied ? <Check size={13} /> : <Share2 size={13} />}
              <span className="hidden sm:inline">{linkCopied ? 'Copiado' : 'Mi página'}</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 bg-white border border-sand hover:border-danger-200 hover:bg-danger-50 px-3.5 py-2 rounded-full transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );

  if (hasProfile === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Spinner label="Cargando tu perfil…" />
      </div>
    );
  }

  if (hasProfile === false) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        {panelHeader}
        <ProfileSetupForm onComplete={() => { refetchProfile(); setHasProfile(true); }} />
      </div>
    );
  }

  const TABS = [
    ['agenda',        'Reservas',      ClipboardList],
    ['configuracion', 'Configuración', Settings2],
    ['stats',         'Estadísticas',  BarChart2],
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {panelHeader}

      {/* Tabs principales */}
      <div className="max-w-5xl mx-auto w-full px-5 mt-6">
        <div className="flex bg-white border border-sand p-1 rounded-xl gap-1 text-xs font-semibold shadow-soft max-w-md">
          {TABS.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setPanelTab(key)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                panelTab === key ? 'bg-brand-600 text-cream shadow-soft' : 'text-ink/45 hover:text-ink/70'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 7)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: AGENDA / RESERVAS ── */}
      {panelTab === 'agenda' && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-6 pb-16 space-y-5">
          {/* Filtro de estado */}
          <div className="flex gap-2 flex-wrap">
            {['PENDIENTE', 'ACEPTADA', 'FINALIZADA', 'RECHAZADA'].map(est => (
              <button
                key={est}
                onClick={() => setReservaFiltro(est)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  reservaFiltro === est
                    ? 'bg-brand-600 text-cream border-brand-600 shadow-soft'
                    : 'bg-white text-ink/55 border-sand hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {estadoInfo(est).label}
              </button>
            ))}
            <button
              onClick={() => setReservaFiltro('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                reservaFiltro === ''
                  ? 'bg-brand-600 text-cream border-brand-600 shadow-soft'
                  : 'bg-white text-ink/55 border-sand hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              Todas
            </button>
          </div>

          <ErrorNote>{reservaMsg}</ErrorNote>

          {loadingReservas ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : reservas.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={reservaFiltro ? `Sin reservas ${estadoInfo(reservaFiltro).label.toLowerCase()}s` : 'Sin reservas'}
              description="Cuando un cliente reserve una cita contigo, aparecerá aquí."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reservas.map(r => (
                <Card key={r.id} className="animate-fadeIn flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base text-ink leading-tight truncate">{r.servicio_nombre}</h3>
                      <span className="text-[10px] font-mono text-ink/30 mt-1 block truncate">{r.uuid}</span>
                    </div>
                    <EstadoBadge estado={r.estado} className="shrink-0" />
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink/60 mt-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-brand-500 shrink-0" /> {r.fecha}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-brand-500 shrink-0" /> {r.hora.slice(0, 5)} · {r.duracion_min} min
                    </span>
                  </div>

                  <div className="bg-cream rounded-xl p-3.5 text-xs space-y-1.5 text-ink/70 mt-4">
                    <p><span className="font-semibold text-ink">Cliente:</span> {r.cliente_nombre}</p>
                    <p className="flex items-center gap-1.5">
                      <Phone size={11} className="text-ink/35 shrink-0" />
                      <a href={`tel:${r.cliente_telefono}`} className="text-brand-700 font-semibold hover:underline">{r.cliente_telefono}</a>
                    </p>
                    {r.cliente_nota && <p className="text-ink/50 italic">"{r.cliente_nota}"</p>}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-sand">
                    <span className="font-display text-base text-brand-700">{fmtPrecio(r.precio)}</span>
                  </div>

                  {/* Acciones según estado */}
                  {r.estado === 'PENDIENTE' && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button size="sm" onClick={() => handleReservaStatus(r.id, 'ACEPTADA')}>
                        <CheckCircle size={13} /> Aceptar
                      </Button>
                      <Button size="sm" variant="dangerOutline" onClick={() => handleReservaStatus(r.id, 'RECHAZADA')}>
                        <XCircle size={13} /> Rechazar
                      </Button>
                    </div>
                  )}
                  {r.estado === 'ACEPTADA' && (
                    <Button size="sm" full className="mt-3" onClick={() => handleReservaStatus(r.id, 'FINALIZADA')}>
                      <Flag size={13} /> Marcar como finalizada
                    </Button>
                  )}
                </Card>
              ))}
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
        <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-6 pb-16">
          <div className="grid gap-8 lg:grid-cols-2 items-start">

            {/* Columna izquierda */}
            <div className="space-y-8">

              {/* Mi Perfil */}
              {profileData && (
                <section className="space-y-3">
                  <SectionTitle
                    action={
                      <button onClick={() => setIsEditingProfile(true)} className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1">
                        <Edit2 size={12} /> Editar
                      </button>
                    }
                  >
                    Mi perfil
                  </SectionTitle>
                  <Card className="space-y-2.5 text-sm">
                    <p><span className="font-semibold text-ink">Categoría:</span> <span className="text-ink/70">{profileData.categoria}</span></p>
                    <p className="flex items-start gap-1.5 text-ink/70">
                      <MapPin size={13} className="text-gold-500 mt-0.5 shrink-0" />
                      <span>{profileData.direccion_1}{profileData.direccion_2 ? `, ${profileData.direccion_2}` : ''}</span>
                    </p>
                    <p className="text-ink/55 text-xs leading-relaxed">{profileData.descripcion}</p>
                  </Card>
                </section>
              )}

              {/* Banner */}
              {profileData && (
                <section className="space-y-3">
                  <SectionTitle>Banner del perfil</SectionTitle>
                  <div
                    className="relative h-36 rounded-2xl overflow-hidden cursor-pointer group border border-sand shadow-soft"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview || profileData.banner ? (
                      <img
                        src={bannerPreview || profileData.banner}
                        alt="banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500" />
                    )}
                    <div className="absolute inset-0 bg-ink/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus size={20} className="text-cream" />
                      <span className="text-cream text-xs font-semibold mt-1.5">Cambiar banner</span>
                    </div>
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                  {bannerMsg && (
                    <p className={`text-xs font-semibold ${bannerMsg.startsWith('✓') ? 'text-brand-700' : 'text-danger-600'}`}>{bannerMsg}</p>
                  )}
                  {bannerFile && (
                    <Button full loading={uploadingBanner} onClick={handleBannerUpload}>
                      {uploadingBanner ? 'Subiendo…' : 'Guardar banner'}
                    </Button>
                  )}
                </section>
              )}

              {/* Servicios */}
              <section className="space-y-3">
                <SectionTitle
                  action={
                    <button onClick={() => { setIsAddingService(!isAddingService); setServiceError(''); }} className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1">
                      <Plus size={13} /> Añadir
                    </button>
                  }
                >
                  Servicios
                </SectionTitle>

                <ErrorNote>{serviceError}</ErrorNote>

                {isAddingService && (
                  <Card as="form" onSubmit={handleAddService} className="space-y-3 border-brand-200 bg-brand-50/40">
                    <p className="text-sm font-semibold text-ink">Nuevo servicio</p>
                    <Input type="text" required placeholder="Nombre del servicio" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                    <Input type="text" required placeholder="Descripción del servicio" value={newServiceDesc} onChange={e => setNewServiceDesc(e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Precio ($)" type="number" required min="0.01" step="0.01" value={newServicePrice} onChange={e => setNewServicePrice(Number(e.target.value))} />
                      <Input label="Duración (min)" type="number" required min="5" max="480" value={newServiceDuration} onChange={e => setNewServiceDuration(Number(e.target.value))} />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAddingService(false); setServiceError(''); }}>Cancelar</Button>
                      <Button type="submit" size="sm">Añadir servicio</Button>
                    </div>
                  </Card>
                )}

                <Card padding="p-2">
                  {loadingServices ? (
                    <p className="text-xs text-ink/45 text-center py-6">Cargando servicios…</p>
                  ) : localServices.length === 0 ? (
                    <p className="text-xs text-ink/45 text-center py-6">Aún no tienes servicios. Añade el primero.</p>
                  ) : localServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-3 border-b border-sand last:border-b-0">
                      <div className="text-sm min-w-0 flex-1">
                        <span className={`font-semibold block truncate ${s.estado === 'inactivo' ? 'text-ink/40' : 'text-ink'}`}>{s.nombre}</span>
                        <span className="text-xs text-ink/45">{s.duracion_min} min · {fmtPrecio(s.precio)}</span>
                        {s.descripcion && <span className="text-xs text-ink/40 block truncate">{s.descripcion}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          title={s.estado === 'inactivo' ? 'Activar' : 'Desactivar'}
                          onClick={() => handleToggleStatus(s.id, s.estado || 'activo')}
                          className={`p-2 rounded-lg transition-colors ${s.estado === 'inactivo' ? 'text-ink/35 bg-sand hover:bg-cream' : 'text-brand-700 bg-brand-50 hover:bg-brand-100'}`}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          title="Eliminar"
                          onClick={() => handleDeleteService(s.id)}
                          className="p-2 text-ink/35 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </Card>
              </section>
            </div>

            {/* Columna derecha */}
            <div className="space-y-8">

              {/* Horarios */}
              <section className="space-y-3">
                <SectionTitle>Horarios de atención</SectionTitle>
                <Card padding="p-4">
                  {horarios.map((h, i) => (
                    <div key={h.dia_semana} className="flex flex-wrap items-center py-2.5 border-b border-sand last:border-b-0 text-sm gap-x-3 gap-y-2">
                      <span className={`font-semibold w-20 sm:w-24 shrink-0 text-xs ${h.activo ? 'text-ink' : 'text-ink/35'}`}>{DIAS[h.dia_semana]}</span>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" checked={h.activo} onChange={() => toggleDia(i)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-sand rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                      <div className="flex items-center gap-1.5 basis-full sm:basis-auto sm:flex-1 justify-start sm:justify-end">
                        <input type="time" disabled={!h.activo} value={h.hora_inicio} onChange={e => changeHora(i, 'hora_inicio', e.target.value)} className={`text-xs py-1.5 px-2 border border-sand rounded-lg focus:outline-none focus:border-brand-500 transition-colors ${!h.activo ? 'bg-cream text-ink/35' : 'bg-white text-ink'}`} />
                        <span className="text-ink/35">–</span>
                        <input type="time" disabled={!h.activo} value={h.hora_fin} onChange={e => changeHora(i, 'hora_fin', e.target.value)} className={`text-xs py-1.5 px-2 border border-sand rounded-lg focus:outline-none focus:border-brand-500 transition-colors ${!h.activo ? 'bg-cream text-ink/35' : 'bg-white text-ink'}`} />
                      </div>
                    </div>
                  ))}
                </Card>

                {horarioMsg && (
                  <p className={`text-xs font-semibold ${horarioMsg.startsWith('✓') ? 'text-brand-700' : 'text-danger-600'}`}>{horarioMsg}</p>
                )}

                <Button full loading={savingHorarios} onClick={handleSaveHorarios}>
                  {savingHorarios ? 'Guardando…' : 'Guardar horarios'}
                </Button>
              </section>

              {/* Configuración de agenda */}
              <section className="space-y-3">
                <SectionTitle>Configuración de agenda</SectionTitle>
                <Card className="space-y-4">
                  <Select
                    label="Intervalo entre turnos"
                    value={configAgenda.intervalo_agenda}
                    onChange={e => setConfigAgenda(prev => ({ ...prev, intervalo_agenda: Number(e.target.value) }))}
                  >
                    {[5, 10, 15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} minutos</option>)}
                  </Select>
                  <Input
                    label="Anticipación mínima para reservar (horas)"
                    type="number" min="1" max="48"
                    value={configAgenda.anticipacion_horas}
                    onChange={e => setConfigAgenda(prev => ({ ...prev, anticipacion_horas: Number(e.target.value) }))}
                  />
                  <Input
                    label="Máximo días en avance para reservar"
                    type="number" min="1" max="365"
                    value={configAgenda.max_reserva_dias}
                    onChange={e => setConfigAgenda(prev => ({ ...prev, max_reserva_dias: Number(e.target.value) }))}
                  />
                </Card>
                {configMsg && (
                  <p className={`text-xs font-semibold ${configMsg.startsWith('✓') ? 'text-brand-700' : 'text-danger-600'}`}>{configMsg}</p>
                )}
                <Button full loading={savingConfig} onClick={handleSaveConfig}>
                  {savingConfig ? 'Guardando…' : 'Guardar configuración'}
                </Button>
              </section>

              {/* Excepciones de horario */}
              <section className="space-y-3">
                <SectionTitle>Días no disponibles</SectionTitle>
                <Card as="form" onSubmit={handleAddExcepcion} className="space-y-3">
                  <Input
                    label="Fecha"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newExcFecha}
                    onChange={e => setNewExcFecha(e.target.value)}
                  />
                  <Input
                    label="Motivo" hint="opcional"
                    type="text"
                    placeholder="Vacaciones, feriado…"
                    value={newExcMotivo}
                    onChange={e => setNewExcMotivo(e.target.value)}
                  />
                  {excMsg && <p className="text-xs text-danger-600">{excMsg}</p>}
                  <Button type="submit" variant="secondary" full loading={savingExc}>
                    {savingExc ? 'Guardando…' : 'Marcar día no disponible'}
                  </Button>
                </Card>

                <div className="space-y-2">
                  {excepciones.length === 0 ? (
                    <p className="text-xs text-ink/40 text-center py-3">Sin días bloqueados.</p>
                  ) : excepciones.map(ex => (
                    <div key={ex.id} className="flex items-center justify-between bg-white border border-sand rounded-xl px-4 py-3 shadow-soft">
                      <div className="text-sm min-w-0">
                        <span className="font-semibold text-ink">{ex.fecha}</span>
                        {ex.motivo && <span className="text-ink/50 text-xs ml-2">— {ex.motivo}</span>}
                      </div>
                      <button onClick={() => handleDeleteExcepcion(ex.id)} className="p-1.5 text-ink/35 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      )}

      {/* ── TAB: ESTADÍSTICAS ── */}
      {panelTab === 'stats' && (
        <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-6 pb-16 space-y-5">
          {loadingStats && <Spinner label="Cargando estadísticas…" />}
          {!loadingStats && !stats && (
            <EmptyState icon={BarChart2} title="Sin datos todavía" description="Cuando recibas reservas, aquí verás tus métricas." />
          )}
          {!loadingStats && stats && (() => {
            const maxMes     = Math.max(...(stats.por_mes.map(m => m.cantidad)), 1);
            const maxServicio = Math.max(...(stats.top_servicios.map(s => s.cantidad)), 1);
            const maxHora    = Math.max(...(stats.horas_pico.map(h => h.cantidad)), 1);
            const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

            return (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Reservas este mes</p>
                    <p className="font-display text-3xl text-ink mt-2">{stats.reservas_mes}</p>
                  </Card>
                  <Card>
                    <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Ingresos del mes</p>
                    <p className="font-display text-3xl text-brand-700 mt-2">${Number(stats.ingresos_mes).toFixed(0)}</p>
                  </Card>
                  <Card>
                    <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Total histórico</p>
                    <p className="font-display text-3xl text-ink mt-2">{stats.total_historico}</p>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Reservas por mes */}
                  {stats.por_mes.length > 0 && (
                    <Card>
                      <h3 className="text-sm font-semibold text-ink mb-4">Reservas por mes</h3>
                      <div className="flex items-end gap-2 h-28">
                        {stats.por_mes.map(m => {
                          const [, mes] = m.mes.split('-');
                          const pct = Math.round((m.cantidad / maxMes) * 100);
                          return (
                            <div key={m.mes} className="flex-1 flex flex-col items-center gap-1.5">
                              <span className="text-[10px] text-ink/50 font-semibold">{m.cantidad}</span>
                              <div
                                className="w-full bg-brand-500 rounded-t-md transition-all"
                                style={{ height: `${Math.max(pct, 8)}%` }}
                              />
                              <span className="text-[10px] text-ink/40">{MESES[Number(mes) - 1]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Por estado */}
                  {stats.por_estado.length > 0 && (
                    <Card>
                      <h3 className="text-sm font-semibold text-ink mb-4">Reservas por estado</h3>
                      <div className="space-y-3">
                        {stats.por_estado.map(e => (
                          <div key={e.estado} className="flex items-center justify-between">
                            <EstadoBadge estado={e.estado} />
                            <span className="text-sm font-semibold text-ink">{e.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Top servicios */}
                  {stats.top_servicios.length > 0 && (
                    <Card>
                      <h3 className="text-sm font-semibold text-ink mb-4">Servicios más solicitados</h3>
                      <div className="space-y-3.5">
                        {stats.top_servicios.map((s, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-ink/70 truncate mr-2">{s.nombre}</span>
                              <span className="text-xs font-semibold text-brand-700 shrink-0">{s.cantidad}</span>
                            </div>
                            <div className="w-full bg-sand rounded-full h-1.5">
                              <div
                                className="bg-brand-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.round((s.cantidad / maxServicio) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Horas pico */}
                  {stats.horas_pico.length > 0 && (
                    <Card>
                      <h3 className="text-sm font-semibold text-ink mb-4">Horas más ocupadas</h3>
                      <div className="flex items-end gap-1.5 h-24">
                        {stats.horas_pico.map(h => {
                          const pct = Math.round((h.cantidad / maxHora) * 100);
                          const hNum = Number(h.hora);
                          const label = `${hNum % 12 || 12}${hNum >= 12 ? 'p' : 'a'}`;
                          return (
                            <div key={h.hora} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-gold-400 rounded-t-md"
                                style={{ height: `${Math.max(pct, 8)}%` }}
                              />
                              <span className="text-[9px] text-ink/40">{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              </>
            );
          })()}
        </main>
      )}
    </div>
  );
}
