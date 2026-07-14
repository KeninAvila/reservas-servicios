import { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, Clock, Search, Eye, AlertOctagon,
  Plus, Trash2, Tag, LogOut, Inbox, LayoutDashboard, ClipboardList,
} from 'lucide-react';
import api from '../services/api';
import Logo from './ui/Logo';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Badge, { EstadoBadge } from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { SkeletonCard } from './ui/Skeleton';
import { Input, ErrorNote } from './ui/Field';
import { fmtPrecio } from '../lib/format';

function estadoUsuarioTone(status) {
  const s = (status || '').toUpperCase();
  return s === 'ACTIVO' ? 'success' : s === 'SUSPENDIDO' ? 'danger' : 'warning';
}

export default function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('inicio');

  // ── Stats ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ total_profesionales: 0, total_reservas: 0, reservas_pendientes: 0 });

  // ── Profesionales ────────────────────────────────────────────────────────
  const [profesionales,  setProfesionales]  = useState([]);
  const [loadingProfs,   setLoadingProfs]   = useState(false);
  const [profSearch,     setProfSearch]     = useState('');
  const [profFilter,     setProfFilter]     = useState('');
  const [viewingProf,    setViewingProf]    = useState(null);
  const [profMsg,        setProfMsg]        = useState('');

  // ── Reservas admin ───────────────────────────────────────────────────────
  const [reservas,       setReservas]       = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);
  const [reservaFilter,  setReservaFilter]  = useState('');

  // ── Categorías ───────────────────────────────────────────────────────────
  const [categorias,     setCategorias]     = useState([]);
  const [loadingCats,    setLoadingCats]    = useState(false);
  const [catNombre,      setCatNombre]      = useState('');
  const [catDesc,        setCatDesc]        = useState('');
  const [catError,       setCatError]       = useState('');
  const [catMsg,         setCatMsg]         = useState('');
  const [addingCat,      setAddingCat]      = useState(false);

  // ── Cargar stats (siempre al montar) ─────────────────────────────────────
  useEffect(() => {
    api.get('/router.php?route=admin/stats')
      .then(res => { if (res.data.success) setStats(res.data.data); })
      .catch(() => {});
  }, []);

  // ── Cargar profesionales ──────────────────────────────────────────────────
  const fetchProfesionales = useCallback((estado = '') => {
    setLoadingProfs(true);
    const qs = estado ? `&estado=${estado}` : '';
    api.get(`/router.php?route=admin/profesionales${qs}`)
      .then(res => { if (res.data.success) setProfesionales(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingProfs(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'profesionales') fetchProfesionales(profFilter);
  }, [activeTab, profFilter, fetchProfesionales]);

  // ── Cargar reservas ───────────────────────────────────────────────────────
  const fetchReservas = useCallback((estado = '') => {
    setLoadingReservas(true);
    const qs = estado ? `&estado=${estado}` : '';
    api.get(`/router.php?route=admin/reservas${qs}`)
      .then(res => { if (res.data.success) setReservas(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingReservas(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'reservas') fetchReservas(reservaFilter);
  }, [activeTab, reservaFilter, fetchReservas]);

  // ── Cargar categorías ─────────────────────────────────────────────────────
  const fetchCategorias = useCallback(() => {
    setLoadingCats(true);
    api.get('/router.php?route=admin/categorias')
      .then(res => { if (res.data.success) setCategorias(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'categorias') fetchCategorias();
  }, [activeTab, fetchCategorias]);

  async function handleCreateCat(e) {
    e.preventDefault();
    setCatError('');
    try {
      const res = await api.post('/router.php?route=admin/categorias', { nombre: catNombre, descripcion: catDesc });
      if (res.data.success) {
        setCatNombre(''); setCatDesc(''); setAddingCat(false);
        fetchCategorias();
      } else {
        setCatError(res.data.message);
      }
    } catch { setCatError('Error de conexión.'); }
  }

  async function handleDeleteCat(id) {
    setCatMsg('');
    try {
      const res = await api.delete('/router.php?route=admin/categorias/delete', { data: { id } });
      if (res.data.success) {
        fetchCategorias();
      } else {
        setCatMsg(res.data.message);
      }
    } catch { setCatMsg('Error de conexión.'); }
  }

  // ── Cambiar estado de profesional ────────────────────────────────────────
  async function handleChangeStatus(userId, estado) {
    setProfMsg('');
    try {
      const res = await api.patch('/router.php?route=admin/user/status', { user_id: userId, estado });
      if (res.data.success) {
        setProfesionales(prev => prev.map(p => p.id === userId ? { ...p, estado } : p));
        setStats(prev => ({ ...prev })); // trigger re-render
        if (viewingProf?.id === userId) setViewingProf(prev => ({ ...prev, estado }));
      } else {
        setProfMsg(res.data.message);
      }
    } catch { setProfMsg('Error de conexión.'); }
  }

  const filteredProfs = profesionales.filter(p => {
    const q = profSearch.toLowerCase();
    return (p.nombre || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const TABS = [
    ['inicio',        'Inicio',        LayoutDashboard],
    ['profesionales', 'Profesionales', Users],
    ['reservas',      'Reservas',      ClipboardList],
    ['categorias',    'Categorías',    Tag],
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-cream/90 backdrop-blur-md border-b border-sand sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[10px] font-semibold text-gold-700 bg-gold-100 border border-gold-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 bg-white border border-sand hover:border-danger-200 hover:bg-danger-50 px-3.5 py-2 rounded-full transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="max-w-5xl mx-auto w-full px-5 mt-6">
        <div className="flex bg-white border border-sand p-1 rounded-xl gap-1 text-xs font-semibold shadow-soft max-w-xl">
          {TABS.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
                activeTab === key ? 'bg-brand-600 text-cream shadow-soft' : 'text-ink/45 hover:text-ink/70'
              }`}
            >
              <Icon size={13} className="shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-6 pb-16">

        {/* ── INICIO ── */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Reservas</p>
                  <span className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Calendar size={14} className="text-brand-600" />
                  </span>
                </div>
                <p className="font-display text-3xl text-ink mt-2">{stats.total_reservas}</p>
                <p className="text-xs text-ink/45 mt-1">Registradas en total</p>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Profesionales</p>
                  <span className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Users size={14} className="text-brand-600" />
                  </span>
                </div>
                <p className="font-display text-3xl text-ink mt-2">{stats.total_profesionales}</p>
                <p className="text-xs text-ink/45 mt-1">En el sistema</p>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-[0.14em]">Pendientes</p>
                  <span className="w-8 h-8 rounded-xl bg-gold-100 flex items-center justify-center">
                    <Clock size={14} className="text-gold-600" />
                  </span>
                </div>
                <p className="font-display text-3xl text-gold-600 mt-2">{stats.reservas_pendientes}</p>
                <p className="text-xs text-ink/45 mt-1">Por atender</p>
              </Card>
            </div>

            <Card>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display text-base text-ink">Resumen</h4>
                <Badge tone="brand" dot={false}>En tiempo real</Badge>
              </div>
              <div className="text-sm text-ink/60">
                <div className="flex justify-between py-3 border-b border-sand">
                  <span>Total profesionales registrados</span>
                  <span className="font-semibold text-ink">{stats.total_profesionales}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-sand">
                  <span>Total reservas en el sistema</span>
                  <span className="font-semibold text-ink">{stats.total_reservas}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span>Reservas pendientes de atender</span>
                  <span className="font-semibold text-gold-600">{stats.reservas_pendientes}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── PROFESIONALES ── */}
        {activeTab === 'profesionales' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[['', 'Todos'], ['ACTIVO', 'Activos'], ['SUSPENDIDO', 'Suspendidos']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setProfFilter(val)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    profFilter === val
                      ? 'bg-brand-600 text-cream border-brand-600 shadow-soft'
                      : 'bg-white text-ink/55 border-sand hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Input
              type="text" placeholder="Buscar profesionales…" icon={Search}
              value={profSearch} onChange={e => setProfSearch(e.target.value)}
            />

            <ErrorNote>{profMsg}</ErrorNote>

            {loadingProfs ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredProfs.length === 0 ? (
              <EmptyState icon={Users} title="No se encontraron profesionales" description="Prueba con otro filtro o búsqueda." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredProfs.map(prof => (
                  <Card key={prof.id} padding="p-4" className="flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={prof.nombre} size="md" className="rounded-full" />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-ink text-sm truncate leading-snug">{prof.nombre}</h4>
                        <span className="text-xs text-ink/45 truncate block">{prof.email}</span>
                        {prof.categoria && <span className="text-xs text-ink/45 block">{prof.categoria}</span>}
                        <Badge tone={estadoUsuarioTone(prof.estado)} className="mt-1.5">{prof.estado}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        title="Ver detalles"
                        onClick={() => setViewingProf(prof)}
                        className="p-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title={prof.estado === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                        onClick={() => handleChangeStatus(prof.id, prof.estado === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO')}
                        className={`p-2 rounded-lg transition-colors ${
                          prof.estado === 'SUSPENDIDO'
                            ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                            : 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                        }`}
                      >
                        <AlertOctagon size={15} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESERVAS ── */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[['', 'Todas'], ['PENDIENTE', 'Pendientes'], ['ACEPTADA', 'Confirmadas'], ['FINALIZADA', 'Finalizadas']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setReservaFilter(val)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    reservaFilter === val
                      ? 'bg-brand-600 text-cream border-brand-600 shadow-soft'
                      : 'bg-white text-ink/55 border-sand hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loadingReservas ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : reservas.length === 0 ? (
              <EmptyState icon={Inbox} title="No hay reservas" description="Las reservas del sistema aparecerán aquí." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {reservas.map(r => (
                  <Card key={r.id} padding="p-4" className="space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-ink/30 block truncate">{r.uuid}</span>
                        <h4 className="font-semibold text-ink text-sm mt-0.5 truncate">{r.servicio_nombre}</h4>
                      </div>
                      <EstadoBadge estado={r.estado} className="shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-cream p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] text-ink/40 font-semibold uppercase tracking-wider block">Profesional</span>
                        <span className="text-ink/70">{r.profesional_nombre}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-ink/40 font-semibold uppercase tracking-wider block">Precio</span>
                        <span className="font-semibold text-ink">{fmtPrecio(r.precio)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-ink/40 font-semibold uppercase tracking-wider block">Cliente</span>
                        <span className="text-ink/70">{r.cliente_nombre}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-ink/40 font-semibold uppercase tracking-wider block">Teléfono</span>
                        <span className="text-ink/70">{r.cliente_telefono}</span>
                      </div>
                    </div>
                    <p className="text-xs text-ink/50 flex items-center gap-1.5">
                      <Calendar size={12} className="text-brand-500" />
                      {r.fecha} · {r.hora?.slice(0, 5)} · {r.duracion_min} min
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CATEGORÍAS ── */}
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">Categorías</h3>
              <Button size="sm" variant="secondary" onClick={() => { setAddingCat(!addingCat); setCatError(''); }}>
                <Plus size={13} /> Nueva categoría
              </Button>
            </div>

            {addingCat && (
              <Card as="form" onSubmit={handleCreateCat} className="space-y-3 border-brand-200 bg-brand-50/40">
                <p className="text-sm font-semibold text-ink">Nueva categoría</p>
                <Input
                  type="text" required maxLength={100}
                  placeholder="Nombre *"
                  value={catNombre} onChange={e => setCatNombre(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={catDesc} onChange={e => setCatDesc(e.target.value)}
                />
                {catError && <p className="text-xs text-danger-600">{catError}</p>}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingCat(false); setCatError(''); }}>Cancelar</Button>
                  <Button type="submit" size="sm">Crear categoría</Button>
                </div>
              </Card>
            )}

            <ErrorNote>{catMsg}</ErrorNote>

            {loadingCats ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : categorias.length === 0 ? (
              <EmptyState icon={Tag} title="No hay categorías" description="Crea la primera categoría para clasificar a los profesionales." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {categorias.map(cat => (
                  <Card key={cat.id} padding="p-4" className="flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                        <Tag size={14} className="text-brand-600" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-ink block truncate">{cat.nombre}</span>
                        {cat.descripcion && <span className="text-xs text-ink/45 block truncate">{cat.descripcion}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-ink/45">{cat.total_profesionales} prof.</span>
                      <button
                        onClick={() => handleDeleteCat(cat.id)}
                        title={cat.total_profesionales > 0 ? 'Tiene profesionales asignados' : 'Eliminar'}
                        className={`p-2 rounded-lg transition-colors ${
                          cat.total_profesionales > 0
                            ? 'text-ink/20 cursor-not-allowed'
                            : 'text-ink/35 hover:text-danger-600 hover:bg-danger-50'
                        }`}
                        disabled={cat.total_profesionales > 0}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal detalle profesional */}
      {viewingProf && (
        <Modal onClose={() => setViewingProf(null)} title="Detalle del profesional">
          <div className="flex items-center gap-4">
            <Avatar name={viewingProf.nombre} size="lg" className="rounded-full" />
            <div className="min-w-0">
              <h4 className="font-display text-lg text-ink truncate">{viewingProf.nombre}</h4>
              <Badge tone={estadoUsuarioTone(viewingProf.estado)} className="mt-1">{viewingProf.estado}</Badge>
            </div>
          </div>
          <div className="text-sm space-y-2.5 border-t border-sand pt-4 mt-5 text-ink/70">
            <p><span className="font-semibold text-ink">Email:</span> {viewingProf.email}</p>
            {viewingProf.categoria && <p><span className="font-semibold text-ink">Categoría:</span> {viewingProf.categoria}</p>}
            {viewingProf.descripcion && <p className="text-ink/55 leading-relaxed">{viewingProf.descripcion}</p>}
          </div>
          <div className="flex gap-2 mt-6">
            <Button
              variant={viewingProf.estado === 'SUSPENDIDO' ? 'primary' : 'danger'}
              className="flex-1"
              onClick={() => handleChangeStatus(viewingProf.id, viewingProf.estado === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO')}
            >
              {viewingProf.estado === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setViewingProf(null)}>
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
