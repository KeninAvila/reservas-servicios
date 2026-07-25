import { useState, useEffect } from 'react';
import { MapPin, Map } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import Button from './ui/Button';
import { Input, TextArea, Select, ErrorNote } from './ui/Field';
import LocationPicker from './ui/LocationPicker';

const PROVINCIAS = [
  { id: 1, nombre: 'Manabí' },
  { id: 2, nombre: 'Los Ríos' },
];

const CIUDADES = [
  { id: 1, nombre: 'Portoviejo', provincia_id: 1 },
  { id: 2, nombre: 'Manta', provincia_id: 1 },
  { id: 3, nombre: 'Chone', provincia_id: 1 },
  { id: 4, nombre: 'Bahía de Caráquez', provincia_id: 1 },
  { id: 5, nombre: 'Babahoyo', provincia_id: 2 },
  { id: 6, nombre: 'Quevedo', provincia_id: 2 },
  { id: 7, nombre: 'Ventanas', provincia_id: 2 },
  { id: 8, nombre: 'Vinces', provincia_id: 2 },
];

export default function ProfileSetupForm({ onComplete, initialData, onCancel }) {
  const [categorias,    setCategorias]    = useState([]);

  useEffect(() => {
    api.get('/router.php?route=public/categorias')
      .then(res => { if (res.data.success) setCategorias(res.data.data); })
      .catch(() => {});
  }, []);

  const [nombreNegocio, setNombreNegocio] = useState(initialData?.nombre_negocio ?? '');
  const [categoriaId,   setCategoriaId]   = useState(initialData?.categoria_id ?? '');
  const [provinciaId,   setProvinciaId]   = useState(initialData?.provincia_id ?? '');
  const [ciudadId,      setCiudadId]      = useState(initialData?.ciudad_id ?? '');
  const [direccion1,    setDireccion1]    = useState(initialData?.direccion_1 ?? '');
  const [direccion2,    setDireccion2]    = useState(initialData?.direccion_2 ?? '');
  const [mapsUrl,       setMapsUrl]       = useState(initialData?.google_maps_url ?? '');
  const [descripcion,   setDescripcion]   = useState(initialData?.descripcion ?? '');
  const [telefono,      setTelefono]      = useState(initialData?.telefono ?? '');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const isEditing = !!initialData;

  const ciudadesDisponibles = CIUDADES.filter(c => c.provincia_id === Number(provinciaId));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!nombreNegocio.trim() || !categoriaId || !provinciaId || !ciudadId || !direccion1.trim() || !mapsUrl.trim() || !descripcion.trim() || !telefono.trim()) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    const telefonoLimpio = telefono.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{7,20}$/.test(telefonoLimpio)) {
      setError('El teléfono no es válido. Usa solo números (puede incluir +, espacios o guiones).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/router.php?route=professional/profile/create', {
        nombre_negocio: nombreNegocio.trim(),
        categoria_id: Number(categoriaId),
        provincia_id: Number(provinciaId),
        ciudad_id: Number(ciudadId),
        direccion_1: direccion1.trim(),
        direccion_2: direccion2.trim(),
        google_maps_url: mapsUrl.trim(),
        descripcion: descripcion.trim(),
        telefono: telefono.trim(),
      });
      if (res.data.success) {
        onComplete();
      } else {
        setError(res.data.message || 'Error al guardar el perfil.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto px-5 py-10 pb-16">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-brand-600" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-2xl text-ink">{isEditing ? 'Editar perfil' : 'Completa tu perfil'}</h2>
          <p className="text-sm text-ink/50 mt-2 leading-relaxed max-w-sm mx-auto">
            {isEditing ? 'Actualiza tus datos de categoría y ubicación.' : 'Necesitamos estos datos antes de que puedas crear tus servicios.'}
          </p>
        </div>

        {error && <div className="mb-5"><ErrorNote>{error}</ErrorNote></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del negocio *"
            type="text" required placeholder="Ej: Barbería El Estilo, Salón Bella…"
            value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)}
            maxLength={100}
          />

          <Select label="Categoría *" required value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
            <option value="">Selecciona una categoría…</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Provincia *" required value={provinciaId}
              onChange={e => { setProvinciaId(e.target.value); setCiudadId(''); }}
            >
              <option value="">Provincia…</option>
              {PROVINCIAS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            <Select
              label="Ciudad *" required disabled={!provinciaId} value={ciudadId}
              onChange={e => setCiudadId(e.target.value)}
            >
              <option value="">Ciudad…</option>
              {ciudadesDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </div>

          <Input
            label="Dirección *"
            type="text" required placeholder="Av. Principal 123"
            value={direccion1} onChange={e => setDireccion1(e.target.value)}
          />

          <Input
            label="Referencia" hint="opcional"
            type="text" placeholder="Segundo piso, local 3…"
            value={direccion2} onChange={e => setDireccion2(e.target.value)}
          />

          <Input
            label="Teléfono WhatsApp *" hint="lo verá el cliente para contactarte"
            type="tel" required placeholder="0991234567 o +593 99 123 4567"
            value={telefono} onChange={e => setTelefono(e.target.value)}
            maxLength={20}
          />

          <div>
            <label className="block mb-1.5 text-xs font-semibold text-ink/60 tracking-wide">
              Ubicación en el mapa *
            </label>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-sand rounded-xl text-sm text-left transition-all duration-200 hover:border-brand-400"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <Map size={15} className="text-brand-600" />
              </div>
              <span className={mapsUrl ? 'text-ink truncate' : 'text-ink/35'}>
                {mapsUrl ? 'Ubicación seleccionada — toca para cambiar' : 'Buscar y marcar mi ubicación…'}
              </span>
            </button>
          </div>

          {showMapPicker && (
            <LocationPicker
              initialUrl={mapsUrl}
              onClose={() => setShowMapPicker(false)}
              onConfirm={url => { setMapsUrl(url); setShowMapPicker(false); }}
            />
          )}

          <TextArea
            label="Descripción profesional *"
            required rows={3} placeholder="Cuéntale a tus clientes sobre tu experiencia…"
            value={descripcion} onChange={e => setDescripcion(e.target.value)}
          />

          <div className="flex gap-3 pt-3">
            {isEditing && (
              <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1" loading={loading}>
              {loading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar perfil y continuar'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
