import { useState } from 'react';
import {
  Search, Star, ArrowLeft, CheckCircle2, MessageCircle,
  Scissors, Zap, Activity, Sparkles, Smile, GraduationCap, HeartPulse,
} from 'lucide-react';

const FALLBACK_CLINIC = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000';

function getCategoryIcon(iconName) {
  const props = { size: 15 };
  switch (iconName) {
    case 'Scissors':     return <Scissors     {...props} />;
    case 'Zap':          return <Zap          {...props} />;
    case 'Activity':     return <Activity     {...props} />;
    case 'Sparkles':     return <Sparkles     {...props} />;
    case 'Smile':        return <Smile        {...props} />;
    case 'GraduationCap':return <GraduationCap {...props} />;
    default:             return <HeartPulse   {...props} />;
  }
}

function getDatesFromToday(count = 7) {
  const days  = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      label: days[d.getDay()],
      num: String(d.getDate()).padStart(2, '0'),
      month: months[d.getMonth()],
      iso: d.toISOString().split('T')[0],
    });
  }
  return result;
}

const TIME_OPTIONS = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

export default function ClientPanel({ professionals, categories, bookings, onAddBooking, onOpenLogin }) {
  const [view, setView]       = useState('explore'); // explore | detail | booking | success | my-bookings
  const [selectedProf, setSelectedProf]     = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCat, setSelectedCat]   = useState('Todos');

  const dateOptions = getDatesFromToday(7);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [clientName, setClientName]     = useState('');
  const [clientPhone, setClientPhone]   = useState('');

  const activeProfessionals = professionals.filter(p => p.status === 'activo');
  const filtered = activeProfessionals.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat = selectedCat === 'Todos' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  function handleSelectProf(p) { setSelectedProf(p); setView('detail'); }
  function handleSelectService(s) { setSelectedService(s); setView('booking'); }

  function handleConfirmBooking(e) {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor, ingresa tu nombre y teléfono.');
      return;
    }
    const id = `UUID-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      id,
      professionalId:   selectedProf.id,
      professionalName: selectedProf.name,
      serviceId:        selectedService.id,
      serviceName:      selectedService.name,
      price:            selectedService.price,
      date:             selectedDate,
      time:             selectedTime,
      clientName,
      clientPhone,
      status: 'pendiente',
    };
    onAddBooking(newBooking);
    setCreatedBooking(newBooking);
    setClientName('');
    setClientPhone('');
    setView('success');
  }

  // ── EXPLORE ─────────────────────────────────────────────────────────────────
  if (view === 'explore') return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-base italic shadow-sm">S</div>
          <span className="font-extrabold tracking-tighter text-slate-950 text-lg">SERVI</span>
        </div>
        <button
          onClick={() => setView('my-bookings')}
          className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all"
        >
          Mis Citas ({bookings.length})
        </button>
      </header>

      <div className="px-4 space-y-4 pb-20">
        <h1 className="font-extrabold text-slate-900 tracking-tight text-xl">Explorar Servicios</h1>

        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text" placeholder="¿Qué servicio buscas hoy?"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar select-none">
          <button
            onClick={() => setSelectedCat('Todos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${selectedCat === 'Todos' ? 'bg-slate-950 text-white border-slate-950 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            📍 Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${selectedCat === cat.name ? 'bg-slate-950 text-white border-slate-950 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Professional list */}
        <div className="space-y-3 pt-1">
          <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">Profesionales Destacados</h2>
          {filtered.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-400">
              Ningún profesional disponible en esta categoría.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(prof => (
                <div
                  key={prof.id}
                  onClick={() => handleSelectProf(prof)}
                  className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={prof.avatar} alt={prof.name} className="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-100 group-hover:scale-105 transition-transform" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs truncate leading-snug">{prof.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block leading-tight mt-0.5">{prof.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                    <Star size={11} className="fill-amber-400 stroke-amber-400" />
                    <span className="text-[10px] font-bold text-slate-700">{prof.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 grid grid-cols-4 py-2 text-center font-bold text-[10px] text-slate-400">
        <button onClick={() => setSelectedCat('Todos')} className="text-slate-900 flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">🏠</span><span>Inicio</span>
        </button>
        <button onClick={() => { setSearchQuery(''); document.querySelector('input')?.focus(); }} className="flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">🔍</span><span>Buscar</span>
        </button>
        <button onClick={() => setView('my-bookings')} className="flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">📅</span><span>Reservas</span>
        </button>
        <button onClick={onOpenLogin} className="flex flex-col items-center gap-0.5">
          <span className="text-lg leading-none">👤</span><span>Perfil</span>
        </button>
      </nav>
    </div>
  );

  // ── DETAIL ───────────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedProf) return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="relative h-56 w-full">
        <img src={selectedProf.clinicImage || FALLBACK_CLINIC} alt="" className="w-full h-full object-cover" />
        <button onClick={() => setView('explore')} className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-xl hover:bg-black/60 transition-colors">
          <ArrowLeft size={16} className="stroke-[3px]" />
        </button>
      </div>
      <div className="px-5 pt-5 pb-20 space-y-4 -mt-4 bg-white rounded-t-3xl relative z-10">
        <div>
          <h1 className="font-extrabold text-slate-950 text-xl tracking-tight leading-none">{selectedProf.name}</h1>
          <p className="text-xs text-slate-500 font-bold mt-1.5">{selectedProf.category}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="fill-amber-400 stroke-amber-400" />
            <span className="text-xs font-bold text-slate-700">{selectedProf.rating}</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedProf.description}</p>
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Servicios</h3>
          <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
            {selectedProf.services.map(s => (
              <div key={s.id} onClick={() => handleSelectService(s)} className="p-3.5 flex items-center justify-between hover:bg-slate-100/50 cursor-pointer transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{s.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Duración: {s.durationMin} min</span>
                </div>
                <span className="text-xs font-bold text-slate-950 shrink-0">${s.price}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => handleSelectService(selectedProf.services[0])}
          className="w-full bg-slate-950 hover:bg-slate-900 text-white text-center font-bold py-3.5 rounded-xl text-xs shadow-md transition-all"
        >
          Solicitar Cita
        </button>
      </div>
    </div>
  );

  // ── BOOKING ──────────────────────────────────────────────────────────────────
  if (view === 'booking' && selectedProf && selectedService) return (
    <form onSubmit={handleConfirmBooking} className="flex-1 flex flex-col bg-white">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button type="button" onClick={() => setView('detail')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-700">
          <ArrowLeft size={18} className="stroke-[2.5px]" />
        </button>
        <h1 className="font-bold text-slate-900 text-sm">Proceso de Reserva</h1>
        <div className="w-6" />
      </header>

      <main className="flex-1 p-5 space-y-6 overflow-y-auto pb-8">
        {/* Prof card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <img src={selectedProf.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-xs">{selectedProf.name}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{selectedService.name} · {selectedService.durationMin} min · ${selectedService.price}</span>
          </div>
        </div>

        {/* Date carousel */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seleccionar Fecha</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
            {dateOptions.map(d => (
              <div
                key={d.iso}
                onClick={() => setSelectedDate(d.iso)}
                className={`px-4 py-3.5 rounded-2xl border text-center flex flex-col items-center min-w-[70px] cursor-pointer transition-all ${selectedDate === d.iso ? 'bg-slate-950 text-white border-slate-950 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <span className="text-[10px] font-bold opacity-60 uppercase">{d.month}</span>
                <span className="text-lg font-black tracking-tight leading-none my-1">{d.num}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Seleccionar Hora</span>
          <div className="flex gap-2.5 flex-wrap">
            {TIME_OPTIONS.map(t => (
              <button
                key={t} type="button" onClick={() => setSelectedTime(t)}
                className={`flex-1 min-w-[65px] text-center font-bold text-xs py-2.5 rounded-xl border transition-all ${selectedTime === t ? 'bg-slate-950 text-white border-slate-950 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Client data */}
        <div className="space-y-3">
          <input
            type="text" required placeholder="Nombre completo"
            value={clientName} onChange={e => setClientName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:outline-none placeholder:text-slate-400 font-medium"
          />
          <input
            type="tel" required placeholder="Teléfono"
            value={clientPhone} onChange={e => setClientPhone(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-950 focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
          <span className="text-xl">💵</span>
          <span>Pago en efectivo al finalizar</span>
        </div>

        <button type="submit" className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all">
          Confirmar Reserva
        </button>
      </main>
    </form>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (view === 'success' && createdBooking) return (
    <div className="flex-1 flex flex-col bg-white p-6 justify-center items-center text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm animate-scaleIn">
        <CheckCircle2 size={50} className="stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h2 className="font-black text-slate-950 text-xl tracking-tight">¡Solicitud enviada!</h2>
        <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Código: {createdBooking.id}</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
        Tu solicitud está en estado <strong>pendiente</strong>. El profesional revisará la disponibilidad y te contactará para confirmar. Mantente atento a tu teléfono.
      </p>
      <div className="w-full space-y-2 pt-2">
        <a
          href={`https://wa.me/${createdBooking.clientPhone.replace(/\D/g, '')}?text=Hola,%20acabo%20de%20solicitar%20${encodeURIComponent(createdBooking.serviceName)}%20con%20código%20${createdBooking.id}.`}
          target="_blank" rel="noreferrer"
          className="w-full border border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold py-3 px-4 rounded-full text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <MessageCircle size={15} className="fill-emerald-600 stroke-none" />
          <span>Notificar al profesional</span>
        </a>
        <button
          onClick={() => { setView('explore'); setSelectedProf(null); setSelectedService(null); }}
          className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-full text-xs block transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );

  // ── MY BOOKINGS ───────────────────────────────────────────────────────────────
  if (view === 'my-bookings') return (
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setView('explore')} className="p-1 hover:bg-slate-100 rounded-lg text-slate-700">
          <ArrowLeft size={18} className="stroke-[2.5px]" />
        </button>
        <h1 className="font-bold text-slate-900 text-sm">Mis Solicitudes</h1>
        <div className="w-6" />
      </header>
      <main className="flex-1 p-4 space-y-3 overflow-y-auto pb-8">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">Aún no has solicitado ninguna cita.</div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-xs space-y-2 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">{b.id}</span>
                  <h4 className="font-bold text-slate-800 mt-0.5">{b.serviceName}</h4>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.status === 'confirmada' ? 'bg-emerald-100 text-emerald-800' : b.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                  {b.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                <div>
                  <span className="text-[8px] text-slate-400 block uppercase">Profesional</span>
                  <span className="font-semibold text-slate-700">{b.professionalName}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block uppercase">Precio</span>
                  <span className="font-bold text-slate-800">${b.price}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">📅 {b.date} a las {b.time}</p>
            </div>
          ))
        )}
      </main>
    </div>
  );

  return null;
}
