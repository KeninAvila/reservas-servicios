import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function ProfessionalPanel({
  professionals, bookings, activeProfId, loggedInUser,
  onUpdateBookings, onLogout,
}) {
  // Fuente de datos: usuario del backend o mock del localStorage
  const rawProf = loggedInUser || professionals.find(p => p.id === activeProfId);
  if (!rawProf) return null;

  const displayName = rawProf.nombre || rawProf.name || '';
  const avatarUrl   = rawProf.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=128`;
  const profStatus  = rawProf.status || 'activo';

  // Estado local para servicios y horarios (no requiere endpoint aún)
  const [localServices, setLocalServices] = useState(rawProf.services || []);
  const [localHours,    setLocalHours]    = useState(rawProf.hours    || []);

  const [panelTab,    setPanelTab]    = useState('operacion');
  const [bookingTab,  setBookingTab]  = useState('pendientes');
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName,     setNewServiceName]     = useState('');
  const [newServicePrice,    setNewServicePrice]    = useState(25);
  const [newServiceDuration, setNewServiceDuration] = useState(30);

  const profBookings    = bookings.filter(b => b.professionalId === rawProf.id);
  const pendingBookings   = profBookings.filter(b => b.status === 'pendiente');
  const confirmedBookings = profBookings.filter(b => b.status === 'confirmada');

  function handleAccept(id) {
    onUpdateBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmada' } : b));
  }
  function handleReject(id) {
    onUpdateBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rechazada' } : b));
  }

  function handleAddService(e) {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const svc = { id: `ser-${Date.now()}`, name: newServiceName, durationMin: newServiceDuration, price: newServicePrice };
    setLocalServices(prev => [...prev, svc]);
    setNewServiceName('');
    setIsAddingService(false);
  }

  function handleDeleteService(sid) {
    setLocalServices(prev => prev.filter(s => s.id !== sid));
  }

  function handleToggleDay(i) {
    setLocalHours(prev => prev.map((h, idx) => idx === i ? { ...h, enabled: !h.enabled } : h));
  }

  function handleTimeChange(i, type, val) {
    setLocalHours(prev => prev.map((h, idx) => idx === i ? { ...h, [type]: val } : h));
  }

  const statusColor = profStatus === 'activo' ? 'text-emerald-600'
    : profStatus === 'pendiente' ? 'text-amber-500'
    : 'text-red-500';

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border border-slate-100"
          />
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">{displayName}</h1>
            <span className={`text-[9px] font-bold uppercase ${statusColor}`}>
              ● {profStatus}
            </span>
          </div>
        </div>
        <button onClick={onLogout} className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full hover:bg-red-100 transition-colors">
          Salir
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 mx-4 mt-4 rounded-lg gap-1 text-xs font-semibold">
        <button onClick={() => setPanelTab('operacion')} className={`flex-1 py-2 text-center rounded-md transition-all ${panelTab === 'operacion' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          📋 Gestionar Agenda
        </button>
        <button onClick={() => setPanelTab('configuracion')} className={`flex-1 py-2 text-center rounded-md transition-all ${panelTab === 'configuracion' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          ⚙️ Configurar Perfil
        </button>
      </div>

      {/* ── OPERACION ── */}
      {panelTab === 'operacion' && (
        <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-8">
          {profStatus === 'pendiente' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold">⚠️ Registro Pendiente de Aprobación</p>
              <p>Tu perfil no aparece a los clientes hasta que el Admin apruebe tu cuenta.</p>
            </div>
          )}
          {profStatus === 'bloqueado' && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs">
              <p className="font-bold">🚫 Cuenta Bloqueada por Administración</p>
              <p>Tu servicio fue suspendido temporalmente. Contacta con soporte para reactivar.</p>
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5 text-xs font-bold text-slate-600">
            <button onClick={() => setBookingTab('pendientes')} className={`flex-1 py-2 rounded-md text-center transition-all ${bookingTab === 'pendientes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              Pendientes ({pendingBookings.length})
            </button>
            <button onClick={() => setBookingTab('confirmadas')} className={`flex-1 py-2 rounded-md text-center transition-all ${bookingTab === 'confirmadas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              Confirmadas ({confirmedBookings.length})
            </button>
          </div>

          {bookingTab === 'pendientes' && (
            <div className="space-y-4">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-xs">No tienes solicitudes pendientes.</p>
                </div>
              ) : pendingBookings.map(b => (
                <div key={b.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{b.serviceName}</h3>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold block mt-0.5">{b.id}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">${b.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">📅 {b.date} a las {b.time}</p>
                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p><strong>Cliente:</strong> {b.clientName}</p>
                    <p><strong>Contacto:</strong> {b.clientPhone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => handleAccept(b.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm">
                      Aceptar
                    </button>
                    <button onClick={() => handleReject(b.id)} className="border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 rounded-xl text-xs transition-colors">
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bookingTab === 'confirmadas' && (
            <div className="space-y-4">
              {confirmedBookings.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No hay citas confirmadas aún.</p>
              ) : confirmedBookings.map(b => (
                <div key={b.id} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3 shadow-sm text-xs animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-emerald-950 text-sm">{b.serviceName}</h3>
                      <span className="text-[10px] text-emerald-600/80 font-mono mt-0.5 block">{b.id}</span>
                    </div>
                    <span className="font-bold text-emerald-900 text-sm">${b.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-emerald-800 font-semibold">📅 {b.date} a las {b.time}</p>
                  <div className="space-y-0.5 text-emerald-900/95 font-medium">
                    <p><strong>Cliente:</strong> {b.clientName}</p>
                    <p><strong>Contacto:</strong> {b.clientPhone}</p>
                  </div>
                  <a href={`tel:${b.clientPhone}`} className="w-full bg-white hover:bg-slate-50 border border-slate-100 text-emerald-800 text-center font-bold py-2.5 rounded-xl text-xs block transition-colors shadow-sm">
                    📞 Llamar
                  </a>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── CONFIGURACION ── */}
      {panelTab === 'configuracion' && (
        <main className="flex-1 p-4 space-y-6 overflow-y-auto pb-8">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-base">Configuración de Perfil</h2>
            <button
              onClick={() => alert('¡Configuración guardada!')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Save size={13} /> Guardar
            </button>
          </div>

          {/* Servicios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Servicios</h3>
              <button onClick={() => setIsAddingService(!isAddingService)} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 font-semibold">
                <Plus size={14} /> Añadir
              </button>
            </div>

            {isAddingService && (
              <form onSubmit={handleAddService} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5 animate-fadeIn">
                <span className="text-xs font-bold text-slate-700">Nuevo Servicio</span>
                <input type="text" required placeholder="Nombre del servicio" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Precio ($)</span>
                    <input type="number" required value={newServicePrice} onChange={e => setNewServicePrice(Number(e.target.value))} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Duración (min)</span>
                    <input type="number" required value={newServiceDuration} onChange={e => setNewServiceDuration(Number(e.target.value))} className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 text-xs pt-1">
                  <button type="button" onClick={() => setIsAddingService(false)} className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg">Cancelar</button>
                  <button type="submit" className="px-3 py-1 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Añadir</button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm space-y-1.5">
              {localServices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aún no tienes servicios configurados. Añade tu primero.</p>
              ) : localServices.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.durationMin} min · ${s.price}</span>
                  </div>
                  <button onClick={() => handleDeleteService(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Horarios */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Horarios</h3>
            {localHours.length === 0 ? (
              <p className="text-xs text-slate-400">No hay horarios configurados.</p>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                {localHours.map((h, i) => (
                  <div key={h.day} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-b-0 text-xs">
                    <span className="font-semibold text-slate-700 w-24">{h.day}</span>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={h.enabled} onChange={() => handleToggleDay(i)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input type="text" disabled={!h.enabled} value={h.start} onChange={e => handleTimeChange(i, 'start', e.target.value)} className={`w-14 text-center text-xs py-1 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 ${!h.enabled ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`} />
                        <span className="text-slate-400">-</span>
                        <input type="text" disabled={!h.enabled} value={h.end} onChange={e => handleTimeChange(i, 'end', e.target.value)} className={`w-14 text-center text-xs py-1 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 ${!h.enabled ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
