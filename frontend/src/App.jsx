import { useState, useEffect } from 'react';
import ClientPanel       from './components/ClientPanel';
import ProfessionalPanel from './components/ProfessionalPanel';
import AdminPanel        from './components/AdminPanel';
import LoginModal        from './components/LoginModal';
import TrackingPage      from './components/TrackingPage';
import VerifyEmailPage   from './components/VerifyEmailPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import api               from './services/api';

function parseHash(hash) {
  const verify = hash.match(/^#\/verificar\?token=([^&]+)$/);
  if (verify) return { type: 'verify', token: decodeURIComponent(verify[1]) };
  const reset = hash.match(/^#\/cambiar-contrasena\?token=([^&]+)$/);
  if (reset) return { type: 'reset-password', token: decodeURIComponent(reset[1]) };
  const prof = hash.match(/^#\/p\/(\d+)$/);
  if (prof) return { type: 'profile', id: Number(prof[1]) };
  const cita = hash.match(/^#\/cita\/([a-f0-9-]+)$/i);
  if (cita) return { type: 'tracking', uuid: cita[1] };
  return null;
}

export default function App() {
  const [currentRole,    setCurrentRole]    = useState('client');
  const [loggedInProfId, setLoggedInProfId] = useState(null);
  const [loggedInUser,   setLoggedInUser]   = useState(null);
  const [showLogin,      setShowLogin]      = useState(false);
  const [hashRoute,      setHashRoute]      = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setHashRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function handleLogin(role, profId, userData) {
    setCurrentRole(role);
    setLoggedInUser(userData ?? null);
    if (role === 'professional') setLoggedInProfId(profId);
    setShowLogin(false);
  }

  async function handleLogout() {
    if (loggedInUser) {
      try { await api.post('/router.php?route=auth/logout'); } catch { /* no-op */ }
    }
    setCurrentRole('client');
    setLoggedInProfId(null);
    setLoggedInUser(null);
  }

  // #/cita/:uuid — tracking page (standalone, no app chrome)
  if (hashRoute?.type === 'tracking') {
    return <TrackingPage uuid={hashRoute.uuid} />;
  }

  if (hashRoute?.type === 'verify') {
    return <VerifyEmailPage token={hashRoute.token} />;
  }

  if (hashRoute?.type === 'reset-password') {
    return <ResetPasswordPage token={hashRoute.token} />;
  }

  // All other routes share the same app shell
  return (
    <div className="min-h-screen bg-cream text-ink antialiased flex flex-col">

      {/* Client panel — also handles #/p/:id deep links via initialProfId */}
      {currentRole === 'client' && (
        <ClientPanel
          onOpenLogin={() => setShowLogin(true)}
          initialProfId={hashRoute?.type === 'profile' ? hashRoute.id : null}
        />
      )}

      {currentRole === 'professional' && (loggedInProfId || loggedInUser) && (
        <ProfessionalPanel
          professionals={[]}
          bookings={[]}
          activeProfId={loggedInProfId}
          loggedInUser={loggedInUser}
          onUpdateProfessionals={() => {}}
          onUpdateBookings={() => {}}
          onLogout={handleLogout}
        />
      )}

      {currentRole === 'admin' && (
        <AdminPanel onLogout={handleLogout} />
      )}

      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

    </div>
  );
}
