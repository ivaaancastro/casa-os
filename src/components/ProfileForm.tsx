'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    role: string;
  };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  FAMILY: 'Familia',
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? '');
  const [nameMessage, setNameMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setNameMessage('');
    setNameError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setNameError(data.error ?? 'No se pudo guardar el nombre');
      } else {
        setNameMessage('Nombre actualizado');
        router.refresh();
      }
    } catch {
      setNameError('Error de red. Inténtalo de nuevo.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== repeatPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setPasswordError(data.error ?? 'No se pudo cambiar la contraseña');
      } else {
        setPasswordMessage('Contraseña actualizada');
        setCurrentPassword('');
        setNewPassword('');
        setRepeatPassword('');
      }
    } catch {
      setPasswordError('Error de red. Inténtalo de nuevo.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <p className="mb-6 text-[10px] tracking-wider2 text-ash">Datos personales</p>

        <dl className="mb-8 grid grid-cols-1 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="label">Email</dt>
            <dd className="text-sm text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="label">Rol</dt>
            <dd className="text-sm text-ink">{ROLE_LABEL[user.role] ?? user.role}</dd>
          </div>
        </dl>

        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="label">Nombre</label>
            <input
              id="profile-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {nameError && (
            <p role="alert" className="text-sm text-alarm">{nameError}</p>
          )}
          {nameMessage && (
            <p className="text-sm text-ash">{nameMessage}</p>
          )}

          <button type="submit" disabled={savingName} className="btn-primary">
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>
      </section>

      <section className="lg:border-l lg:border-mist lg:pl-10">
        <p className="mb-6 text-[10px] tracking-wider2 text-ash">Cambiar contraseña</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="profile-current" className="label">Contraseña actual</label>
            <input
              id="profile-current"
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="profile-new" className="label">Nueva contraseña</label>
            <input
              id="profile-new"
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="profile-repeat" className="label">Repetir nueva contraseña</label>
            <input
              id="profile-repeat"
              type="password"
              className="input"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {passwordError && (
            <p role="alert" className="text-sm text-alarm">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-sm text-ash">{passwordMessage}</p>
          )}

          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}
