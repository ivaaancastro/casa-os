'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return;
    void PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        if (active) setBiometricAvailable(available);
      })
      .catch(() => {
        if (active) setBiometricAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleBiometricLogin() {
    setError('');
    setBiometricLoading(true);
    try {
      const optionsRes = await fetch('/api/auth/login/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });
      if (!optionsRes.ok) throw new Error('No se pudieron obtener opciones');
      const { options } = await optionsRes.json();
      const assertion = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch('/api/auth/login/passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertion }),
      });
      if (!verifyRes.ok) throw new Error('No se pudo verificar');
      const { token } = await verifyRes.json();
      const result = await signIn('webauthn', { token, redirect: false });
      if (result?.error) {
        setError('No se pudo iniciar sesión con Face ID. Inténtalo de nuevo.');
        setBiometricLoading(false);
      } else {
        window.location.assign(callbackUrl);
      }
    } catch {
      setError('No se pudo iniciar sesión con Face ID. Inténtalo de nuevo.');
      setBiometricLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        totp: totp.trim() || undefined,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales o código incorrectos. Inténtalo de nuevo.');
        setLoading(false);
      } else {
        // Navegacion dura a proposito: `router.push` puede adelantarse al
        // Set-Cookie de la sesion y el middleware devuelve al login. Una
        // navegacion completa garantiza que la cookie viaje en la peticion.
        window.location.assign(callbackUrl);
      }
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-alarm/10 text-alarm text-sm px-3 py-2 rounded-xl border border-alarm/30" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <label htmlFor="totp" className="label">
          Código 2FA o de recuperación <span className="text-ash">(opcional)</span>
        </label>
        <input
          id="totp"
          type="text"
          value={totp}
          onChange={(e) => setTotp(e.target.value)}
          className="input"
          placeholder="123456 o ABCD-EFGH"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
        />
        <p className="mt-1 text-xs text-ash">
          Si tienes 2FA activo, introduce el código de tu app o un código de
          recuperación.
        </p>
      </div>

      {biometricAvailable ? (
        <button
          type="button"
          onClick={() => void handleBiometricLogin()}
          disabled={biometricLoading || loading}
          className="btn-primary w-full"
        >
          {biometricLoading ? 'Esperando a Face ID…' : 'Entrar con Face ID / huella'}
        </button>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
