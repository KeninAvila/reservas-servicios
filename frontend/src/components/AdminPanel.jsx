import { useState, useEffect, useCallback } from 'react';
import {
  Users, Calendar, Clock, TrendingUp, Search,
  Eye, AlertOctagon, X, Plus, Trash2, Tag,
} from 'lucide-react';
import api from '../services/api';

function statusClass(status) {
  const s = (status || '').toUpperCase();
  return s === 'ACTIVO'     ? 'bg-emerald-100 text-emerald-800'
    : s === 'SUSPENDIDO' ? 'bg-red-100 text-red-800'
    : 'bg-amber-100 text-amber-800';
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=6366f1&color=fff&size=128`;
}

const ESTADO_BADGE = {
  PENDIENTE:  { cls: 'bg-amber-100 text-amber-800' },
  ACEPTADA:   { cls: 'bg-emerald-100 text-emerald-800' },
  RECHAZADA:  { cls: 'bg-red-100 text-red-800' },
  FINALIZADA: { cls: 'bg-slate-100 text-slate-600' },
};

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

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-200">AD</div>
          <h1 className="font-black text-slate-900 tracking-tight text-sm">Administración</h1>
        </div>
        <button onClick={onLogout} className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">
          Salir
        </button>
      </header>

      {/* Nav tabs */}
      <div className="flex bg-slate-100 p-1 mx-4 mt-4 rounded-xl gap-0.5 text-[11px] font-bold">
        {[['inicio','Inicio'],['profesionales','Profes.'],['reservas','Reservas'],['categorias','Categ.']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 py-2 text-center rounded-lg transition-all ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 overflow-y-auto pb-8">

        {/* ── INICIO ── */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-indigo-600 text-white rounded-xl p-3 shadow-md shadow-indigo-200 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-200">Reservas</span>
                  <Calendar size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{stats.total_reservas}</h3>
                <span className="text-[9px] text-indigo-200 mt-1 block">Registradas</span>
              </div>
              <div className="bg-violet-600 text-white rounded-xl p-3 shadow-md shadow-violet-200 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-violet-200">Profesionales</span>
                  <Users size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{stats.total_profesionales}</h3>
                <span className="text-[9px] text-violet-200 mt-1 block">En sistema</span>
              </div>
              <div className="bg-amber-500 text-white rounded-xl p-3 shadow-md flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-amber-100">Pendientes</span>
                  <Clock size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{stats.reservas_pendientes}</h3>
                <span className="text-[9px] text-amber-100 mt-1 block">Por atender</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-800 text-sm">Resumen</h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <TrendingUp size={10} /> En tiempo real
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span>Total profesionales registrados</span>
                  <span className="font-bold text-slate-900">{stats.total_profesionales}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span>Total reservas en el sistema</span>
                  <span className="font-bold text-slate-900">{stats.total_reservas}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Reservas pendientes de atender</span>
                  <span className="font-bold text-amber-600">{stats.reservas_pendientes}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFESIONALES ── */}
        {activeTab === 'profesionales' && (
          <div className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5 text-xs text-slate-600 font-semibold">
              {[['', 'Todos'], ['ACTIVO', 'Activos'], ['SUSPENDIDO', 'Suspendidos']].map(([val, label]) => (
                <button key={val} onClick={() => setProfFilter(val)} className={`flex-1 py-1.5 text-center rounded-md transition-all ${profFilter === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Buscar profesionales..." value={profSearch} onChange={e => setProfSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none transition-all" />
            </div>

            {profMsg && <p className="text-xs text-red-600 font-medium">{profMsg}</p>}

            <div className="space-y-3">
              {loadingProfs ? (
                <p className="text-center text-xs text-slate-400 py-8">Cargando...</p>
              ) : filteredProfs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No se encontraron profesionales.</p>
              ) : filteredProfs.map(prof => (
                <div key={prof.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={avatarUrl(prof.nombre)} alt={prof.nombre} className="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-100" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{prof.nombre}</h4>
                      <span className="text-[10px] text-slate-400 truncate block">{prof.email}</span>
                      {prof.categoria && <span className="text-[10px] text-slate-400 block">{prof.categoria}</span>}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${statusClass(prof.estado)}`}>
                        {prof.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button title="Ver detalles" onClick={() => setViewingProf(prof)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                      <Eye size={14} />
                    </button>
                    <button
                      title={prof.estado === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                      onClick={() => handleChangeStatus(prof.id, prof.estado === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO')}
                      className={`p-1.5 rounded-lg transition-colors ${prof.estado === 'SUSPENDIDO' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                      <AlertOctagon size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESERVAS ── */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5 text-xs font-semibold">
              {[['', 'Todas'], ['PENDIENTE', 'Pendientes'], ['ACEPTADA', 'Aceptadas'], ['FINALIZADA', 'Finalizadas']].map(([val, label]) => (
                <button key={val} onClick={() => setReservaFilter(val)} className={`flex-1 py-1.5 text-center rounded-md transition-all ${reservaFilter === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  {label}
                </button>
              ))}
            </div>

            {loadingReservas ? (
              <p className="text-center text-xs text-slate-400 py-8">Cargando...</p>
            ) : reservas.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No hay reservas.</p>
            ) : (
              <div className="space-y-3">
                {reservas.map(r => {
                  const badge = ESTADO_BADGE[r.estado] || { cls: 'bg-slate-100 text-slate-600' };
                  return (
                    <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{r.uuid}</span>
                          <h4 className="font-bold text-slate-800 mt-0.5">{r.servicio_nombre}</h4>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{r.estado}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <div><span className="text-[9px] text-slate-400 block">PROFESIONAL</span><span className="font-medium">{r.profesional_nombre}</span></div>
                        <div><span className="text-[9px] text-slate-400 block">PRECIO</span><span className="font-bold text-slate-800">${parseFloat(r.precio).toFixed(2)}</span></div>
                        <div><span className="text-[9px] text-slate-400 block">CLIENTE</span><span className="font-medium">{r.cliente_nombre}</span></div>
                        <div><span className="text-[9px] text-slate-400 block">TELÉFONO</span><span className="font-medium">{r.cliente_telefono}</span></div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">📅 {r.fecha} · {r.hora?.slice(0, 5)} · {r.duracion_min} min</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ── CATEGORÍAS ── */}
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">Categorías</h3>
              <button
                onClick={() => { setAddingCat(!addingCat); setCatError(''); }}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <Plus size={13} /> Nueva
              </button>
            </div>

            {addingCat && (
              <form onSubmit={handleCreateCat} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-indigo-700 block">Nueva categoría</span>
                <input
                  type="text" required maxLength={100}
                  placeholder="Nombre *"
                  value={catNombre} onChange={e => setCatNombre(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={catDesc} onChange={e => setCatDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
                {catError && <p className="text-xs text-red-600">{catError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setAddingCat(false); setCatError(''); }} className="flex-1 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">Crear</button>
                </div>
              </form>
            )}

            {catMsg && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{catMsg}</div>
            )}

            {loadingCats ? (
              <p className="text-center text-xs text-slate-400 py-8">Cargando...</p>
            ) : categorias.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No hay categorías.</p>
            ) : (
              <div className="space-y-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <Tag size={13} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-slate-800 block truncate">{cat.nombre}</span>
                          {cat.descripcion && <span className="text-[10px] text-slate-400 block truncate">{cat.descripcion}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-slate-400">{cat.total_profesionales} prof.</span>
                      <button
                        onClick={() => handleDeleteCat(cat.id)}
                        title={cat.total_profesionales > 0 ? 'Tiene profesionales asignados' : 'Eliminar'}
                        className={`p-1.5 rounded-lg transition-colors ${cat.total_profesionales > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                        disabled={cat.total_profesionales > 0}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal detalle profesional */}
      {viewingProf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img src={avatarUrl(viewingProf.nombre)} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewingProf.nombre}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass(viewingProf.estado)}`}>{viewingProf.estado}</span>
                </div>
              </div>
              <button onClick={() => setViewingProf(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs space-y-2 border-t pt-3">
              <p><strong>Email:</strong> {viewingProf.email}</p>
              {viewingProf.categoria && <p><strong>Categoría:</strong> {viewingProf.categoria}</p>}
              {viewingProf.descripcion && <p className="text-slate-500">{viewingProf.descripcion}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleChangeStatus(viewingProf.id, viewingProf.estado === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${viewingProf.estado === 'SUSPENDIDO' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {viewingProf.estado === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
              </button>
              <button onClick={() => setViewingProf(null)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-xl font-bold transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
