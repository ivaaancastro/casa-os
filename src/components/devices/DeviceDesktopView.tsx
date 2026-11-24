'use client';

import { DEVICE_TYPE_LABELS, type DeviceType } from '@/lib/utils/device';
import { DeviceForm } from './DeviceForm';
import { ScanImportPanel } from './ScanImportPanel';
import type { DeviceFormData, DeviceViewProps } from './types';

interface DeviceDesktopViewProps extends DeviceViewProps {
  creating: boolean;
  importingScan: boolean;
  onCreateSubmit: (data: DeviceFormData) => Promise<boolean>;
  onEditSubmit: (id: string, data: DeviceFormData) => Promise<boolean>;
  onCancelCreate: () => void;
  onCancelImport: () => void;
}

/** Layout de escritorio original: acciones en cabecera, formularios inline y
 * panel de importación en tarjeta. Sin cambios funcionales. */
export function DeviceDesktopView({
  devices,
  owners,
  isAdmin,
  pending,
  creating,
  importingScan,
  editingId,
  confirmingId,
  onCreate,
  onImportScan,
  onToggleEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelEdit,
  onCancelCreate,
  onCancelImport,
  onCreateSubmit,
  onEditSubmit,
}: DeviceDesktopViewProps) {
  return (
    <div className="space-y-6">
      {isAdmin && !creating && !importingScan && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={onCreate}>
            Añadir dispositivo
          </button>
          <button type="button" className="btn-secondary" onClick={onImportScan}>
            Importar escaneo
          </button>
        </div>
      )}

      {isAdmin && importingScan && <ScanImportPanel onClose={onCancelImport} />}

      {isAdmin && creating && (
        <div className="card">
          <p className="mb-4 text-[10px] tracking-wider2 text-ash">
            Nuevo dispositivo
          </p>
          <DeviceForm
            mode="create"
            owners={owners}
            pending={pending}
            onCancel={onCancelCreate}
            onSubmit={onCreateSubmit}
          />
        </div>
      )}

      {devices.length === 0 && !creating && (
        <div className="border border-mist/60 p-6">
          <p className="text-sm text-ash">Todavía no hay dispositivos.</p>
        </div>
      )}

      {devices.length > 0 && (
        <ul className="border-t border-mist/60">
          {devices.map((device) => {
            const isEditing = editingId === device.id;
            const isConfirming = confirmingId === device.id;
            const typeLabel =
              DEVICE_TYPE_LABELS[device.type as DeviceType] ?? device.type;

            return (
              <li key={device.id} className="border-b border-mist/60">
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
                          onClick={() => onToggleEdit(device.id)}
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
                              onClick={() => onConfirmDelete(device.id)}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              className="text-xs text-ash transition-colors hover:text-ink"
                              onClick={onCancelDelete}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-ash transition-colors hover:text-alarm"
                            onClick={() => onRequestDelete(device.id)}
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
                        onCancel={onCancelEdit}
                        onSubmit={(data) => onEditSubmit(device.id, data)}
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
