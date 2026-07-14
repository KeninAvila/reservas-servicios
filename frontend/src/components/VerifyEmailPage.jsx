import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import api from '../services/api';

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

  const Icon = status === 'loading' ? Loader2 : status === 'success' ? CheckCircle : XCircle;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <Icon className={`mx-auto mb-4 ${status === 'loading' ? 'animate-spin text-indigo-600' : status === 'success' ? 'text-emerald-500' : 'text-red-500'}`} size={52} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">{status === 'success' ? 'Cuenta confirmada' : status === 'error' ? 'No se pudo confirmar' : 'Confirmando cuenta'}</h1>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        {status !== 'loading' && <button onClick={() => { window.location.hash = ''; }} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold">Ir al inicio</button>}
      </section>
    </main>
  );
}
