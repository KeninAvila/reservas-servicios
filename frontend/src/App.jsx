import { useState } from 'react';
import ClientPanel       from './components/ClientPanel';
import ProfessionalPanel from './components/ProfessionalPanel';
import AdminPanel        from './components/AdminPanel';
import LoginModal        from './components/LoginModal';
import api               from './services/api';

export default function App() {
  const [currentRole,    setCurrentRole]    = useState('client');
  const [loggedInProfId, setLoggedInProfId] = useState(null);
  const [loggedInUser,   setLoggedInUser]   = useState(null);
  const [showLogin,      setShowLogin]      = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg flex flex-col border-x border-slate-200 relative">

        {/* ── Client ── */}
        {currentRole === 'client' && (
          <ClientPanel onOpenLogin={() => setShowLogin(true)} />
        )}

        {/* ── Professional ── */}
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

        {/* ── Admin ── */}
        {currentRole === 'admin' && (
          <AdminPanel onLogout={handleLogout} />
        )}

        {/* Login modal */}
        {showLogin && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}

        {/* Footer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950 text-slate-500 py-1 text-[9px] font-mono tracking-widest text-center uppercase border-t border-slate-900 select-none z-20">
          Plataforma SERVI • Reserva en Tiempo Real
        </div>
      </div>
    </div>
  );
}
