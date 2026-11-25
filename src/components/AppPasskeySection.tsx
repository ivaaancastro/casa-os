'use client';

import { startRegistration } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';

interface Passkey {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export function AppPasskeySection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [supported, setSupported] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/passkeys');
      if (!res.ok) throw new Error('No se pudo cargar');
      const data = (await res.json()) as { passkeys: Passkey[] };
      setPasskeys(data.passkeys);
    } catch {
      setError('No se pudo cargar la lista de Face ID.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      void PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          if (active) setSupported(available);
        })
        .catch(() => {
          if (active) setSupported(false);
        });
    }
    void refresh();
    return () => {
      active = false;
    };
  }, []);

  async function register() {
    setError('');
    setNotice('');
    setRegistering(true);
    try {
      const optRes = await fetch('/api/auth/passkeys/options', { method: 'POST' });
      if (!optRes.ok) throw new Error('No se pudieron obtener opciones');
      const { options } = await optRes.json();
      const response = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch('/api/auth/passkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (!verifyRes.ok) throw new Error('No se pudo registrar');
      setNotice('Face ID registrado. Ya puedes entrar con biometría.');
      await refresh();
    } catch {
      setError('No se pudo registrar Face ID en este dispositivo.');
    } finally {
      setRegistering(false);
    }
  }

  async function remove(id: string) {
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/auth/passkeys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo borrar');
      setNotice('Passkey borrada.');
      await refresh();
    } catch {
      setError('No se pudo borrar la passkey.');
    }
  }

  return (
    <div className="card">
      <p className="mb-2 text-[10px] tracking-wider2 text-ash">Acceso</p>
      <h2 className="font-display text-2xl tracking-editorial">
        Entrar con Face ID / huella
      </h2>
      <p className="mt-2 max-w-xl text-sm text-ash">
        Registra este dispositivo para entrar a casa-os sin contraseña. La
        verificación biométrica sustituye al 2FA.
      </p>

      {!supported ? (
        <p className="mt-4 text-sm text-ash">
          Este navegador no ofrece autenticador biométrico de plataforma.
        </p>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void register()}
            disabled={registering}
            className="btn-primary"
          >
            {registering ? 'Registrando…' : 'Registrar Face ID / huella'}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-alarm">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-ash">
          {notice}
        </p>
      )}

      <div className="mt-6 border-t border-mist/60 pt-5">
        {loading ? (
          <p className="text-sm text-ash">Cargando…</p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-ash">Todavía no hay passkeys registradas.</p>
        ) : (
          <ul className="divide-y divide-mist">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-ink">
                  Passkey · {new Date(passkey.createdAt).toLocaleDateString('es-ES')}
                </span>
                <button
                  type="button"
                  onClick={() => void remove(passkey.id)}
                  className="text-xs text-alarm underline"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}