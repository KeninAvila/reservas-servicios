import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '10515267213-a1np60l7ie2vaji2pgvp39mokh5tis5c.apps.googleusercontent.com';

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);
  const rendered = useRef(false);

  useEffect(() => {
    const renderButton = () => {
      if (!window.google || !buttonRef.current || rendered.current) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: response => onCredential(response.credential) });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es', width: 320,
      });
      rendered.current = true;
    };

    if (window.google) {
      renderButton();
      return;
    }
    let script = document.querySelector('script[data-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client?hl=es';
      script.async = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderButton);
    return () => script.removeEventListener('load', renderButton);
  }, [onCredential]);

  return <div ref={buttonRef} className="flex justify-center min-h-10" />;
}
