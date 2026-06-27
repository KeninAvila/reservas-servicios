import { useState } from 'react';
import {
  Users, Calendar, Clock, TrendingUp, Search, PlusCircle,
  MoreVertical, Edit2, Trash2, Eye, AlertOctagon, Tag, X, Check,
} from 'lucide-react';

function statusClass(status) {
  const s = (status || '').toLowerCase();
  return s === 'activo' ? 'bg-emerald-100 text-emerald-800'
    : s === 'pendiente' ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800';
}

function statusLabel(status) {
  const s = (status || '').toUpperCase();
  return s === 'ACTIVO' ? 'ACTIVO' : s === 'SUSPENDIDO' ? 'SUSPENDIDO' : s;
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=10b981&color=fff&size=128`;
}

export default function AdminPanel({
  professionals, bookings, categories,
  onUpdateProfessionals, onUpdateBookings, onUpdateCategories,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('inicio');

  // Professionals
  const [profSearch, setProfSearch]   = useState('');
  const [profFilter, setProfFilter]   = useState('Todos');
  const [viewingProf, setViewingProf] = useState(null);

  // Bookings
  const [bookingFilter, setBookingFilter] = useState('Todos');

  // Categories
  const [catSearch, setCatSearch]     = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [editingCat, setEditingCat]   = useState(null);
  const [catMenuId, setCatMenuId]     = useState(null);

  const totalBookings      = bookings.length;
  const totalProfessionals = professionals.length;
  const pendingCount       = bookings.filter(b => b.status === 'pendiente').length;

  const filteredProfs = professionals.filter(p => {
    const q      = profSearch.toLowerCase();
    const name   = (p.nombre || p.name || '').toLowerCase();
    const matchQ = name.includes(q) || (p.email || '').toLowerCase().includes(q);
    const matchF = profFilter === 'Todos' || (p.status || '').toLowerCase() === profFilter.toLowerCase();
    return matchQ && matchF;
  });

  const filteredCats = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));

  function handleApprove(id) {
    onUpdateProfessionals(prev => prev.map(p => p.id === id ? { ...p, status: 'ACTIVO' } : p));
  }
  function handleBlock(id) {
    onUpdateProfessionals(prev => prev.map(p =>
      p.id === id
        ? { ...p, status: (p.status || '').toUpperCase() === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO' }
        : p
    ));
  }
  function handleDeleteProf(id) {
    if (confirm('¿Eliminar a este profesional del sistema?')) {
      onUpdateProfessionals(prev => prev.filter(p => p.id !== id));
    }
  }

  function handleAddCat(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onUpdateCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: newCatName, iconName: 'Tag' }]);
    setNewCatName(''); setIsAddingCat(false);
  }
  function handleEditCat(e) {
    e.preventDefault();
    if (!editingCat?.name.trim()) return;
    onUpdateCategories(prev => prev.map(c => c.id === editingCat.id ? editingCat : c));
    setEditingCat(null); setCatMenuId(null);
  }
  function handleDeleteCat(id) {
    if (confirm('¿Eliminar esta categoría?')) {
      onUpdateCategories(prev => prev.filter(c => c.id !== id));
      setCatMenuId(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">AD</div>
          <h1 className="font-bold text-slate-900 tracking-tight text-base">Administración</h1>
        </div>
        <button onClick={onLogout} className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors">
          Salir
        </button>
      </header>

      {/* Nav tabs */}
      <div className="flex bg-slate-100 p-1 mx-4 mt-4 rounded-lg gap-0.5 text-xs font-semibold">
        {['inicio','profesionales','reservas','categorías'].map(t => (
          <button key={t} onClick={() => setActiveTab(t === 'categorías' ? 'categorias' : t)} className={`flex-1 py-2 text-center rounded-md transition-all capitalize ${activeTab === (t === 'categorías' ? 'categorias' : t) ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 overflow-y-auto pb-8">

        {/* ── INICIO ── */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-600 text-white rounded-xl p-3 shadow-md flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-blue-100">Reservas</span>
                  <Calendar size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{totalBookings}</h3>
                <span className="text-[9px] text-blue-200 mt-1 block">Registradas</span>
              </div>
              <div className="bg-emerald-600 text-white rounded-xl p-3 shadow-md flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-100">Profesionales</span>
                  <Users size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{totalProfessionals}</h3>
                <span className="text-[9px] text-emerald-200 mt-1 block">En sistema</span>
              </div>
              <div className="bg-amber-500 text-white rounded-xl p-3 shadow-md flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-amber-100">Pendientes</span>
                  <Clock size={14} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold font-mono leading-none mt-1">{pendingCount}</h3>
                <span className="text-[9px] text-amber-100 mt-1 block">Por aprobar</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 text-sm">Actividad Reciente</h4>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <TrendingUp size={10} /> Últimos 7 días
                </span>
              </div>
              <div className="relative h-32 w-full mt-2">
                <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <defs>
                    <linearGradient id="chart-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 10,75 C 30,50 60,65 80,55 C 100,45 120,60 150,50 C 180,40 210,65 240,40 C 260,20 280,30 290,60 L 290,100 L 10,100 Z" fill="url(#chart-grad)" />
                  <path d="M 10,75 C 30,50 60,65 80,55 C 100,45 120,60 150,50 C 180,40 210,65 240,40 C 260,20 280,30 290,60" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="80" cy="55" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="150" cy="50" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="240" cy="40" r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-400 font-medium mt-1">
                  {['Día 1','Día 2','Día 3','Día 4','Día 5','Día 6','Día 7'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Supervisión en Tiempo Real</h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <p>Cliente solicitó una nueva cita de <strong>Corte y Peinado</strong> con Alejandro Gómez. Código: <strong>UUID-1245</strong></p>
                </div>
                <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                  <p>Profesional <strong>Dr. Alejandro Rossi</strong> registrado y activo en el sistema.</p>
                </div>
                <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                  <p>Pendiente la aprobación de <strong>Ana García</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFESIONALES ── */}
        {activeTab === 'profesionales' && (
          <div className="space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5 text-xs text-slate-600 font-semibold">
              {['Todos','ACTIVO','SUSPENDIDO'].map(f => (
                <button key={f} onClick={() => setProfFilter(f)} className={`flex-1 py-1.5 text-center rounded-md transition-all ${profFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  {f === 'Todos' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Buscar profesionales..." value={profSearch} onChange={e => setProfSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors" />
            </div>

            <div className="space-y-3">
              {filteredProfs.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No se encontraron profesionales.</p>
              ) : filteredProfs.map(prof => {
                const displayName = prof.nombre || prof.name || '';
                const profAvatar  = prof.avatar || avatarUrl(displayName);
                return (
                  <div key={prof.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={profAvatar} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-100" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{displayName}</h4>
                        <span className="text-[10px] text-slate-400 truncate block">{prof.email}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${statusClass(prof.status)}`}>
                          {statusLabel(prof.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(prof.status || '').toLowerCase() === 'pendiente' && (
                        <button title="Aprobar" onClick={() => handleApprove(prof.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                          <Check size={14} className="stroke-[3px]" />
                        </button>
                      )}
                      <button title="Ver detalles" onClick={() => setViewingProf(prof)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button title={(prof.status || '').toUpperCase() === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'} onClick={() => handleBlock(prof.id)} className={`p-1.5 rounded-lg transition-colors ${(prof.status || '').toUpperCase() === 'SUSPENDIDO' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                        <AlertOctagon size={14} />
                      </button>
                      <button title="Eliminar" onClick={() => handleDeleteProf(prof.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESERVAS ── */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Todas las Reservas</h3>
              <select value={bookingFilter} onChange={e => setBookingFilter(e.target.value)} className="bg-slate-100 text-xs font-semibold px-2 py-1 rounded-lg text-slate-700 focus:outline-none border-none">
                <option value="Todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmada">Confirmadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
            <div className="space-y-3">
              {bookings.filter(b => bookingFilter === 'Todos' || b.status === bookingFilter).map(b => (
                <div key={b.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{b.id}</span>
                      <h4 className="font-bold text-slate-800 mt-0.5">{b.serviceName}</h4>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.status === 'confirmada' ? 'bg-emerald-100 text-emerald-800' : b.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <div><span className="text-[9px] text-slate-400 block uppercase">Profesional</span><span className="font-medium">{b.professionalName}</span></div>
                    <div><span className="text-[9px] text-slate-400 block uppercase">Precio</span><span className="font-bold text-slate-800">${b.price}</span></div>
                    <div><span className="text-[9px] text-slate-400 block uppercase">Cliente</span><span className="font-medium">{b.clientName}</span></div>
                    <div><span className="text-[9px] text-slate-400 block uppercase">Contacto</span><span className="font-medium">{b.clientPhone}</span></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>📅 {b.date} a las {b.time}</span>
                    {b.status === 'pendiente' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => onUpdateBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'confirmada' } : x))} className="text-emerald-600 hover:underline">Confirmar</button>
                        <span className="text-slate-200">|</span>
                        <button onClick={() => onUpdateBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'rechazada' } : x))} className="text-red-500 hover:underline">Rechazar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORÍAS ── */}
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Buscar categorías..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors" />
            </div>

            <button onClick={() => setIsAddingCat(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors">
              <PlusCircle size={15} /> Nueva Categoría
            </button>

            {isAddingCat && (
              <form onSubmit={handleAddCat} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Añadir Categoría</span>
                  <button type="button" onClick={() => setIsAddingCat(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>
                <input type="text" required placeholder="Nombre de la categoría" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setIsAddingCat(false)} className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Añadir</button>
                </div>
              </form>
            )}

            {editingCat && (
              <form onSubmit={handleEditCat} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Editar Categoría</span>
                  <button type="button" onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>
                <input type="text" required value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setEditingCat(null)} className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Guardar</button>
                </div>
              </form>
            )}

            <div className="space-y-1 bg-white rounded-xl border border-slate-100 divide-y divide-slate-100">
              {filteredCats.map(cat => (
                <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <Tag size={18} />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setCatMenuId(catMenuId === cat.id ? null : cat.id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                    {catMenuId === cat.id && (
                      <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 text-xs animate-fadeIn">
                        <button onClick={() => { setEditingCat(cat); setCatMenuId(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 font-medium">
                          <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={() => handleDeleteCat(cat.id)} className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5 font-medium border-t border-slate-100">
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Professional detail modal */}
      {viewingProf && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img
                  src={viewingProf.avatar || avatarUrl(viewingProf.nombre || viewingProf.name)}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewingProf.nombre || viewingProf.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass(viewingProf.status)}`}>
                    {statusLabel(viewingProf.status)}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingProf(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs space-y-2 border-t pt-3">
              <p><strong>Email:</strong> {viewingProf.email}</p>
            </div>
            <button onClick={() => setViewingProf(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 rounded-xl font-semibold transition-colors">
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
