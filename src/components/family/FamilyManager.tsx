'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

interface FamilyManagerProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_OPTIONS = ['FAMILY', 'ADMIN'] as const;
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  FAMILY: 'Familia',
};

interface MemberFormData {
  name: string;
  email?: string;
  role: string;
  password?: string;
  active?: boolean;
}

export function FamilyManager({ members, currentUserId, currentUserRole }: FamilyManagerProps) {
  const router = useRouter();
  const isAdmin = currentUserRole === 'ADMIN';
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function request(url: string, method: string, body: unknown): Promise<boolean> {
    setPending(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo completar la operación');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
      return false;
    } finally {
      setPending(false);
    }
  }

  async function handleCreate(data: MemberFormData): Promise<boolean> {
    const ok = await request('/api/users', 'POST', data);
    if (ok) {
      setCreating(false);
      setEditingId(null);
    }
    return ok;
  }

  async function handleEdit(id: string, data: MemberFormData): Promise<boolean> {
    const payload: MemberFormData = { name: data.name, role: data.role, active: data.active };
    if (data.password) payload.password = data.password;
    const ok = await request(`/api/users/${id}`, 'PATCH', payload);
    if (ok) setEditingId(null);
    return ok;
  }

  async function handleToggleActive(member: Member): Promise<void> {
    await request(`/api/users/${member.id}`, 'PATCH', { active: !member.active });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="border border-alarm px-4 py-3 text-sm text-alarm">
          {error}
        </p>
      )}

      {isAdmin && !creating && (
        <button type="button" className="btn-secondary" onClick={() => { setCreating(true); setEditingId(null); setError(''); }}>
          Añadir miembro
        </button>
      )}

      {isAdmin && creating && (
        <div className="card">
          <p className="mb-4 text-[10px] tracking-wider2 text-ash">Nuevo miembro</p>
          <MemberForm
            mode="create"
            pending={pending}
            onCancel={() => setCreating(false)}
            onSubmit={handleCreate}
          />
        </div>
      )}

      <ul className="border-t border-mist">
        {members.map((member) => {
          const isEditing = editingId === member.id;
          return (
            <li key={member.id} className="border-b border-mist">
              <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="truncate text-sm text-ink">
                      {member.name || 'Sin nombre'}
                      {member.id === currentUserId && <span className="ml-2 text-[10px] tracking-wider2 text-ash">TÚ</span>}
                    </span>
                    {!member.active && (
                      <span className="text-[10px] tracking-wider2 text-alarm">INACTIVO</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ash">{member.email}</p>
                </div>

                <div className="flex items-center gap-3 md:justify-end">
                  <span className="text-[10px] tracking-wider2 text-ash">
                    {ROLE_LABEL[member.role] ?? member.role}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-ash transition-colors hover:text-ink"
                        onClick={() => { setEditingId(isEditing ? null : member.id); setCreating(false); setError(''); }}
                      >
                        {isEditing ? 'Cerrar' : 'Editar'}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className="text-xs text-ash transition-colors hover:text-ink disabled:opacity-40"
                        onClick={() => handleToggleActive(member)}
                      >
                        {member.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && isEditing && (
                <div className="pb-5">
                  <MemberForm
                    mode="edit"
                    member={member}
                    pending={pending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(data) => handleEdit(member.id, data)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface MemberFormProps {
  mode: 'create' | 'edit';
  member?: Member;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (data: MemberFormData) => Promise<boolean>;
}

function MemberForm({ mode, member, pending, onCancel, onSubmit }: MemberFormProps) {
  const ids = useId();
  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [role, setRole] = useState(member?.role ?? 'FAMILY');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(member?.active ?? true);

  const isEdit = mode === 'edit';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name,
      email: isEdit ? undefined : email,
      role,
      password: password || undefined,
      active: isEdit ? active : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className="label">Nombre</label>
          <input
            id={`${ids}-name`}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        {!isEdit && (
          <div>
            <label htmlFor={`${ids}-email`} className="label">Email</label>
            <input
              id={`${ids}-email`}
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <label htmlFor={`${ids}-role`} className="label">Rol</label>
          <select
            id={`${ids}-role`}
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${ids}-password`} className="label">
            {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
          </label>
          <input
            id={`${ids}-password`}
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            minLength={8}
            autoComplete="new-password"
            placeholder={isEdit ? 'Dejar vacío para no cambiar' : undefined}
          />
        </div>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Cuenta activa
        </label>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {isEdit ? 'Guardar cambios' : 'Crear miembro'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-ash transition-colors hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
