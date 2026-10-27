'use client';

import { useCallback, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

interface AuthEvent {
  id: string;
  action: string;
  ipHash: string | null;
  createdAt: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
  confirmedAt: string | null;
  events: AuthEvent[];
}

interface SetupData {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

type Mode = 'idle' | 'setup' | 'codes' | 'disable' | 'regenerate';

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Inicio de sesión correcto',
  LOGIN_FAILED: 'Intento de acceso fallido',
  TOTP_FAILED: 'Código 2FA incorrecto',
  RATE_LIMITED: 'Demasiados intentos',
  '2FA_SETUP': 'Configuración de 2FA iniciada',
  '2FA_ENABLED': '2FA activado',
  '2FA_DISABLED': '2FA desactivado',
  '2FA_RESET': '2FA restablecido por un administrador',
  RECOVERY_CODE_USED: 'Código de recuperación usado',
  RECOVERY_CODES_REGENERATED: 'Códigos de recuperación regenerados',
  PASSWORD_CHANGED: 'Contraseña cambiada',
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SecuritySection() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [setup, setSetup] = useState<SetupData | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [signOutAfterCodes, setSignOutAfterCodes] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/2fa/status', { cache: 'no-store' });
      if (!res.ok) {
        setError('No se pudo cargar el estado de 2FA');
        return;
      }
      const data = (await res.json()) as TwoFactorStatus;
      setStatus(data);
    } catch {
      setError('Error de red al cargar el estado de 2FA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  function resetMessages() {
    setError('');
    setNotice('');
  }

  function startSetup() {
    resetMessages();
    setMode('setup');
    setBusy(true);
    setSetup(null);
    setSetupCode('');
    void (async () => {
      try {
        const res = await fetch('/api/2fa/setup', { method: 'POST' });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          secret?: string;
          otpauth?: string;
          qrDataUrl?: string;
        };
        if (!res.ok || !data.secret || !data.otpauth || !data.qrDataUrl) {
          setError(data.error ?? 'No se pudo iniciar la configuración');
          setMode('idle');
          return;
        }
        setSetup({
          secret: data.secret,
          otpauth: data.otpauth,
          qrDataUrl: data.qrDataUrl,
        });
      } catch {
        setError('Error de red. Inténtalo de nuevo.');
        setMode('idle');
      } finally {
        setBusy(false);
      }
    })();
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const res = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        recoveryCodes?: string[];
      };
      if (!res.ok || !data.recoveryCodes) {
        setError(data.error ?? 'No se pudo activar 2FA');
        return;
      }
      setRecoveryCodes(data.recoveryCodes);
      setSignOutAfterCodes(true);
      setMode('codes');
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const res = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo desactivar 2FA');
        return;
      }
      await signOut({ callbackUrl: '/auth/login?2fa=desactivado' });
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmRegenerate(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      const res = await fetch('/api/2fa/recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        recoveryCodes?: string[];
      };
      if (!res.ok || !data.recoveryCodes) {
        setError(data.error ?? 'No se pudieron regenerar los códigos');
        return;
      }
      setRecoveryCodes(data.recoveryCodes);
      setSignOutAfterCodes(false);
      setMode('codes');
      setStatus((current) =>
        current
          ? { ...current, recoveryCodesRemaining: data.recoveryCodes!.length }
          : current,
      );
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setNotice('Códigos copiados al portapapeles');
    } catch {
      setError('No se pudieron copiar los códigos');
    }
  }

  function downloadCodes() {
    const blob = new Blob(
      [
        'casa-os — códigos de recuperación 2FA\n\n',
        ...recoveryCodes.map((item, index) => `${index + 1}. ${item}\n`),
        '\nGuarda este archivo en un lugar seguro. Cada código solo se puede usar una vez.\n',
      ],
      { type: 'text/plain;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'casa-os-codigos-recuperacion.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  function finishCodes() {
    if (signOutAfterCodes) {
      void signOut({ callbackUrl: '/auth/login?2fa=activado' });
      return;
    }
    setRecoveryCodes([]);
    setMode('idle');
    setNotice('Códigos regenerados. Los anteriores ya no funcionan.');
    void refreshStatus();
  }

  function cancelForm() {
    setMode('idle');
    setPassword('');
    setCode('');
    resetMessages();
  }

  if (loading) {
    return (
      <div className="card">
        <p className="text-sm text-ash">Cargando seguridad…</p>
      </div>
    );
  }

  if (mode === 'codes') {
    return (
      <div className="card space-y-5">
        <div>
          <p className="mb-2 text-[10px] tracking-wider2 text-ash">
            Códigos de recuperación
          </p>
          <h3 className="font-display text-2xl tracking-editorial">
            Guárdalos ahora
          </h3>
          <p className="mt-2 text-sm text-ash">
            No volverán a mostrarse. Cada código sirve una sola vez si pierdes
            el acceso a tu app autenticadora.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recoveryCodes.map((item) => (
            <li
              key={item}
              className="border border-mist bg-pearl px-3 py-2 font-mono text-sm tracking-wider text-ink"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={copyCodes}>
            Copiar códigos
          </button>
          <button type="button" className="btn-secondary" onClick={downloadCodes}>
            Descargar .txt
          </button>
        </div>

        {notice && (
          <p role="status" className="text-sm text-ash">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-alarm">
            {error}
          </p>
        )}

        <button type="button" className="btn-primary" onClick={finishCodes}>
          {signOutAfterCodes
            ? 'He guardado los códigos; cerrar sesión'
            : 'He guardado los códigos'}
        </button>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="card space-y-5">
        <div>
          <p className="mb-2 text-[10px] tracking-wider2 text-ash">
            Activar 2FA
          </p>
          <h3 className="font-display text-2xl tracking-editorial">
            Escanea el código
          </h3>
          <p className="mt-2 text-sm text-ash">
            Usa Google Authenticator, 1Password, Apple Passwords o cualquier app
            TOTP. Después introduce el código de 6 dígitos.
          </p>
        </div>

        {busy && !setup ? (
          <p className="text-sm text-ash">Generando código…</p>
        ) : setup ? (
          <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-start">
            <div className="border border-mist bg-pearl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qrDataUrl}
                alt="Código QR para configurar 2FA"
                className="mx-auto h-auto w-full max-w-[280px]"
                width={280}
                height={280}
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="label">Clave manual</p>
                <code className="block break-all border border-mist bg-pearl px-3 py-2 font-mono text-sm">
                  {setup.secret}
                </code>
                <p className="mt-2 text-xs text-ash">
                  Si no puedes escanear el QR, introduce esta clave en tu app.
                </p>
              </div>

              <form onSubmit={confirmSetup} className="space-y-3">
                <div>
                  <label htmlFor="setup-code" className="label">
                    Código de 6 dígitos
                  </label>
                  <input
                    id="setup-code"
                    className="input"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    placeholder="123456"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-alarm">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? 'Activando…' : 'Activar 2FA'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-ash transition-colors hover:text-ink"
                    onClick={cancelForm}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (mode === 'disable' || mode === 'regenerate') {
    const isDisable = mode === 'disable';
    return (
      <div className="card space-y-5">
        <div>
          <p className="mb-2 text-[10px] tracking-wider2 text-ash">
            {isDisable ? 'Desactivar 2FA' : 'Regenerar códigos'}
          </p>
          <h3 className="font-display text-2xl tracking-editorial">
            {isDisable ? 'Confirma que eres tú' : 'Crea códigos nuevos'}
          </h3>
          <p className="mt-2 text-sm text-ash">
            {isDisable
              ? 'Si desactivas 2FA, tu cuenta quedará protegida solo por la contraseña.'
              : 'Los códigos anteriores dejarán de funcionar inmediatamente.'}
          </p>
        </div>

        <form
          onSubmit={isDisable ? confirmDisable : confirmRegenerate}
          className="max-w-md space-y-4"
        >
          <div>
            <label htmlFor="security-password" className="label">
              Contraseña actual
            </label>
            <input
              id="security-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label htmlFor="security-code" className="label">
              {isDisable
                ? 'Código 2FA o de recuperación'
                : 'Código de 6 dígitos'}
            </label>
            <input
              id="security-code"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              inputMode={isDisable ? 'text' : 'numeric'}
              maxLength={40}
              required
              placeholder={isDisable ? '123456 o ABCD-EFGH' : '123456'}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-alarm">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className={isDisable ? 'btn-danger' : 'btn-primary'}
              disabled={busy}
            >
              {busy
                ? 'Comprobando…'
                : isDisable
                  ? 'Desactivar 2FA'
                  : 'Regenerar códigos'}
            </button>
            <button
              type="button"
              className="text-xs text-ash transition-colors hover:text-ink"
              onClick={cancelForm}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-[10px] tracking-wider2 text-ash">Seguridad</p>
            <h2 className="font-display text-2xl tracking-editorial">
              Autenticación en dos pasos
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ash">
              Protege el acceso a tus cuentas con un código de tu móvil. Es
              obligatorio para entrar en la futura sección Cuentas.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center border px-3 py-1 text-[10px] tracking-wider2 ${
              status?.enabled
                ? 'border-ink bg-ink text-canvas'
                : 'border-mist bg-pearl text-ash'
            }`}
          >
            {status?.enabled ? 'ACTIVADO' : 'DESACTIVADO'}
          </span>
        </div>

        <div className="mt-6 border-t border-mist pt-5">
          {status?.enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-ink">
                Códigos de recuperación restantes:{' '}
                <strong>{status.recoveryCodesRemaining}</strong>
              </p>
              {status.recoveryCodesRemaining <= 2 && (
                <p className="text-sm text-alarm">
                  Quedan pocos códigos. Regenera un juego nuevo.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    resetMessages();
                    setMode('regenerate');
                    setPassword('');
                    setCode('');
                  }}
                >
                  Regenerar códigos
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    resetMessages();
                    setMode('disable');
                    setPassword('');
                    setCode('');
                  }}
                >
                  Desactivar 2FA
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-ash">
                Todavía no está activo. Al activarlo, se cerrará tu sesión y
                tendrás que entrar de nuevo con el código.
              </p>
              <button type="button" className="btn-primary" onClick={startSetup}>
                Activar 2FA
              </button>
            </div>
          )}
        </div>

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
      </div>

      <div className="card">
        <p className="mb-4 text-[10px] tracking-wider2 text-ash">
          Últimos eventos de seguridad
        </p>
        {status?.events.length ? (
          <ul className="divide-y divide-mist border-t border-mist">
            {status.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-ink">
                  {ACTION_LABELS[event.action] ?? event.action}
                </span>
                <span className="text-xs text-ash">
                  {formatDate(event.createdAt)}
                  {event.ipHash ? ` · IP ${event.ipHash}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ash">Todavía no hay eventos.</p>
        )}
      </div>
    </div>
  );
}
