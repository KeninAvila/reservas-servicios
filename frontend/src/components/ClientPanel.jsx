import { useState, useEffect } from 'react';
import { Search, ArrowLeft, MapPin, Home, CalendarDays, User2, LayoutGrid, Scissors, Sparkles, Waves, Wrench, Tag } from 'lucide-react';

const CATEGORY_ICONS = {
  'barberia':          Scissors,
  'salon de belleza':  Sparkles,
  'masajes':           Waves,
  'reparacion tecnica': Wrench,
};
function getCategoryIcon(nombre) {
  return CATEGORY_ICONS[nombre?.toLowerCase()] ?? Tag;
}
import api from '../services/api';
import ProfessionalView from './ProfessionalView';

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

export default function ClientPanel({ onOpenLogin, initialProfId = null }) {
  const [view,         setView]         = useState(initialProfId ? 'prof-view' : 'explore');
  const [categorias,   setCategorias]   = useState([]);
  const [profsList,    setProfsList]    = useState([]);
  const [loadingProfs, setLoadingProfs] = useState(true);
  const [profsError,   setProfsError]   = useState('');
  const [selProfId,    setSelProfId]    = useState(initialProfId);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [selectedCat,  setSelectedCat]  = useState('');
  const [myBookings,   setMyBookings]   = useState(loadLocalBookings);
  const [trackingMap,  setTrackingMap]  = useState({});

  useEffect(() => {
    api.get('/router.php?route=public/categorias')
      .then(res => { if (res.data.success) setCategorias(res.data.data); })
      .catch(() => {});
  }, []);

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

  // Load real booking statuses when opening my-bookings
  useEffect(() => {
    if (view !== 'my-bookings' || myBookings.length === 0) return;
    myBookings.forEach(b => {
      if (trackingMap[b.uuid]) return;
      api.get(`/router.php?route=public/tracking&uuid=${b.uuid}`)
        .then(res => {
          if (res.data.success)
            setTrackingMap(prev => ({ ...prev, [b.uuid]: res.data.data }));
        })
        .catch(() => {});
    });
  }, [view, myBookings]);

  function handleBookingSuccess(uuid, record) {
    const updated = [record, ...myBookings];
    setMyBookings(updated);
    saveLocalBookings(updated);
  }

  const filtered = profsList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.nombre.toLowerCase().includes(q) ||
                        p.categoria.toLowerCase().includes(q) ||
                        (p.descripcion || '').toLowerCase().includes(q);
    const matchCat = !selectedCat || p.categoria_id === selectedCat;
    return matchSearch && matchCat;
  });

  // ── Professional detail + booking (delegated) ──────────────────────────
  if (view === 'prof-view' && selProfId) {
    return (
      <ProfessionalView
        profesionalId={selProfId}
        variant="embedded"
        onBack={() => setView('explore')}
        onBookingSuccess={handleBookingSuccess}
      />
    );
  }

  // ── My bookings ────────────────────────────────────────────────────────
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
          const tracking  = trackingMap[b.uuid];
          const estado    = tracking?.estado || 'PENDIENTE';
          const badgeCls  = estado === 'ACEPTADA'   ? 'bg-indigo-100 text-indigo-700'
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
                <button
                  onClick={() => { window.location.hash = `#/cita/${b.uuid}`; }}
                  className="text-[10px] text-indigo-500 font-semibold hover:underline"
                >
                  Ver detalles →
                </button>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );

  // ── Explore (default) ──────────────────────────────────────────────────
  return (
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
          Mis Citas {myBookings.length > 0 && (
            <span className="bg-indigo-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {myBookings.length}
            </span>
          )}
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

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
          <button
            onClick={() => setSelectedCat('')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold shrink-0 transition-all ${!selectedCat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
          >
            <LayoutGrid size={12} />
            Todos
          </button>
          {categorias.map(cat => {
            const Icon = getCategoryIcon(cat.nombre);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold shrink-0 transition-all ${selectedCat === cat.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
              >
                <Icon size={12} />
                {cat.nombre}
              </button>
            );
          })}
        </div>

        {/* Professionals list */}
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
                  onClick={() => { setSelProfId(prof.profesional_id); setView('prof-view'); }}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)] group"
                >
                  <img
                    src={prof.foto_perfil || avatarUrl(prof.nombre)}
                    alt={prof.nombre}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-sm truncate leading-tight">{prof.nombre_negocio || prof.nombre}</h4>
                    <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">{prof.nombre} · {prof.categoria}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1.5">
                      <MapPin size={9} className="text-indigo-400" />
                      {prof.direccion_1 ? `${prof.direccion_1}, ` : ''}{prof.ciudad}
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
}
