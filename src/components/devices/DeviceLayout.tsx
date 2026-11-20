'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/components/mobile/useIsMobile';
import { DeviceActionSheet } from './DeviceActionSheet';
import { DeviceDesktopView } from './DeviceDesktopView';
import { DeviceForm } from './DeviceForm';
import { DeviceMobileView } from './DeviceMobileView';
import { ScanImportPanel } from './ScanImportPanel';
import type {
  DeviceFormData,
  DeviceItem,
  DeviceOwnerOption,
  DeviceViewProps,
} from './types';

interface DeviceLayoutProps {
  devices: DeviceItem[];
  owners: DeviceOwnerOption[];
  currentUserRole: string;
}

/** Dueño del estado del inventario; delega el render en una vista por breakpoint. */
export function DeviceLayout({ devices, owners, currentUserRole }: DeviceLayoutProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isAdmin = currentUserRole === 'ADMIN';

  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importingScan, setImportingScan] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function request(url: string, method: string, body?: unknown): Promise<boolean> {
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

  function openCreate() {
    setCreating(true);
    setImportingScan(false);
    setEditingId(null);
    setConfirmingId(null);
    setError('');
  }

  function openImport() {
    setImportingScan(true);
    setCreating(false);
    setEditingId(null);
    setConfirmingId(null);
    setError('');
  }

  function toggleEdit(id: string) {
    setEditingId((current) => (current === id ? null : id));
    setCreating(false);
    setImportingScan(false);
    setConfirmingId(null);
    setError('');
  }

  function requestDelete(id: string) {
    setConfirmingId(id);
    setEditingId(null);
    setImportingScan(false);
    setError('');
  }

  const sharedProps: DeviceViewProps = {
    devices,
    owners,
    isAdmin,
    pending,
    editingId,
    confirmingId,
    onCreate: openCreate,
    onImportScan: openImport,
    onToggleEdit: toggleEdit,
    onRequestDelete: requestDelete,
    onConfirmDelete: handleDelete,
    onCancelDelete: () => setConfirmingId(null),
    onCancelEdit: () => {
      setEditingId(null);
      setError('');
    },
  };

  const editingDevice = editingId
    ? devices.find((device) => device.id === editingId) ?? null
    : null;

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="border border-alarm px-4 py-3 text-sm text-alarm">
          {error}
        </p>
      )}

      {isMobile ? (
        <DeviceMobileView {...sharedProps} />
      ) : (
        <DeviceDesktopView
          {...sharedProps}
          creating={creating}
          importingScan={importingScan}
          onCreateSubmit={handleCreate}
          onEditSubmit={handleEdit}
          onCancelCreate={() => {
            setCreating(false);
            setError('');
          }}
          onCancelImport={() => setImportingScan(false)}
        />
      )}

      {isMobile && isAdmin && (
        <>
          <DeviceActionSheet onCreate={openCreate} onImportScan={openImport} />

          {creating && (
            <DeviceForm
              mode="create"
              owners={owners}
              pending={pending}
              mobile
              onCancel={() => {
                setCreating(false);
                setError('');
              }}
              onSubmit={handleCreate}
            />
          )}

          {editingDevice && (
            <DeviceForm
              key={editingDevice.id}
              mode="edit"
              device={editingDevice}
              owners={owners}
              pending={pending}
              mobile
              onCancel={() => {
                setEditingId(null);
                setError('');
              }}
              onSubmit={(data) => handleEdit(editingDevice.id, data)}
            />
          )}

          {importingScan && (
            <ScanImportPanel mobile onClose={() => setImportingScan(false)} />
          )}
        </>
      )}
    </div>
  );
}
