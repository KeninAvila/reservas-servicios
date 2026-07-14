import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import api from '../services/api';

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
  const isEditing = !!initialData;

  const ciudadesDisponibles = CIUDADES.filter(c => c.provincia_id === Number(provinciaId));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!nombreNegocio.trim() || !categoriaId || !provinciaId || !ciudadId || !direccion1.trim() || !mapsUrl.trim() || !descripcion.trim()) {
      setError('Completa todos los campos obligatorios.');
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
    <main className="flex-1 p-5 overflow-y-auto pb-10">
      <div className="text-center mb-5">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <MapPin size={22} className="text-indigo-600" />
        </div>
        <h2 className="font-bold text-slate-900 text-base">{isEditing ? 'Editar perfil' : 'Completa tu perfil'}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {isEditing ? 'Actualiza tus datos de categoría y ubicación.' : 'Necesitamos estos datos antes de que puedas crear tus servicios.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Nombre del negocio *</span>
          <input
            type="text" required placeholder="Ej: Barbería El Estilo, Salón Bella..."
            value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)}
            maxLength={100}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Categoría *</span>
          <select
            required value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">Selecciona una categoría...</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1">Provincia *</span>
            <select
              required value={provinciaId}
              onChange={e => { setProvinciaId(e.target.value); setCiudadId(''); }}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">Provincia...</option>
              {PROVINCIAS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1">Ciudad *</span>
            <select
              required disabled={!provinciaId} value={ciudadId} onChange={e => setCiudadId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Ciudad...</option>
              {ciudadesDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Dirección *</span>
          <input
            type="text" required placeholder="Av. Principal 123"
            value={direccion1} onChange={e => setDireccion1(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Referencia (opcional)</span>
          <input
            type="text" placeholder="Segundo piso, local 3..."
            value={direccion2} onChange={e => setDireccion2(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Teléfono WhatsApp <span className="font-normal text-slate-400">(opcional — lo verá el cliente para contactarte)</span></span>
          <input
            type="tel" placeholder="+593 99 123 4567"
            value={telefono} onChange={e => setTelefono(e.target.value)}
            maxLength={20}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Enlace de Google Maps *</span>
          <input
            type="url" required placeholder="https://maps.google.com/..."
            value={mapsUrl} onChange={e => setMapsUrl(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 block mb-1">Descripción profesional *</span>
          <textarea
            required rows={3} placeholder="Cuéntale a tus clientes sobre tu experiencia..."
            value={descripcion} onChange={e => setDescripcion(e.target.value)}
            className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {isEditing && (
            <button
              type="button" onClick={onCancel}
              className="flex-1 border border-slate-300 text-slate-600 font-bold py-3 rounded-xl text-xs hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm"
          >
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar perfil y continuar'}
          </button>
        </div>
      </form>
    </main>
  );
}
