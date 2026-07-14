import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import TurnstileWidget from './TurnstileWidget';
import GoogleSignInButton from './GoogleSignInButton';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Input, ErrorNote } from './ui/Field';

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
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.nombre)}&background=0f766e&color=f7f7f5&size=256`,
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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [googleCredential, setGoogleCredential] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  async function handleGoogleCredential(credential, password) {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const { data } = await api.post('/router.php?route=auth/google', { credential, ...(password ? { password } : {}) });
      if (data.success) {
        const usuario = normalizarUsuario(data.data);
        onLogin(usuario.id_rol === 1 ? 'admin' : 'professional', usuario.id, usuario);
        return;
      }
      if (data.errors?.requires_link) {
        setGoogleCredential(credential);
        setGoogleError(data.message);
      } else {
        setGoogleError(data.message || 'No se pudo acceder con Google.');
      }
    } catch {
      setGoogleError('No se pudo conectar con el servidor.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleProfLogin(e) {
    e.preventDefault();
    setLoginError('');
    setNeedsVerification(false);
    setResendMessage('');
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
        const message = res.data.message || 'Error al iniciar sesión.';
        setLoginError(message);
        setNeedsVerification(message.toLowerCase().includes('verificar'));
      }
    } catch {
      setLoginError('Error de conexión. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification(email) {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setResendMessage('Ingresa tu correo electrónico.');
      return;
    }

    setResendLoading(true);
    setResendMessage('');
    try {
      const { data } = await api.post('/router.php?route=auth/resendVerification', {
        email: targetEmail,
        website,
        turnstile_token: turnstileToken,
      });
      setResendMessage(data.message || (data.success ? 'Correo reenviado correctamente.' : 'No se pudo reenviar el correo.'));
    } catch {
      setResendMessage('No se pudo conectar con el servidor.');
    } finally {
      setResendLoading(false);
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
        website,
        turnstile_token: turnstileToken,
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
    <Modal onClose={onClose} kicker="Área profesional" title="Accede a tu cuenta">

      {/* Pantalla de verificación post-registro */}
      {authView === 'verify' && (
        <div className="text-center py-4 space-y-5 animate-fadeIn">
          <span className="inline-flex w-14 h-14 rounded-full bg-brand-50 text-brand-600 items-center justify-center">
            <Mail size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-display font-semibold text-xl text-ink">Revisa tu correo</p>
            <p className="text-sm text-ink/55 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Tu cuenta fue creada. Haz clic en el enlace de verificación que te enviamos antes de iniciar sesión.
            </p>
          </div>
          <TurnstileWidget onToken={setTurnstileToken} />
          <div className="space-y-3">
            <Button
              variant="secondary" full
              loading={resendLoading}
              onClick={() => handleResendVerification(regEmail)}
            >
              {resendLoading ? 'Reenviando…' : 'Reenviar correo de verificación'}
            </Button>
            {resendMessage && <p className="text-xs text-ink/60">{resendMessage}</p>}
            <Button
              full
              onClick={() => { setAuthView('login'); setLoginError(''); setRegName(''); setRegEmail(''); setRegPassword(''); }}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        </div>
      )}

      {/* Login / Register */}
      {authView !== 'verify' && (
        <>
          {/* Segmented control */}
          <div className="flex bg-cream p-1 mb-5 rounded-full gap-1 text-xs font-semibold">
            <button
              onClick={() => { setAuthView('login'); setLoginError(''); }}
              className={`flex-1 py-2.5 text-center rounded-full transition-all duration-200 ${
                authView === 'login' ? 'bg-white text-ink shadow-soft' : 'text-ink/45 hover:text-ink/70'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setAuthView('register'); setLoginError(''); }}
              className={`flex-1 py-2.5 text-center rounded-full transition-all duration-200 ${
                authView === 'register' ? 'bg-white text-ink shadow-soft' : 'text-ink/45 hover:text-ink/70'
              }`}
            >
              Registrarse
            </button>
          </div>

          {loginError && (
            <div className="mb-4">
              <ErrorNote>
                <p>{loginError}</p>
                {needsVerification && (
                  <>
                    <TurnstileWidget onToken={setTurnstileToken} />
                    <button
                      type="button"
                      disabled={resendLoading}
                      onClick={() => handleResendVerification(loginEmail)}
                      className="mt-2 font-semibold underline underline-offset-2 disabled:opacity-60"
                    >
                      {resendLoading ? 'Reenviando…' : 'Reenviar correo de verificación'}
                    </button>
                  </>
                )}
                {resendMessage && <p className="mt-2 text-ink/60">{resendMessage}</p>}
              </ErrorNote>
            </div>
          )}

          <div className="mb-4">
            <GoogleSignInButton onCredential={credential => handleGoogleCredential(credential)} />
            {googleLoading && <p className="text-xs text-center text-ink/50 mt-2">Conectando con Google…</p>}
            {googleError && <p className="text-xs text-center text-danger-600 mt-2">{googleError}</p>}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px bg-sand flex-1" />
            <span className="text-[11px] text-ink/40">o continúa con correo</span>
            <span className="h-px bg-sand flex-1" />
          </div>

          {googleCredential && (
            <form onSubmit={e => { e.preventDefault(); handleGoogleCredential(googleCredential, googlePassword); }} className="mb-5 bg-brand-50/60 border border-brand-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-ink/65 leading-relaxed">Esta cuenta ya existe. Introduce su contraseña para vincularla con Google.</p>
              <Input type="password" required value={googlePassword} onChange={e => setGooglePassword(e.target.value)} placeholder="Contraseña actual" />
              <Button size="sm" full loading={googleLoading}>Vincular y continuar</Button>
            </form>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleProfLogin} className="space-y-3">
              <Input
                type="email" required placeholder="Correo electrónico" icon={Mail}
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              />
              <Input
                type="password" required placeholder="Contraseña" icon={Lock}
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              />
              <Button type="submit" size="lg" full loading={loading} className="mt-1">
                {loading ? 'Verificando…' : 'Acceder a mi panel'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                name="website"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[10000px] w-px h-px opacity-0"
              />
              <Input
                type="text" required placeholder="Nombre completo"
                value={regName} onChange={e => setRegName(e.target.value)}
              />
              <Input
                type="email" required placeholder="Correo electrónico"
                value={regEmail} onChange={e => setRegEmail(e.target.value)}
              />
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'} required
                  placeholder="Contraseña (mín. 8 car., mayúscula y número)"
                  value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <TurnstileWidget onToken={setTurnstileToken} />
              <Button type="submit" variant="dark" size="lg" full loading={loading} className="mt-1">
                {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
              </Button>
              <p className="text-[11px] text-ink/40 text-center leading-relaxed">
                Al crear una cuenta, aceptas nuestros{' '}
                <span className="underline underline-offset-2 text-ink/60 cursor-pointer">Términos y Política de Privacidad</span>.
              </p>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
