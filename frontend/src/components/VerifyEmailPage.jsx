import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import api from '../services/api';
import Logo from './ui/Logo';
import Button from './ui/Button';

export default function VerifyEmailPage({ token }) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    api.get(`/router.php?route=auth/verify&token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        setStatus(data.success ? 'success' : 'error');
        setMessage(data.message || 'No se pudo verificar la cuenta.');
      })
      .catch(() => {
        setStatus('error');
        setMessage('No se pudo conectar con el servidor.');
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-cream text-ink antialiased flex flex-col items-center justify-center p-6 gap-8">
      <Logo size="lg" />
      <section className="w-full max-w-md bg-white rounded-3xl border border-sand shadow-card p-9 text-center animate-scaleIn">
        {status === 'loading' && (
          <Loader2 size={38} strokeWidth={1.75} className="mx-auto animate-spin text-brand-600" />
        )}
        {status === 'success' && (
          <span className="inline-flex w-14 h-14 rounded-full bg-brand-600 text-white items-center justify-center animate-ringPulse">
            <Check size={26} strokeWidth={2.5} />
          </span>
        )}
        {status === 'error' && (
          <span className="inline-flex w-14 h-14 rounded-full bg-danger-50 text-danger-600 items-center justify-center">
            <X size={24} strokeWidth={2} />
          </span>
        )}

        <p className="caption text-ink/40 mt-6">Verificación de cuenta</p>
        <h1 className="font-display font-semibold text-2xl text-ink tracking-tight mt-1.5">
          {status === 'success' ? 'Cuenta confirmada' : status === 'error' ? 'No se pudo confirmar' : 'Confirmando cuenta'}
        </h1>
        <p className="text-sm text-ink/55 leading-relaxed mt-2.5">{message}</p>

        {status !== 'loading' && (
          <Button size="lg" full className="mt-7" onClick={() => { window.location.hash = ''; }}>
            Ir al inicio
          </Button>
        )}
      </section>
    </main>
  );
}
