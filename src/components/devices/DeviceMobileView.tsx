'use client';

import { DEVICE_TYPE_LABELS, type DeviceType } from '@/lib/utils/device';
import type { DeviceViewProps } from './types';

/** Lista de tarjetas para móvil; las hojas y el FAB los monta DeviceLayout. */
export function DeviceMobileView({
  devices,
  isAdmin,
  pending,
  editingId,
  confirmingId,
  onToggleEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: DeviceViewProps) {
  return (
    <div className="pb-28" data-testid="devices-mobile-list">
      {!isAdmin && (
        <p
          role="status"
          className="mb-4 flex min-h-11 items-center text-xs text-ash"
        >
          Solo los administradores pueden editar el inventario.
        </p>
      )}

      {devices.length === 0 ? (
        <div className="border border-mist/60 p-6">
          <p className="text-sm text-ash">Todavía no hay dispositivos.</p>
        </div>
      ) : (
        <ul className="border-t border-mist/60">
          {devices.map((device) => {
            const isEditing = editingId === device.id;
            const isConfirming = confirmingId === device.id;
            const typeLabel =
              DEVICE_TYPE_LABELS[device.type as DeviceType] ?? device.type;

            return (
              <li key={device.id} className="border-b border-mist/60">
                <div className="py-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-base text-ink">{device.name}</span>
                    <span className="text-[10px] tracking-wider2 text-ash">
                      {typeLabel}
                    </span>
                    <span
                      className={`text-[10px] tracking-wider2 ${
                        device.online ? 'text-ink' : 'text-ash'
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
                    <p className="mt-2 text-xs text-ash">{device.notes}</p>
                  )}

                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleEdit(device.id)}
                        className="inline-flex min-h-11 items-center border border-mist/60 px-4 text-xs text-ink active:bg-mist"
                      >
                        {isEditing ? 'Cerrar' : 'Editar'}
                      </button>

                      {isConfirming ? (
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-ash">¿Eliminar?</span>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onConfirmDelete(device.id)}
                            className="inline-flex min-h-11 items-center border border-alarm px-4 text-xs text-alarm disabled:opacity-40"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={onCancelDelete}
                            className="inline-flex min-h-11 items-center border border-mist/60 px-4 text-xs text-ash active:bg-mist"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestDelete(device.id)}
                          className="inline-flex min-h-11 items-center border border-mist/60 px-4 text-xs text-alarm active:bg-mist"
                        >
                          Eliminar
                        </button>
                      )}
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
