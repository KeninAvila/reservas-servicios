import { useState } from 'react';
import { Check, KeyRound } from 'lucide-react';
import api from '../services/api';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { Input, ErrorNote } from './ui/Field';

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
    <main className="min-h-screen bg-cream text-ink antialiased flex flex-col items-center justify-center p-6 gap-8">
      <Logo size="lg" />
      <section className="w-full max-w-md bg-white rounded-3xl border border-sand shadow-card p-9 animate-scaleIn">
        {success ? (
          <div className="text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-brand-600 text-white items-center justify-center animate-ringPulse">
              <Check size={26} strokeWidth={2.5} />
            </span>
            <p className="caption text-ink/40 mt-6">Cuenta segura</p>
            <h1 className="font-display font-semibold text-2xl text-ink tracking-tight mt-1.5">Contraseña actualizada</h1>
            <p className="text-sm text-ink/55 mt-2.5">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <Button size="lg" full className="mt-7" onClick={() => { window.location.hash = ''; }}>
              Ir al inicio
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex w-14 h-14 rounded-full bg-brand-50 text-brand-600 items-center justify-center">
                <KeyRound size={24} strokeWidth={1.75} />
              </span>
              <h1 className="font-display font-semibold text-2xl text-ink tracking-tight mt-5">Cambiar contraseña</h1>
              <p className="text-sm text-ink/55 leading-relaxed mt-2.5">
                Usa al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-7 space-y-3">
              <Input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña" required
              />
              <Input
                type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)}
                placeholder="Confirmar contraseña" required
              />
              <ErrorNote>{error}</ErrorNote>
              <Button type="submit" size="lg" full loading={loading} className="mt-1">
                {loading ? 'Actualizando…' : 'Cambiar contraseña'}
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
