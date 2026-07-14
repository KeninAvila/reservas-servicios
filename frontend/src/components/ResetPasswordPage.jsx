import { useState } from 'react';
import { CheckCircle, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function ResetPasswordPage({ token }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/router.php?route=auth/resetPassword', {
        token,
        password,
        confirmPassword: confirmation,
      });
      if (!data.success) {
        setError(data.message || 'No se pudo cambiar la contraseña.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {success ? (
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 text-emerald-500" size={52} />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Contraseña actualizada</h1>
            <p className="text-sm text-slate-600 mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={() => { window.location.hash = ''; }} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold">Ir al inicio</button>
          </div>
        ) : (
          <>
            <KeyRound className="mx-auto mb-4 text-indigo-600" size={48} />
            <h1 className="text-xl font-bold text-center text-slate-900 mb-2">Cambiar contraseña</h1>
            <p className="text-sm text-center text-slate-500 mb-6">Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva contraseña" required className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Confirmar contraseña" required className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 disabled:opacity-60 text-white font-bold">{loading ? 'Actualizando...' : 'Cambiar contraseña'}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
