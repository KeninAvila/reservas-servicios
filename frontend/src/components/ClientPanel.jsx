import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, CheckCircle2, MapPin, Clock, Calendar, Home, CalendarDays, User2 } from 'lucide-react';
import api from '../services/api';


function getDatesFromToday(count = 10) {
  const days   = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Use local date parts to avoid UTC timezone shift
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      label: days[d.getDay()],
      num:   String(d.getDate()).padStart(2, '0'),
      month: months[d.getMonth()],
      iso,
    });
  }
  return result;
}

function avatarUrl(nombre) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=6366f1&color=fff&size=128`;
}

function loadLocalBookings() {
  try { return JSON.parse(localStorage.getItem('servi_client_bookings') || '[]'); }
  catch { return []; }
}
function saveLocalBookings(list) {
  localStorage.setItem('servi_client_bookings', JSON.stringify(list));
}

export default function ClientPanel({ onOpenLogin }) {
  const [view, setView] = useState('explore');

  // Categorías
  const [categorias,     setCategorias]     = useState([]);

  // Datos del API
  const [profsList,      setProfsList]      = useState([]);
  const [loadingProfs,   setLoadingProfs]   = useState(true);
  const [profsError,     setProfsError]     = useState('');

  const [selectedProf,   setSelectedProf]   = useState(null);
  const [profServicios,  setProfServicios]  = useState([]);
  const [loadingServ,    setLoadingServ]    = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [slots,           setSlots]           = useState([]);
  const [loadingSlots,    setLoadingSlots]    = useState(false);
  const [slotsError,      setSlotsError]      = useState('');

  // Formulario de reserva
  const dateOptions = getDatesFromToday(10);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName,   setClientName]   = useState('');
  const [clientPhone,  setClientPhone]  = useState('');
  const [clientNota,   setClientNota]   = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [createdUuid,  setCreatedUuid]  = useState('');

  // Filtros explore
  const [searchQuery,  setSearchQuery]  = useState('');
  const [selectedCat,  setSelectedCat]  = useState('');

  // Mis citas locales
  const [myBookings, setMyBookings] = useState(loadLocalBookings);

  // Tracking de estado real
  const [trackingMap, setTrackingMap] = useState({});

  // ── Cargar categorías ────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/router.php?route=public/categorias')
      .then(res => { if (res.data.success) setCategorias(res.data.data); })
      .catch(() => {});
  }, []);

  // ── Cargar profesionales ─────────────────────────────────────────────────
  useEffect(() => {
    setLoadingProfs(true);
    api.get('/router.php?route=public/profesionales')
      .then(res => {
        if (res.data.success) setProfsList(res.data.data);
        else setProfsError('No se pudieron cargar los profesionales.');
      })
      .catch(() => setProfsError('Error de conexión al servidor.'))
      .finally(() => setLoadingProfs(false));
  }, []);

  // ── Cargar servicios al seleccionar profesional ───────────────────────────
  const selectProf = useCallback((prof) => {
    setSelectedProf(prof);
    setProfServicios([]);
    setLoadingServ(true);
    setView('detail');
    api.get(`/router.php?route=public/servicios&profesional_id=${prof.profesional_id}`)
      .then(res => { if (res.data.success) setProfServicios(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingServ(false));
  }, []);

  // ── Cargar slots disponibles al cambiar fecha o servicio ─────────────────
  const fetchSlots = useCallback((profId, fecha, servicioId) => {
    if (!profId || !fecha || !servicioId) return;
    setLoadingSlots(true);
    setSlotsError('');
    setSelectedTime('');
    api.get(`/router.php?route=public/disponibilidad&profesional_id=${profId}&fecha=${fecha}&servicio_id=${servicioId}`)
      .then(res => {
        if (res.data.success) {
          setSlots(res.data.data);
          if (res.data.data.length === 0) setSlotsError('No hay horarios disponibles en esta fecha.');
        } else {
          setSlotsError(res.data.message);
          setSlots([]);
        }
      })
      .catch(() => { setSlotsError('Error al consultar disponibilidad.'); setSlots([]); })
      .finally(() => setLoadingSlots(false));
  }, []);

  useEffect(() => {
    if (view === 'booking' && selectedProf && selectedService) {
      fetchSlots(selectedProf.profesional_id, selectedDate, selectedService.id);
    }
  }, [view, selectedDate, selectedProf, selectedService, fetchSlots]);

  function selectService(s) {
    setSelectedService(s);
    setSelectedTime('');
    setBookingError('');
    setView('booking');
  }

  // ── Confirmar reserva ────────────────────────────────────────────────────
  async function handleConfirmBooking(e) {
    e.preventDefault();
    setBookingError('');
    if (!selectedTime) { setBookingError('Selecciona un horario disponible.'); return; }
    if (!clientName.trim() || !clientPhone.trim()) { setBookingError('Nombre y teléfono son obligatorios.'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/router.php?route=public/reserva', {
        profesional_id:   selectedProf.profesional_id,
        servicio_id:      selectedService.id,
        cliente_nombre:   clientName.trim(),
        cliente_telefono: clientPhone.trim(),
        cliente_nota:     clientNota.trim() || null,
        fecha:            selectedDate,
        hora:             selectedTime,
      });

      if (res.data.success) {
        const uuid = res.data.data.uuid;
        setCreatedUuid(uuid);
        const record = {
          uuid,
          profesional:    selectedProf.nombre,
          servicio:       selectedService.nombre,
          precio:         selectedService.precio,
          fecha:          selectedDate,
          hora:           selectedTime,
          cliente_nombre: clientName.trim(),
          created_at:     new Date().toISOString(),
        };
        const updated = [record, ...myBookings];
        setMyBookings(updated);
        saveLocalBookings(updated);
        setClientName(''); setClientPhone(''); setClientNota('');
        setView('success');
      } else {
        setBookingError(res.data.message);
      }
    } catch {
      setBookingError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Cargar estado real de citas al abrir my-bookings ─────────────────────
  useEffect(() => {
    if (view !== 'my-bookings' || myBookings.length === 0) return;
    myBookings.forEach(b => {
      if (trackingMap[b.uuid]) return; // ya cargado
      api.get(`/router.php?route=public/tracking&uuid=${b.uuid}`)
        .then(res => {
          if (res.data.success) {
            setTrackingMap(prev => ({ ...prev, [b.uuid]: res.data.data }));
          }
        })
        .catch(() => {});
    });
  }, [view, myBookings]);

  // ── Filtro de profesionales ───────────────────────────────────────────────
  const filtered = profsList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.nombre.toLowerCase().includes(q) ||
                        p.categoria.toLowerCase().includes(q) ||
                        (p.descripcion || '').toLowerCase().includes(q);
    const matchCat = !selectedCat || p.categoria_id === selectedCat;
    return matchSearch && matchCat;
  });

  // ════════════════════════════════════════════════════════════════════════
  // VISTA: EXPLORE
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'explore') return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm tracking-tight shadow-md shadow-indigo-200">S</div>
          <span className="font-black tracking-tight text-slate-900 text-lg">SERVI</span>
        </div>
        <button
          onClick={() => setView('my-bookings')}
          className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
        >
          <CalendarDays size={12} />
          Mis Citas {myBookings.length > 0 && <span className="bg-indigo-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{myBookings.length}</span>}
        </button>
      </header>

      <div className="px-5 space-y-5 pb-24">
        <div>
          <h1 className="font-black text-slate-900 tracking-tight text-2xl leading-tight">Explorar</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Encuentra el profesional que necesitas</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text" placeholder="Buscar servicios o profesionales..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
          <button
            onClick={() => setSelectedCat('')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold shrink-0 transition-all ${!selectedCat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold shrink-0 transition-all ${selectedCat === cat.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Lista de profesionales */}
        <div className="space-y-3">
          <h2 className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Disponibles</h2>

          {loadingProfs ? (
            <div className="py-12 text-center text-xs text-slate-400">Cargando profesionales...</div>
          ) : profsError ? (
            <div className="py-10 text-center text-xs text-red-500 bg-red-50 rounded-2xl px-4">{profsError}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-slate-50 text-xs text-slate-400">
              {searchQuery || selectedCat ? 'Sin resultados para tu búsqueda.' : 'No hay profesionales disponibles aún.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(prof => (
                <div
                  key={prof.profesional_id}
                  onClick={() => selectProf(prof)}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] group"
                >
                  <img src={prof.foto_perfil || avatarUrl(prof.nombre)} alt={prof.nombre} className="w-14 h-14 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-sm truncate leading-tight">{prof.nombre_negocio || prof.nombre}</h4>
                    <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">{prof.nombre} · {prof.categoria}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1.5">
                      <MapPin size={9} className="text-indigo-400" /> {prof.direccion_1 ? `${prof.direccion_1}, ` : ''}{prof.ciudad}
                    </span>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <ArrowLeft size={12} className="text-indigo-500 rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-sm border-t border-slate-100 grid grid-cols-3 py-3 text-center">
        <button onClick={() => { setSelectedCat(''); setSearchQuery(''); }} className="flex flex-col items-center gap-1 text-indigo-600">
          <Home size={20} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => setView('my-bookings')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors">
          <CalendarDays size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold">Reservas</span>
        </button>
        <button onClick={onOpenLogin} className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors">
          <User2 size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-semibold">Profesional</span>
        </button>
      </nav>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // VISTA: DETALLE PROFESIONAL
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && selectedProf) return (
    <div className="flex-1 flex flex-col bg-white">
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => setView('explore')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-black text-slate-900 text-sm truncate">{selectedProf.nombre_negocio || selectedProf.nombre}</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        {/* Cabecera del profesional */}
        <div className="px-5 pt-6 pb-5 space-y-4">
          <div className="flex items-center gap-4">
            <img src={selectedProf.foto_perfil || avatarUrl(selectedProf.nombre)} alt={selectedProf.nombre} className="w-18 h-18 w-[72px] h-[72px] rounded-3xl object-cover shrink-0 shadow-lg shadow-indigo-100" />
            <div className="min-w-0">
              <h2 className="font-black text-slate-900 text-xl leading-tight">{selectedProf.nombre_negocio || selectedProf.nombre}</h2>
              <span className="text-xs text-slate-500 font-medium block mt-1">{selectedProf.nombre}</span>
              <span className="inline-block mt-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{selectedProf.categoria}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <MapPin size={11} className="text-indigo-400 shrink-0" />
            <span>{selectedProf.direccion_1} · {selectedProf.ciudad}</span>
          </div>
          {selectedProf.descripcion && (
            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-3">{selectedProf.descripcion}</p>
          )}
        </div>

        {/* Servicios */}
        <div className="px-5 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Servicios</h3>
          {loadingServ ? (
            <p className="text-xs text-slate-400 py-6 text-center">Cargando servicios...</p>
          ) : profServicios.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Este profesional aún no tiene servicios publicados.</p>
          ) : (
            <div className="space-y-2">
              {profServicios.map(s => (
                <div key={s.id} onClick={() => selectService(s)} className="bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all shadow-[0_1px_6px_rgba(0,0,0,0.06)] group">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-slate-800 block">{s.nombre}</span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                      <Clock size={9} className="text-indigo-400" /> {s.duracion_min} min
                    </span>
                    {s.descripcion && <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{s.descripcion}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-sm font-black text-indigo-600">${parseFloat(s.precio).toFixed(2)}</span>
                    <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <ArrowLeft size={11} className="text-indigo-500 rotate-180" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // VISTA: BOOKING
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'booking' && selectedProf && selectedService) return (
    <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col bg-white">
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button type="button" onClick={() => setView('detail')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-black text-slate-900 text-sm">Reservar cita</h1>
      </header>

      <main className="flex-1 p-5 space-y-5 overflow-y-auto pb-8">
        {/* Resumen */}
        <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
          <img src={selectedProf.foto_perfil || avatarUrl(selectedProf.nombre)} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" />
          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-xs truncate">{selectedProf.nombre_negocio || selectedProf.nombre}</h3>
            <span className="text-[10px] text-slate-500 font-medium block truncate">{selectedProf.nombre}</span>
            <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
              {selectedService.nombre} · {selectedService.duracion_min} min · ${parseFloat(selectedService.precio).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Seleccionar fecha */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Calendar size={11} /> Fecha
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
            {dateOptions.map(d => (
              <div
                key={d.iso} onClick={() => setSelectedDate(d.iso)}
                className={`px-3.5 py-3 rounded-2xl text-center flex flex-col items-center min-w-[60px] cursor-pointer transition-all ${selectedDate === d.iso ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
              >
                <span className="text-[9px] font-bold opacity-70 uppercase">{d.month}</span>
                <span className="text-lg font-black tracking-tight leading-none my-0.5">{d.num}</span>
                <span className="text-[9px] font-bold uppercase">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seleccionar hora */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Clock size={11} /> Horarios Disponibles
          </span>
          {loadingSlots ? (
            <p className="text-xs text-slate-400 py-4 text-center">Consultando disponibilidad...</p>
          ) : slotsError ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No hay horarios disponibles en esta fecha.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {slots.map(t => (
                <button
                  key={t} type="button" onClick={() => setSelectedTime(t)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all ${selectedTime === t ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Datos del cliente */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tus datos</span>
          <input type="text" required placeholder="Nombre completo" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all" />
          <input type="tel" required placeholder="Teléfono (ej: 0991234567)" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all" />
          <textarea placeholder="Nota para el profesional (opcional)" value={clientNota} onChange={e => setClientNota(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all resize-none" />
        </div>

        {bookingError && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{bookingError}</div>
        )}

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl text-xs font-medium text-slate-500">
          <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm">$</span>
          <span>Pago en efectivo al finalizar el servicio</span>
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all">
          {submitting ? 'Enviando reserva...' : 'Confirmar Reserva'}
        </button>
      </main>
    </form>
  );

  // ════════════════════════════════════════════════════════════════════════
  // VISTA: SUCCESS
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'success') {
    const telefono = (selectedProf?.telefono ?? '').replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Hola ${selectedProf?.nombre ?? 'profesional'}, acabo de enviar una solicitud de reserva.\n` +
      `Servicio: ${selectedService?.nombre ?? ''}\n` +
      `Fecha: ${selectedDate}  Hora: ${selectedTime}\n` +
      `UUID de seguimiento: ${createdUuid}\n` +
      `Por favor, revisa y acepta mi solicitud. ¡Gracias!`
    );
    function handleNotificar() {
      if (telefono) window.open(`https://wa.me/${telefono}?text=${waText}`, '_blank');
      setView('my-bookings');
    }
    return (
      <div className="flex-1 flex flex-col bg-white p-6 justify-center items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-100">
          <CheckCircle2 size={48} className="stroke-[1.5]" />
        </div>
        <div className="space-y-1">
          <h2 className="font-black text-slate-900 text-2xl tracking-tight">¡Solicitud enviada!</h2>
          <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">{createdUuid}</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
          Tu solicitud está <strong className="text-slate-700">pendiente</strong>. Notifica al profesional para que acepte tu solicitud.
        </p>
        <div className="w-full pt-2">
          <button
            onClick={handleNotificar}
            className="w-full bg-[#25D366] hover:bg-[#1ebe5b] active:bg-[#18a84f] text-white font-bold py-4 px-4 rounded-2xl text-sm transition-colors shadow-lg"
          >
            Notificar al profesional
            <span className="block text-[11px] font-normal opacity-80 mt-0.5">(obligatorio para la aceptación de tu reserva)</span>
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISTA: MIS RESERVAS
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'my-bookings') return (
    <div className="flex-1 flex flex-col bg-white">
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => setView('explore')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-black text-slate-900 text-sm">Mis Solicitudes</h1>
      </header>
      <main className="flex-1 p-4 space-y-3 overflow-y-auto pb-8">
        {myBookings.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
              <CalendarDays size={32} className="text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Aún no tienes solicitudes de cita.</p>
            <button onClick={() => setView('explore')} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">Explorar profesionales →</button>
          </div>
        ) : myBookings.map(b => {
          const tracking = trackingMap[b.uuid];
          const estado   = tracking?.estado || 'PENDIENTE';
          const badgeCls = estado === 'ACEPTADA'   ? 'bg-indigo-100 text-indigo-700'
                         : estado === 'RECHAZADA'  ? 'bg-red-100 text-red-600'
                         : estado === 'FINALIZADA' ? 'bg-slate-100 text-slate-600'
                         : 'bg-amber-100 text-amber-700';
          const badgeLabel = estado === 'ACEPTADA'   ? '✓ Aceptada'
                           : estado === 'RECHAZADA'  ? '✗ Rechazada'
                           : estado === 'FINALIZADA' ? 'Finalizada'
                           : 'Pendiente';
          return (
            <div key={b.uuid} className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-sm truncate">{b.servicio}</h3>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{b.profesional}</span>
                </div>
                <span className="text-sm font-black text-indigo-600 shrink-0">${parseFloat(b.precio).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <CalendarDays size={10} className="text-indigo-400 shrink-0" />
                <span>{b.fecha} · {b.hora}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${badgeCls}`}>{badgeLabel}</span>
                <p className="font-mono text-slate-200 text-[9px]">{b.uuid}</p>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );

  return null;
}
