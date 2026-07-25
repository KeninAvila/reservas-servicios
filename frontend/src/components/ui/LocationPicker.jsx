import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2, MapPin } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

// Los iconos por defecto de Leaflet no cargan bien con bundlers (Vite) — se referencian por URL absoluta.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [-1.0544, -80.4516]; // Portoviejo, Manabí

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom() < 14 ? 15 : map.getZoom()); }, [center]);
  return null;
}

function parseLatLngFromUrl(url) {
  const match = (url || '').match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) return [Number(match[1]), Number(match[2])];
  return null;
}

export default function LocationPicker({ initialUrl, onConfirm, onClose }) {
  const initialLatLng = parseLatLngFromUrl(initialUrl);
  const [position, setPosition] = useState(initialLatLng ?? DEFAULT_CENTER);
  const [query,     setQuery]   = useState('');
  const [results,   setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) { setResults([]); return; }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ec&limit=5&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelectResult(r) {
    setPosition([Number(r.lat), Number(r.lon)]);
    setResults([]);
    setQuery(r.display_name);
  }

  function handleConfirm() {
    const [lat, lng] = position;
    onConfirm(`https://www.google.com/maps?q=${lat},${lng}`);
  }

  return (
    <Modal title="Selecciona tu ubicación" kicker="Mapa" onClose={onClose} maxWidth="sm:max-w-lg">
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 pointer-events-none" />
          <input
            type="text"
            placeholder="Busca tu dirección o negocio…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-sand rounded-xl text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10"
          />
          {searching && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 animate-spin" />}
        </div>

        {results.length > 0 && (
          <div className="border border-sand rounded-xl overflow-hidden divide-y divide-sand max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-cream transition-colors flex items-start gap-2"
              >
                <MapPin size={13} className="text-brand-600 shrink-0 mt-0.5" />
                <span className="truncate">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl overflow-hidden border border-sand h-72">
          <MapContainer center={position} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{ dragend: e => setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
            />
            <ClickHandler onPick={setPosition} />
            <RecenterMap center={position} />
          </MapContainer>
        </div>

        <p className="text-[11px] text-ink/40 leading-relaxed">
          Busca tu dirección, toca el mapa o arrastra el marcador para ajustar la ubicación exacta.
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="lg" className="flex-1" onClick={handleConfirm}>
            Usar esta ubicación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
