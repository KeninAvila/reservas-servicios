import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, MapPin, Clock, Calendar, CheckCircle2,
  Loader2, Share2, Check, ChevronRight, ChevronLeft, Phone,
} from 'lucide-react';
import api from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const DAYS   = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

function buildDates(n = 30) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      day:   DAYS[d.getDay()],
      num:   String(d.getDate()).padStart(2,'0'),
      month: MONTHS[d.getMonth()],
    };
  });
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`;
}

function fmtHora(h) {
  if (!h) return '';
  const [hr, mn] = h.split(':');
  const n = Number(hr);
  return `${n % 12 || 12}:${mn} ${n >= 12 ? 'PM' : 'AM'}`;
}

function fmtHoraCorta(h) {
  if (!h) return '';
  const [hr, mn] = h.split(':');
  const n = Number(hr);
  return `${n % 12 || 12}:${mn} ${n >= 12 ? 'pm' : 'am'}`;
}

const DATE_OPTIONS = buildDates(30);

// ── Component ───────────────────────────────────────────────────────────────
//
// Props:
//   profesionalId        — ID of the professional to display
//   onBack               — called when the user navigates back (required)
//   onBookingSuccess(uuid, record) — called after a successful booking

export default function ProfessionalView({ profesionalId, onBack, onBookingSuccess }) {
  const [profesional,  setProfesional]  = useState(null);
  const [servicios,    setServicios]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState('');

  const [view,         setView]         = useState('profile'); // 'profile' | 'booking' | 'success'
  const [selService,   setSelService]   = useState(null);
  const [selDate,      setSelDate]      = useState(DATE_OPTIONS[0].iso);
  const [slots,        setSlots]        = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selTime,      setSelTime]      = useState('');
  const [nombre,       setNombre]       = useState('');
  const [telefono,     setTelefono]     = useState('');
  const [nota,         setNota]         = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [uuid,         setUuid]         = useState('');
  const [linkCopied,   setLinkCopied]   = useState(false);
  const slotScrollRef  = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = slotScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  function scrollSlots(dir) {
    const el = slotScrollRef.current;
    if (!el) return;
    const firstBtn = el.querySelector('button');
    const colWidth  = firstBtn ? firstBtn.offsetWidth + 6 : 76; // 6px = gap-1.5
    el.scrollBy({ left: dir * colWidth * 3, behavior: 'smooth' });
  }

  useEffect(() => {
    Promise.all([
      api.get(`/router.php?route=public/profesional&id=${profesionalId}`),
      api.get(`/router.php?route=public/servicios&profesional_id=${profesionalId}`),
    ]).then(([pRes, sRes]) => {
      if (pRes.data.success) setProfesional(pRes.data.data);
      else setLoadError('Profesional no encontrado.');
      if (sRes.data.success) setServicios(sRes.data.data);
    }).catch(() => setLoadError('Error de conexión.'))
    .finally(() => setLoading(false));
  }, [profesionalId]);

  useEffect(() => {
    if (!selDate || !selService) return;
    setSlots([]); setSelTime(''); setLoadingSlots(true);
    api.get(`/router.php?route=public/disponibilidad&profesional_id=${profesionalId}&fecha=${selDate}&servicio_id=${selService.id}`)
      .then(r => { if (r.data.success) setSlots(r.data.data); })
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selDate, selService, profesionalId]);

  // Peek animation + init scroll state after slots render
  useEffect(() => {
    const el = slotScrollRef.current;
    if (!el || slots.length === 0) return;
    setTimeout(() => {
      updateScrollState();
      if (el.scrollWidth > el.clientWidth) {
        el.scrollTo({ left: 72, behavior: 'smooth' });
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: 'smooth' });
          updateScrollState();
        }, 650);
      }
    }, 350);
  }, [slots]);

  function openBooking(s) {
    setSelService(s);
    setSelDate(DATE_OPTIONS[0].iso);
    setSelTime('');
    setNombre(''); setTelefono(''); setNota('');
    setBookingError('');
    setView('booking');
  }

  async function handleBook() {
    if (!nombre.trim() || !telefono.trim()) { setBookingError('Nombre y teléfono son requeridos.'); return; }
    if (!selTime) { setBookingError('Selecciona un horario.'); return; }
    setBookingError(''); setSubmitting(true);
    try {
      const res = await api.post('/router.php?route=public/reserva', {
        profesional_id:   Number(profesionalId),
        servicio_id:      selService.id,
        fecha:            selDate,
        hora:             selTime,
        cliente_nombre:   nombre.trim(),
        cliente_telefono: telefono.trim(),
        cliente_nota:     nota.trim(),
      });
      if (res.data.success) {
        const newUuid = res.data.data.uuid;
        setUuid(newUuid);
        onBookingSuccess?.(newUuid, {
          uuid:           newUuid,
          profesional:    profesional.nombre_negocio,
          servicio:       selService.nombre,
          precio:         selService.precio,
          fecha:          selDate,
          hora:           selTime,
          cliente_nombre: nombre.trim(),
          created_at:     new Date().toISOString(),
        });
        setView('success');
      } else {
        setBookingError(res.data.message || 'Error al crear la reserva.');
      }
    } catch {
      setBookingError('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  function copyProfileLink() {
    const url = `${window.location.origin}${window.location.pathname}#/p/${profesionalId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={24} className="text-indigo-500 animate-spin" />
    </div>
  );

  if (loadError || !profesional) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
      <div className="text-4xl">😕</div>
      <p className="text-sm font-bold text-slate-700">Perfil no encontrado</p>
      <p className="text-xs text-slate-500">{loadError}</p>
      <button onClick={onBack} className="text-xs text-indigo-600 underline">Volver</button>
    </div>
  );

  const img     = profesional.foto_perfil || avatarUrl(profesional.nombre_negocio);
  const profTel = (profesional.telefono || '').replace(/\D/g, '');

  // ── Success ──────────────────────────────────────────────────────────────

  if (view === 'success') {
    const trackingUrl = `${window.location.origin}${window.location.pathname}#/cita/${uuid}`;
    const waText = encodeURIComponent(
      `Hola ${profesional.nombre_negocio}, acabo de reservar una cita.\n\n` +
      `📋 Servicio: ${selService?.nombre}\n` +
      `📅 Fecha: ${selDate}\n` +
      `🕐 Hora: ${fmtHora(selTime)}\n\n` +
      `Puedes ver o cancelar mi cita aquí:\n${trackingUrl}`
    );
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center shadow-lg shadow-indigo-100">
          <CheckCircle2 size={48} className="text-indigo-500 stroke-[1.5]" />
        </div>
        <div>
          <h2 className="font-black text-slate-900 text-2xl tracking-tight">¡Reserva enviada!</h2>
          <p className="font-mono text-slate-300 text-[10px] mt-1 uppercase">{uuid}</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
          Tu solicitud está <strong className="text-slate-700">pendiente</strong>. Notifica al profesional para que confirme tu cita.
        </p>

        <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 text-left space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-semibold">{selService?.nombre}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-semibold">{selDate}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Hora</span><span className="font-semibold">{fmtHora(selTime)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Precio</span><span className="font-semibold text-indigo-600">${Number(selService?.precio).toFixed(2)}</span></div>
        </div>

        <div className="w-full space-y-3">
          {profTel ? (
            <button
              onClick={() => window.open(`https://wa.me/${profTel}?text=${waText}`, '_blank')}
              className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-lg"
            >
              Notificar al profesional
              <span className="block text-[11px] font-normal opacity-80 mt-0.5">Recomendado para confirmar tu cita</span>
            </button>
          ) : (
            <button
              onClick={() => { window.location.hash = `#/cita/${uuid}`; }}
              className="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ver estado de mi cita
            </button>
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Para <strong className="text-slate-500">cancelar</strong> tu cita usa el enlace incluido en el mensaje de WhatsApp, o ve a <strong className="text-slate-500">Mis Citas</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ── Booking ──────────────────────────────────────────────────────────────

  if (view === 'booking') {
    const canSubmit = selTime && nombre.trim() && telefono.trim();
    return (
      <>
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setView('profile')}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{selService?.nombre}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {profesional.nombre_negocio} · ${Number(selService?.precio).toFixed(2)} · {selService?.duracion_min} min
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 p-5 space-y-5">
          <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
            <img src={img} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" onError={e => { e.target.src = avatarUrl(profesional.nombre_negocio); }} />
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{profesional.nombre_negocio}</p>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">
                {selService?.nombre} · {selService?.duracion_min} min · ${Number(selService?.precio).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} /> Fecha</span>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              {DATE_OPTIONS.map(d => (
                <div
                  key={d.iso} onClick={() => setSelDate(d.iso)}
                  className={`px-3.5 py-3 rounded-2xl text-center flex flex-col items-center min-w-[60px] cursor-pointer transition-all ${
                    selDate === d.iso
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[9px] font-bold opacity-70 uppercase">{d.month}</span>
                  <span className="text-lg font-black tracking-tight leading-none my-0.5">{d.num}</span>
                  <span className="text-[9px] font-bold uppercase">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={11} /> Horarios disponibles</span>
            {loadingSlots ? (
              <p className="text-xs text-slate-400 py-4 text-center">Consultando disponibilidad...</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Left arrow — spacer when hidden to keep layout stable */}
                {canScrollLeft
                  ? <button onClick={() => scrollSlots(-1)} className="shrink-0 w-7 h-7 bg-white shadow-md rounded-full flex items-center justify-center text-indigo-600 border border-slate-100 hover:bg-indigo-50 transition-colors">
                      <ChevronLeft size={15} />
                    </button>
                  : <div className="shrink-0 w-7" />
                }

                <div
                  ref={slotScrollRef}
                  onScroll={updateScrollState}
                  className="flex-1 overflow-x-auto no-scrollbar touch-pan-x pb-1"
                >
                  <div className="grid grid-rows-3 grid-flow-col gap-1.5 w-max">
                    {slots.map(t => (
                      <button
                        key={t} type="button" onClick={() => setSelTime(t)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                          selTime === t
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-105'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {fmtHoraCorta(t)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right arrow — spacer when hidden */}
                {canScrollRight
                  ? <button onClick={() => scrollSlots(1)} className="shrink-0 w-7 h-7 bg-white shadow-md rounded-full flex items-center justify-center text-indigo-600 border border-slate-100 hover:bg-indigo-50 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  : <div className="shrink-0 w-7" />
                }
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tus datos</span>
            <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all"
            />
            <input type="tel" placeholder="Teléfono (ej: 0991234567)" value={telefono} onChange={e => setTelefono(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all"
            />
            <textarea placeholder="Nota para el profesional (opcional)" value={nota} onChange={e => setNota(e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white focus:outline-none placeholder:text-slate-400 font-medium transition-all resize-none"
            />
          </div>

          {bookingError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{bookingError}</div>
          )}
        </main>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
          <button
            onClick={handleBook} disabled={!canSubmit || submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all"
          >
            {submitting ? 'Enviando reserva...' : canSubmit ? 'Confirmar Reserva' : 'Selecciona fecha, hora y tus datos'}
          </button>
        </div>
      </>
    );
  }

  // ── Profile (default) ────────────────────────────────────────────────────

  return (
    <>
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-black text-slate-900 text-sm truncate flex-1">{profesional.nombre_negocio}</h1>
        <button
          onClick={copyProfileLink}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-full transition-colors shrink-0"
        >
          {linkCopied ? <Check size={10} /> : <Share2 size={10} />}
          {linkCopied ? '¡Copiado!' : 'Compartir'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        {/* Banner + avatar */}
        <div className="relative mb-10">
          <div className="h-40 overflow-hidden">
            {profesional.banner
              ? <img src={profesional.banner} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-indigo-400 to-violet-500" />
            }
          </div>
          <div className="absolute -bottom-8 left-5">
            <img
              src={img} alt={profesional.nombre_negocio}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white"
              onError={e => { e.target.src = avatarUrl(profesional.nombre_negocio); }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="min-w-0">
            <h2 className="font-black text-slate-900 text-xl leading-tight">{profesional.nombre_negocio}</h2>
            <span className="text-xs text-slate-500 font-medium block mt-0.5">{profesional.nombre}</span>
            <span className="inline-block mt-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{profesional.categoria}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <MapPin size={11} className="text-indigo-400 shrink-0" />
              {profesional.direccion_1} · {profesional.ciudad}
            </span>
            {profesional.telefono && (
              <a
                href={`https://wa.me/${profTel}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 hover:bg-emerald-100 transition-colors"
              >
                <Phone size={10} /> WhatsApp
              </a>
            )}
          </div>

          {profesional.descripcion && (
            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-3">{profesional.descripcion}</p>
          )}
        </div>

        <div className="px-5 space-y-3 pb-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Servicios</h3>
          {servicios.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Este profesional aún no tiene servicios publicados.</p>
          ) : (
            <div className="space-y-2">
              {servicios.map(s => (
                <div
                  key={s.id} onClick={() => openBooking(s)}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all shadow-[0_1px_6px_rgba(0,0,0,0.06)] group"
                >
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
                      <ChevronRight size={11} className="text-indigo-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {profesional.google_maps_url && (
          <div className="px-5 mt-4">
            <a
              href={profesional.google_maps_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <MapPin size={14} className="text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">Ver en Google Maps</p>
                <p className="text-[10px] text-slate-500 truncate">{profesional.direccion_1}</p>
              </div>
              <ChevronRight size={13} className="text-slate-400 ml-auto shrink-0" />
            </a>
          </div>
        )}
      </main>
    </>
  );
}
