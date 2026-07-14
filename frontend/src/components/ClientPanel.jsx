import { useState, useEffect } from 'react';
import { Search, ChevronRight, MapPin, Home, CalendarDays, User2, LayoutGrid, Scissors, Sparkles, Waves, Wrench, Tag } from 'lucide-react';
import api from '../services/api';
import ProfessionalView from './ProfessionalView';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { EstadoBadge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { ErrorNote } from './ui/Field';
import { avatarUrl, fmtPrecio } from '../lib/format';

const CATEGORY_ICONS = {
  'barberia':          Scissors,
  'salon de belleza':  Sparkles,
  'masajes':           Waves,
  'reparacion tecnica': Wrench,
};
function getCategoryIcon(nombre) {
  return CATEGORY_ICONS[nombre?.toLowerCase()] ?? Tag;
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
    const matchCat = !selectedCat || p.categoria_id == selectedCat;
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
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="glass border-b border-ink/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo onClick={() => setView('explore')} />
          <button
            onClick={() => setView('explore')}
            className="text-xs font-semibold text-ink/55 hover:text-brand-700 transition-colors"
          >
            ← Explorar
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-5 py-8 pb-20">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight">Mis reservas</h1>
          <span className="text-xs text-ink/40 font-medium">{myBookings.length} {myBookings.length === 1 ? 'cita' : 'citas'}</span>
        </div>

        {myBookings.length === 0 ? (
          <div className="mt-10 bg-white rounded-2xl border border-sand py-16 px-6 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
              <CalendarDays size={22} className="text-brand-600" strokeWidth={1.75} />
            </div>
            <p className="font-display font-semibold text-lg text-ink mt-5">Aún no tienes reservas</p>
            <p className="text-sm text-ink/50 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Cuando agendes una cita con un profesional, aparecerá aquí.
            </p>
            <Button className="mt-6" onClick={() => setView('explore')}>Explorar profesionales</Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {myBookings.map((b, i) => {
              const tracking = trackingMap[b.uuid];
              const estado   = tracking?.estado || 'PENDIENTE';
              return (
                <button
                  key={b.uuid}
                  onClick={() => { window.location.hash = `#/cita/${b.uuid}`; }}
                  className="w-full text-left bg-white rounded-2xl border border-sand p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-card hover:border-brand-300 animate-fadeIn"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-display font-semibold text-base text-ink truncate">{b.servicio}</h3>
                      <EstadoBadge estado={estado} />
                    </div>
                    <p className="text-xs text-ink/50 mt-1">{b.profesional}</p>
                    <p className="text-sm text-ink/70 mt-2 font-medium">
                      {b.fecha} · {b.hora} · <span className="text-brand-700">{fmtPrecio(b.precio)}</span>
                    </p>
                  </div>
                  <ChevronRight size={17} className="text-ink/25 shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );

  // ── Explore (default) ──────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen">

      {/* Barra superior glass */}
      <header className="glass border-b border-ink/5 sticky top-0 z-40">
        <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo onClick={() => { setSelectedCat(''); setSearchQuery(''); }} />
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setView('my-bookings')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-ink/70 bg-white border border-sand hover:border-brand-400 hover:text-brand-700 px-4 py-2 rounded-full transition-all duration-200"
            >
              <CalendarDays size={13} />
              Reservas
              {myBookings.length > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
                  {myBookings.length}
                </span>
              )}
            </button>
            <button
              onClick={onOpenLogin}
              className="hidden md:inline-flex text-xs font-semibold text-white bg-ink hover:bg-brand-950 px-4 py-2 rounded-full transition-colors duration-200"
            >
              Soy profesional
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl 2xl:max-w-7xl mx-auto px-5 pb-28 md:pb-20">

        {/* Título + búsqueda */}
        <section className="pt-10 md:pt-14">
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink tracking-tight">Explorar</h1>

          <div className="relative mt-6 max-w-xl">
            <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink/35 pointer-events-none" />
            <input
              type="text" placeholder="Buscar servicios o profesionales…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white border border-sand rounded-full text-sm shadow-soft placeholder:text-ink/35 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 transition-all duration-200"
            />
          </div>
        </section>

        {/* Categorías */}
        <section className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
          <button
            onClick={() => setSelectedCat('')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 border transition-all duration-200 ${
              !selectedCat
                ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                : 'bg-white text-ink/60 border-sand hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            <LayoutGrid size={13} />
            Todos
          </button>
          {categorias.map(cat => {
            const Icon = getCategoryIcon(cat.nombre);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 border transition-all duration-200 ${
                  selectedCat === cat.id
                    ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                    : 'bg-white text-ink/60 border-sand hover:border-brand-400 hover:text-brand-700'
                }`}
              >
                <Icon size={13} />
                {cat.nombre}
              </button>
            );
          })}
        </section>

        {/* Profesionales */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="caption text-ink/45">Profesionales</h2>
            {!loadingProfs && !profsError && (
              <span className="text-xs text-ink/40 font-medium">
                {filtered.length} {filtered.length === 1 ? 'disponible' : 'disponibles'}
              </span>
            )}
          </div>

          {loadingProfs ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-sand overflow-hidden">
                  <Skeleton className="w-full aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-2.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : profsError ? (
            <ErrorNote>{profsError}</ErrorNote>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sand py-16 px-6 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto">
                <Search size={20} className="text-ink/35" strokeWidth={1.75} />
              </div>
              <p className="font-display font-semibold text-lg text-ink mt-5">
                {searchQuery || selectedCat ? 'Sin resultados' : 'Aún no hay profesionales'}
              </p>
              <p className="text-sm text-ink/50 mt-1.5 max-w-xs mx-auto leading-relaxed">
                {searchQuery || selectedCat
                  ? 'Prueba con otra búsqueda o quita los filtros.'
                  : 'Nuevos especialistas se unen cada semana.'}
              </p>
              {(searchQuery || selectedCat) && (
                <Button variant="secondary" size="sm" className="mt-6" onClick={() => { setSearchQuery(''); setSelectedCat(''); }}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((prof, i) => (
                <button
                  key={prof.profesional_id}
                  onClick={() => { setSelProfId(prof.profesional_id); setView('prof-view'); }}
                  className="text-left bg-white rounded-2xl border border-sand overflow-hidden group transition-all duration-300 hover:shadow-card hover:border-brand-300 hover:-translate-y-0.5 animate-fadeIn"
                  style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-cream">
                    <img
                      src={prof.foto_perfil || avatarUrl(prof.nombre)}
                      alt={prof.nombre}
                      onError={e => { e.target.src = avatarUrl(prof.nombre); }}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-semibold text-base text-ink truncate">
                        {prof.nombre_negocio || prof.nombre}
                      </h3>
                      <span className="shrink-0 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                        {prof.categoria}
                      </span>
                    </div>
                    <p className="text-xs text-ink/50 mt-1.5 flex items-center gap-1.5 min-w-0">
                      <MapPin size={11} className="text-ink/35 shrink-0" />
                      <span className="truncate">{prof.direccion_1 ? `${prof.direccion_1} · ` : ''}{prof.ciudad}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom nav — solo móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-ink/5 grid grid-cols-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40">
        <button onClick={() => { setSelectedCat(''); setSearchQuery(''); }} className="flex flex-col items-center gap-1 py-1 text-brand-700">
          <Home size={20} strokeWidth={2.25} />
          <span className="text-[10px] font-semibold">Inicio</span>
        </button>
        <button onClick={() => setView('my-bookings')} className="flex flex-col items-center gap-1 py-1 text-ink/40 hover:text-brand-700 transition-colors">
          <CalendarDays size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Reservas</span>
        </button>
        <button onClick={onOpenLogin} className="flex flex-col items-center gap-1 py-1 text-ink/40 hover:text-brand-700 transition-colors">
          <User2 size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Profesional</span>
        </button>
      </nav>
    </div>
  );
}
