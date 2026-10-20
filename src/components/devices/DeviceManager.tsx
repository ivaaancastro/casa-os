'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  type DeviceType,
} from '@/lib/utils/device';

export interface DeviceOwner {
  id: string;
  name: string | null;
}

export interface DeviceItem {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
  type: string;
  status: string;
  notes: string | null;
  owner: DeviceOwner | null;
}

export interface DeviceOwnerOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface DeviceManagerProps {
  devices: DeviceItem[];
  owners: DeviceOwnerOption[];
  currentUserRole: string;
}

interface DeviceFormData {
  name: string;
  ip: string;
  mac: string | null;
  type: string;
  ownerId: string | null;
  notes: string | null;
}

export function DeviceManager({
  devices,
  owners,
  currentUserRole,
}: DeviceManagerProps) {
  const router = useRouter();
  const isAdmin = currentUserRole === 'ADMIN';

  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function request(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<boolean> {
    setPending(true);
    setError('');

    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
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

  async function handleCreate(data: DeviceFormData): Promise<boolean> {
    const ok = await request('/api/devices', 'POST', data);
    if (ok) {
      setCreating(false);
      setEditingId(null);
    }
    return ok;
  }

  async function handleEdit(id: string, data: DeviceFormData): Promise<boolean> {
    const ok = await request(`/api/devices/${id}`, 'PATCH', data);
    if (ok) setEditingId(null);
    return ok;
  }

  async function handleDelete(id: string): Promise<void> {
    const ok = await request(`/api/devices/${id}`, 'DELETE');
    if (ok) setConfirmingId(null);
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="border border-alarm px-4 py-3 text-sm text-alarm">
          {error}
        </p>
      )}

      {!isAdmin && (
        <p className="text-xs text-ash">
          Solo los administradores pueden editar el inventario.
        </p>
      )}

      {isAdmin && !creating && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
            setConfirmingId(null);
            setError('');
          }}
        >
          Añadir dispositivo
        </button>
      )}

      {isAdmin && creating && (
        <div className="card">
          <p className="mb-4 text-[10px] tracking-wider2 text-ash">
            Nuevo dispositivo
          </p>
          <DeviceForm
            mode="create"
            owners={owners}
            pending={pending}
            onCancel={() => {
              setCreating(false);
              setError('');
            }}
            onSubmit={handleCreate}
          />
        </div>
      )}

      {devices.length === 0 && !creating && (
        <div className="border border-mist p-6">
          <p className="text-sm text-ash">Todavía no hay dispositivos.</p>
        </div>
      )}

      {devices.length > 0 && (
        <ul className="border-t border-mist">
          {devices.map((device) => {
            const isEditing = editingId === device.id;
            const isConfirming = confirmingId === device.id;
            const typeLabel =
              DEVICE_TYPE_LABELS[device.type as DeviceType] ?? device.type;

            return (
              <li key={device.id} className="border-b border-mist">
                <div className="py-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-base text-ink">{device.name}</span>
                        <span className="text-[10px] tracking-wider2 text-ash">
                          {typeLabel}
                        </span>
                        <span
                          className={`text-[10px] tracking-wider2 ${
                            device.status === 'En línea'
                              ? 'text-ink'
                              : 'text-ash'
                          }`}
                        >
                          {device.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ash">
                        <span>IP · {device.ip}</span>
                        <span>MAC · {device.mac ?? '—'}</span>
                        <span>
                          Propietario · {device.owner?.name ?? 'Sin asignar'}
                        </span>
                      </div>

                      {device.notes && (
                        <p className="mt-2 max-w-2xl text-xs text-ash">
                          {device.notes}
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          className="text-xs text-ash transition-colors hover:text-ink"
                          onClick={() => {
                            setEditingId(isEditing ? null : device.id);
                            setCreating(false);
                            setConfirmingId(null);
                            setError('');
                          }}
                        >
                          {isEditing ? 'Cerrar' : 'Editar'}
                        </button>

                        {isConfirming ? (
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-ash">¿Eliminar?</span>
                            <button
                              type="button"
                              disabled={pending}
                              className="text-xs text-alarm transition-opacity hover:opacity-70 disabled:opacity-40"
                              onClick={() => handleDelete(device.id)}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              className="text-xs text-ash transition-colors hover:text-ink"
                              onClick={() => setConfirmingId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-ash transition-colors hover:text-alarm"
                            onClick={() => {
                              setConfirmingId(device.id);
                              setEditingId(null);
                              setError('');
                            }}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isAdmin && isEditing && (
                    <div className="mt-5">
                      <DeviceForm
                        key={device.id}
                        mode="edit"
                        device={device}
                        owners={owners}
                        pending={pending}
                        onCancel={() => {
                          setEditingId(null);
                          setError('');
                        }}
                        onSubmit={(data) => handleEdit(device.id, data)}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface DeviceFormProps {
  mode: 'create' | 'edit';
  device?: DeviceItem;
  owners: DeviceOwnerOption[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (data: DeviceFormData) => Promise<boolean>;
}

function DeviceForm({
  mode,
  device,
  owners,
  pending,
  onCancel,
  onSubmit,
}: DeviceFormProps) {
  const ids = useId();
  const [name, setName] = useState(device?.name ?? '');
  const [ip, setIp] = useState(device?.ip ?? '');
  const [mac, setMac] = useState(device?.mac ?? '');
  const [type, setType] = useState(device?.type ?? 'OTHER');
  const [ownerId, setOwnerId] = useState(device?.owner?.id ?? '');
  const [notes, setNotes] = useState(device?.notes ?? '');
  const [localError, setLocalError] = useState('');

  const isEdit = mode === 'edit';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError('');

    if (!name.trim()) {
      setLocalError('El nombre es obligatorio');
      return;
    }

    if (!ip.trim()) {
      setLocalError('La IP es obligatoria');
      return;
    }

    await onSubmit({
      name: name.trim(),
      ip: ip.trim(),
      mac: mac.trim() ? mac.trim() : null,
      type,
      ownerId: ownerId || null,
      notes: notes.trim() ? notes.trim() : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <p role="alert" className="border border-alarm px-4 py-3 text-xs text-alarm">
          {localError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className="label">
            Nombre
          </label>
          <input
            id={`${ids}-name`}
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={`${ids}-ip`} className="label">
            IP
          </label>
          <input
            id={`${ids}-ip`}
            className="input"
            value={ip}
            onChange={(event) => setIp(event.target.value)}
            placeholder="192.168.1.10"
            inputMode="decimal"
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={`${ids}-mac`} className="label">
            MAC <span className="text-ash">(opcional)</span>
          </label>
          <input
            id={`${ids}-mac`}
            className="input"
            value={mac}
            onChange={(event) => setMac(event.target.value)}
            placeholder="AA:BB:CC:DD:EE:FF"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor={`${ids}-type`} className="label">
            Tipo
          </label>
          <select
            id={`${ids}-type`}
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {DEVICE_TYPES.map((deviceType) => (
              <option key={deviceType} value={deviceType}>
                {DEVICE_TYPE_LABELS[deviceType]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${ids}-owner`} className="label">
            Propietario
          </label>
          <select
            id={`${ids}-owner`}
            className="input"
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
          >
            <option value="">Sin asignar</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name ?? owner.email ?? 'Sin nombre'}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`${ids}-notes`} className="label">
            Notas <span className="text-ash">(opcional)</span>
          </label>
          <textarea
            id={`${ids}-notes`}
            className="input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Añadir'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
