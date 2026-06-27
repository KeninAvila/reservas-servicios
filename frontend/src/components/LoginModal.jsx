import { useState } from 'react';
import { X, Mail, Lock, Briefcase, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const DEFAULT_HOURS = [
  { day: 'Lunes',     enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Martes',    enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Miércoles', enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Jueves',    enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Viernes',   enabled: true,  start: '09:00', end: '18:00' },
  { day: 'Sábado',    enabled: true,  start: '10:00', end: '14:00' },
  { day: 'Domingo',   enabled: false, start: '09:00', end: '18:00' },
];

function normalizarUsuario(backendUser) {
  const estadoMap = { ACTIVO: 'activo', SUSPENDIDO: 'bloqueado' };
  return {
    ...backendUser,
    status: estadoMap[backendUser.estado] ?? 'activo',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.nombre)}&background=10b981&color=fff&size=128`,
    services: [],
    hours: DEFAULT_HOURS,
  };
}

export default function LoginModal({ onLogin, onClose }) {
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'verify'
  const [loading, setLoading] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleProfLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await api.post('/router.php?route=auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      if (res.data.success) {
        const usuario = normalizarUsuario(res.data.data);
        const rol = usuario.id_rol === 1 ? 'admin' : 'professional';
        onLogin(rol, usuario.id, usuario);
      } else {
        setLoginError(res.data.message || 'Error al iniciar sesión.');
      }
    } catch {
      setLoginError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoginError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setLoginError('Completa todos los campos obligatorios.');
      return;
    }
    if (regPassword.length < 8) {
      setLoginError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(regPassword)) {
      setLoginError('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }
    if (!/[0-9]/.test(regPassword)) {
      setLoginError('La contraseña debe incluir al menos un número.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/router.php?route=auth/register', {
        nombre: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      if (res.data.success) {
        setAuthView('verify');
      } else {
        setLoginError(res.data.message || 'Error al crear la cuenta.');
      }
    } catch {
      setLoginError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl animate-fadeIn max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Briefcase size={15} className="text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">Acceso Profesional</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-4">

          {/* Pantalla de verificación post-registro */}
          {authView === 'verify' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Mail size={26} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Cuenta creada con éxito</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Revisa tu correo electrónico y haz clic en el enlace de verificación antes de iniciar sesión.
                </p>
              </div>
              <button
                onClick={() => { setAuthView('login'); setLoginError(''); setRegName(''); setRegEmail(''); setRegPassword(''); }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-xs transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Login / Register */}
          {authView !== 'verify' && (
            <>
              {/* Sub-tabs */}
              <div className="flex bg-slate-100 p-1 mb-5 rounded-lg gap-1 text-xs font-semibold">
                <button
                  onClick={() => { setAuthView('login'); setLoginError(''); }}
                  className={`flex-1 py-2 text-center rounded-md transition-all ${authView === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => { setAuthView('register'); setLoginError(''); }}
                  className={`flex-1 py-2 text-center rounded-md transition-all ${authView === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  Registrarse
                </button>
              </div>

              {loginError && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">{loginError}</div>
              )}

              {authView === 'login' ? (
                <form onSubmit={handleProfLogin} className="space-y-3">
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email" required placeholder="Correo electrónico"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password" required placeholder="Contraseña"
                      value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-colors"
                    />
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    {loading ? 'Verificando...' : 'Acceder a mi panel'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="text" required placeholder="Nombre completo"
                    value={regName} onChange={e => setRegName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                  <input
                    type="email" required placeholder="Correo electrónico"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} required placeholder="Contraseña (mín. 8 car., mayúscula y número)"
                      value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-slate-950 hover:bg-slate-900 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all"
                  >
                    {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center leading-normal">
                    Al crear una cuenta, aceptas nuestros{' '}
                    <span className="underline font-semibold text-slate-500 cursor-pointer">Términos y Política de Privacidad</span>.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
