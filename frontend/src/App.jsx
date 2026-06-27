import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import ClientPanel       from './components/ClientPanel';
import ProfessionalPanel from './components/ProfessionalPanel';
import AdminPanel        from './components/AdminPanel';
import LoginModal        from './components/LoginModal';
import { INITIAL_CATEGORIES, INITIAL_PROFESSIONALS, INITIAL_BOOKINGS } from './data';

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export default function App() {
  const [categories,    setCategories]    = useState(() => load('servi_categories',    INITIAL_CATEGORIES));
  const [professionals, setProfessionals] = useState(() => load('servi_professionals', INITIAL_PROFESSIONALS));
  const [bookings,      setBookings]      = useState(() => load('servi_bookings',      INITIAL_BOOKINGS));

  const [currentRole,    setCurrentRole]    = useState('client');
  const [loggedInProfId, setLoggedInProfId] = useState(null);
  const [loggedInUser,   setLoggedInUser]   = useState(null);
  const [showLogin,      setShowLogin]      = useState(false);

  useEffect(() => { localStorage.setItem('servi_categories',    JSON.stringify(categories));    }, [categories]);
  useEffect(() => { localStorage.setItem('servi_professionals', JSON.stringify(professionals)); }, [professionals]);
  useEffect(() => { localStorage.setItem('servi_bookings',      JSON.stringify(bookings));      }, [bookings]);

  function handleAddBooking(b) { setBookings(prev => [b, ...prev]); }

  function handleLogin(role, profId, userData) {
    setCurrentRole(role);
    setLoggedInUser(userData ?? null);
    if (role === 'professional') setLoggedInProfId(profId);
    setShowLogin(false);
  }

  function handleLogout() {
    setCurrentRole('client');
    setLoggedInProfId(null);
    setLoggedInUser(null);
  }

  const showLoginBtn = currentRole === 'client';

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased text-slate-800">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg flex flex-col border-x border-slate-200 relative">

        {/* Floating login button — only in client view */}
        {showLoginBtn && (
          <button
            onClick={() => setShowLogin(true)}
            className="absolute top-3 right-4 z-30 flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-all"
          >
            <LogIn size={13} />
            <span>Iniciar sesión</span>
          </button>
        )}

        {/* ── Client ── */}
        {currentRole === 'client' && (
          <ClientPanel
            professionals={professionals}
            categories={categories}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onOpenLogin={() => setShowLogin(true)}
          />
        )}

        {/* ── Professional ── */}
        {currentRole === 'professional' && (loggedInProfId || loggedInUser) && (
          <ProfessionalPanel
            professionals={professionals}
            bookings={bookings}
            activeProfId={loggedInProfId}
            loggedInUser={loggedInUser}
            onUpdateProfessionals={setProfessionals}
            onUpdateBookings={setBookings}
            onLogout={handleLogout}
          />
        )}

        {/* ── Admin ── */}
        {currentRole === 'admin' && (
          <AdminPanel
            professionals={professionals}
            bookings={bookings}
            categories={categories}
            onUpdateProfessionals={setProfessionals}
            onUpdateBookings={setBookings}
            onUpdateCategories={setCategories}
            onLogout={handleLogout}
          />
        )}

        {/* Login modal */}
        {showLogin && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}

        {/* Footer bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-950 text-slate-500 py-1 text-[9px] font-mono tracking-widest text-center uppercase border-t border-slate-900 select-none z-20">
          Plataforma SERVI • Reserva en Tiempo Real
        </div>
      </div>
    </div>
  );
}
