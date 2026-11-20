'use client';

import { useId, useState } from 'react';
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from '@/lib/utils/device';
import { BottomSheet } from './BottomSheet';
import type { DeviceFormData, DeviceItem, DeviceOwnerOption } from './types';

interface DeviceFormProps {
  mode: 'create' | 'edit';
  device?: DeviceItem;
  owners: DeviceOwnerOption[];
  pending: boolean;
  mobile?: boolean;
  onCancel: () => void;
  onSubmit: (data: DeviceFormData) => Promise<boolean>;
}

/** El mismo formulario de siempre; en móvil se presenta como hoja inferior. */
export function DeviceForm({
  mode,
  device,
  owners,
  pending,
  mobile = false,
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

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <p role="alert" className="border border-alarm px-4 py-3 text-xs text-alarm">
          {localError}
        </p>
      )}

      <div className={mobile ? 'grid grid-cols-1 gap-4' : 'grid gap-4 md:grid-cols-2'}>
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

        <div className={mobile ? '' : 'md:col-span-2'}>
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

      <div
        className={
          mobile
            ? 'panel-actions flex flex-wrap gap-3 border-t border-mist pt-4'
            : 'flex flex-wrap gap-3'
        }
      >
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

  if (mobile) {
    return (
      <BottomSheet
        eyebrow="Dispositivos"
        title={isEdit ? 'Editar dispositivo' : 'Nuevo dispositivo'}
        onClose={onCancel}
      >
        {form}
      </BottomSheet>
    );
  }

  return form;
}
