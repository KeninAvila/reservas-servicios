import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Phone, MapPin,
  Clock, Share2, SearchX,
} from 'lucide-react';
import api from '../services/api';
import Button from './ui/Button';
import { Input, TextArea, ErrorNote } from './ui/Field';
import { Spinner } from './ui/Skeleton';
import { avatarUrl, fmtHora, fmtHoraCorta, fmtPrecio } from '../lib/format';

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

const DATE_OPTIONS = buildDates(30);

// Encabezado de paso: punto numerado jade + rótulo.
function Step({ num, title, done }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-colors duration-200 ${
        done ? 'bg-brand-600 text-white' : 'bg-sand text-ink/50'
      }`}>
        {done ? <Check size={12} strokeWidth={3} /> : num}
      </span>
      <h2 className="caption text-ink/50">{title}</h2>
    </div>
  );
}

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
    <div className="min-h-screen flex items-center justify-center">
      <Spinner label="Cargando perfil…" />
    </div>
  );

  if (loadError || !profesional) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-white border border-sand flex items-center justify-center">
        <SearchX size={24} className="text-ink/30" strokeWidth={1.5} />
      </div>
      <p className="font-display font-semibold text-xl text-ink mt-5">Perfil no encontrado</p>
      <p className="text-sm text-ink/50 mt-1.5">{loadError}</p>
      <Button variant="secondary" className="mt-7" onClick={onBack}>Volver a explorar</Button>
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
      <div className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md text-center animate-scaleIn">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center mx-auto animate-ringPulse">
            <Check size={30} className="text-white" strokeWidth={2.5} />
          </div>

          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight mt-6">Reserva enviada</h2>
          <p className="text-sm text-ink/55 leading-relaxed mt-2 max-w-xs mx-auto">
            Tu solicitud está <span className="font-semibold text-ink">pendiente de confirmación</span>. Notifica al profesional para agilizar tu cita.
          </p>

          <div className="mt-7 bg-white rounded-2xl border border-sand p-6 text-left space-y-3.5">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-ink/50">Servicio</span>
              <span className="font-medium text-ink text-right">{selService?.nombre}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-ink/50">Fecha</span>
              <span className="font-medium text-ink">{selDate}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-ink/50">Hora</span>
              <span className="font-medium text-ink">{fmtHora(selTime)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-3.5 border-t border-sand">
              <span className="text-sm text-ink/50">Total</span>
              <span className="font-display font-semibold text-lg text-brand-700 tabular-nums">{fmtPrecio(selService?.precio)}</span>
            </div>
            <p className="font-mono text-[10px] text-ink/30 uppercase tracking-wider text-center pt-1">{uuid}</p>
          </div>

          <div className="mt-6 space-y-3">
            {profTel ? (
              <Button
                variant="whatsapp" size="lg" full
                onClick={() => window.open(`https://wa.me/${profTel}?text=${waText}`, '_blank')}
              >
                <Phone size={16} /> Notificar por WhatsApp
              </Button>
            ) : (
              <Button size="lg" full onClick={() => { window.location.hash = `#/cita/${uuid}`; }}>
                Ver estado de mi cita
              </Button>
            )}
            <Button variant="ghost" full onClick={onBack}>Volver a explorar</Button>
            <p className="text-xs text-ink/40 leading-relaxed">
              Para cancelar, usa el enlace del mensaje de WhatsApp o la sección Mis reservas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking ──────────────────────────────────────────────────────────────

  if (view === 'booking') {
    const canSubmit = selTime && nombre.trim() && telefono.trim();
    return (
      <div className="min-h-screen flex flex-col">
        <header className="glass border-b border-ink/5 sticky top-0 z-40">
          <div className="max-w-2xl lg:max-w-3xl mx-auto px-5 py-3.5 flex items-center gap-4">
            <button
              onClick={() => setView('profile')}
              aria-label="Volver al perfil"
              className="w-9 h-9 rounded-full bg-white border border-sand hover:border-brand-400 flex items-center justify-center text-ink/60 transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-base text-ink truncate leading-tight">{selService?.nombre}</h1>
              <p className="text-xs text-ink/50 truncate">
                {profesional.nombre_negocio} · {selService?.duracion_min} min · {fmtPrecio(selService?.precio)}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-2xl lg:max-w-3xl mx-auto px-5 py-8 pb-36 space-y-10">

          {/* 1 · Fecha */}
          <section className="animate-fadeIn">
            <Step num="1" title="Elige la fecha" done />
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
              {DATE_OPTIONS.map(d => (
                <button
                  key={d.iso} onClick={() => setSelDate(d.iso)}
                  className={`px-3.5 py-3 rounded-2xl text-center flex flex-col items-center min-w-[62px] border transition-all duration-200 ${
                    selDate === d.iso
                      ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                      : 'bg-white text-ink/70 border-sand hover:border-brand-400'
                  }`}
                >
                  <span className="text-[9px] font-semibold tracking-wider opacity-65">{d.month}</span>
                  <span className="font-display font-semibold text-xl leading-none my-1 tabular-nums">{d.num}</span>
                  <span className="text-[9px] font-semibold tracking-wider opacity-65">{d.day}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 2 · Hora */}
          <section className="animate-fadeIn" style={{ animationDelay: '60ms' }}>
            <Step num="2" title="Horarios disponibles" done={!!selTime} />
            {loadingSlots ? (
              <div className="flex items-center gap-2.5 py-6 justify-center text-sm text-ink/45">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Consultando disponibilidad…
              </div>
            ) : slots.length === 0 ? (
              <div className="text-sm text-gold-700 bg-gold-100 rounded-xl px-4 py-3">
                No hay horarios disponibles para esta fecha. Prueba con otro día.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Left arrow — spacer when hidden to keep layout stable */}
                {canScrollLeft
                  ? <button onClick={() => scrollSlots(-1)} aria-label="Anteriores" className="shrink-0 w-8 h-8 rounded-full bg-white border border-sand hover:border-brand-400 flex items-center justify-center text-ink/60 transition-colors">
                      <ChevronLeft size={15} />
                    </button>
                  : <div className="shrink-0 w-8" />
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
                        className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap border transition-all duration-200 tabular-nums ${
                          selTime === t
                            ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                            : 'bg-white text-ink/65 border-sand hover:border-brand-400 hover:text-brand-700'
                        }`}
                      >
                        {fmtHoraCorta(t)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right arrow — spacer when hidden */}
                {canScrollRight
                  ? <button onClick={() => scrollSlots(1)} aria-label="Siguientes" className="shrink-0 w-8 h-8 rounded-full bg-white border border-sand hover:border-brand-400 flex items-center justify-center text-ink/60 transition-colors">
                      <ChevronRight size={15} />
                    </button>
                  : <div className="shrink-0 w-8" />
                }
              </div>
            )}
          </section>

          {/* 3 · Datos */}
          <section className="animate-fadeIn" style={{ animationDelay: '120ms' }}>
            <Step num="3" title="Tus datos" done={!!(nombre.trim() && telefono.trim())} />
            <div className="space-y-3">
              <Input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} />
              <Input type="tel" placeholder="Teléfono (ej: 0991234567)" value={telefono} onChange={e => setTelefono(e.target.value)} />
              <TextArea placeholder="Nota para el profesional (opcional)" value={nota} onChange={e => setNota(e.target.value)} rows={2} />
            </div>
          </section>

          <ErrorNote>{bookingError}</ErrorNote>
        </main>

        {/* CTA fijo */}
        <div className="sticky bottom-0 glass border-t border-ink/5">
          <div className="max-w-2xl lg:max-w-3xl mx-auto px-5 py-4 flex items-center gap-5">
            <div className="hidden sm:block min-w-0">
              <p className="text-xs text-ink/50 truncate">
                {selTime ? `${selDate} · ${fmtHora(selTime)}` : 'Fecha y hora'}
              </p>
              <p className="font-display font-semibold text-xl text-ink leading-tight tabular-nums">{fmtPrecio(selService?.precio)}</p>
            </div>
            <Button
              size="lg" full
              className="flex-1"
              onClick={handleBook}
              disabled={!canSubmit}
              loading={submitting}
            >
              {submitting ? 'Enviando reserva…' : canSubmit ? 'Confirmar reserva' : 'Completa los pasos para reservar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Profile (default) ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass border-b border-ink/5 sticky top-0 z-40">
        <div className="max-w-4xl xl:max-w-5xl mx-auto px-5 py-3.5 flex items-center gap-4">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="w-9 h-9 rounded-full bg-white border border-sand hover:border-brand-400 flex items-center justify-center text-ink/60 transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display font-semibold text-base text-ink truncate flex-1">{profesional.nombre_negocio}</h1>
          <button
            onClick={copyProfileLink}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 bg-white border border-sand hover:border-brand-400 hover:text-brand-700 px-4 py-2 rounded-full transition-all duration-200 shrink-0"
          >
            {linkCopied ? <Check size={13} /> : <Share2 size={13} />}
            {linkCopied ? 'Copiado' : 'Compartir'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl xl:max-w-5xl mx-auto px-5 pt-6 pb-16">

        {/* Portada + avatar */}
        <div className="animate-fadeIn">
          <div className="h-44 md:h-60 rounded-3xl overflow-hidden bg-brand-900">
            {profesional.banner
              ? <img src={profesional.banner} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center">
                  <span className="font-display font-semibold text-7xl md:text-8xl text-white/15 select-none">
                    {(profesional.nombre_negocio || '?').charAt(0)}
                  </span>
                </div>
              )
            }
          </div>
          <div className="px-5 md:px-7 -mt-9 flex items-end gap-4">
            <img
              src={img} alt={profesional.nombre_negocio}
              onError={e => { e.target.src = avatarUrl(profesional.nombre_negocio); }}
              className="w-[76px] h-[76px] rounded-2xl object-cover border-4 border-cream bg-white shadow-soft"
            />
          </div>
        </div>

        <div className="mt-5 md:grid md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] md:gap-12">

          {/* Info */}
          <div className="min-w-0 animate-fadeIn" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight">
                {profesional.nombre_negocio}
              </h2>
              <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                {profesional.categoria}
              </span>
            </div>
            <p className="text-sm text-ink/50 mt-1">{profesional.nombre}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink/60 bg-white border border-sand px-3 py-1.5 rounded-full">
                <MapPin size={12} className="text-brand-600" />
                {profesional.direccion_1} · {profesional.ciudad}
              </span>
              {profesional.telefono && (
                <a
                  href={`https://wa.me/${profTel}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Phone size={12} /> WhatsApp
                </a>
              )}
            </div>

            {profesional.descripcion && (
              <p className="text-sm text-ink/65 leading-relaxed mt-5">{profesional.descripcion}</p>
            )}

            {profesional.google_maps_url && (
              <a
                href={profesional.google_maps_url} target="_blank" rel="noopener noreferrer"
                className="mt-6 flex items-center gap-3 bg-white rounded-2xl border border-sand p-4 hover:border-brand-300 hover:shadow-soft transition-all duration-200"
              >
                <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <MapPin size={15} className="text-brand-600" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-ink block">Ver en Google Maps</span>
                  <span className="text-xs text-ink/45 truncate block">{profesional.direccion_1}</span>
                </span>
                <ChevronRight size={16} className="text-ink/25 shrink-0" />
              </a>
            )}
          </div>

          {/* Servicios */}
          <div className="mt-8 md:mt-0 animate-fadeIn" style={{ animationDelay: '120ms' }}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="caption text-ink/45">Servicios</h3>
              <span className="text-xs text-ink/40 font-medium">{servicios.length}</span>
            </div>

            {servicios.length === 0 ? (
              <div className="bg-white rounded-2xl border border-sand py-10 px-6 text-center">
                <p className="text-sm text-ink/45">Este profesional aún no tiene servicios publicados.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-sand overflow-hidden">
                {servicios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => openBooking(s)}
                    className="w-full text-left group px-5 py-4 flex items-center gap-4 border-b border-sand last:border-b-0 hover:bg-brand-50/50 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-ink block">{s.nombre}</span>
                      <span className="text-xs text-ink/45 flex items-center gap-1.5 mt-1">
                        <Clock size={11} /> {s.duracion_min} min
                      </span>
                      {s.descripcion && <span className="text-xs text-ink/40 block mt-0.5 truncate">{s.descripcion}</span>}
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-display font-semibold text-base text-brand-700 tabular-nums">{fmtPrecio(s.precio)}</span>
                      <span className="w-7 h-7 rounded-full bg-cream group-hover:bg-brand-600 flex items-center justify-center transition-colors duration-200">
                        <ChevronRight size={14} className="text-ink/40 group-hover:text-white transition-colors duration-200" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
