'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200" role="alert">
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
