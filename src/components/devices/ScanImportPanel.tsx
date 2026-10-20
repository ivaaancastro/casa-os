'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SCAN_STATUS_LABELS,
  type ScanStatus,
} from '@/lib/utils/scan';

interface ScanExistingDevice {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
}

interface ScanPreviewItem {
  index: number;
  ip: string;
  mac: string | null;
  vendor: string | null;
  suggestedName: string;
  status: ScanStatus;
  reason: string;
  existingDevice: ScanExistingDevice | null;
  ipDevice: ScanExistingDevice | null;
  macDevice: ScanExistingDevice | null;
}

interface ScanSummary {
  total: number;
  new: number;
  existing: number;
  conflict: number;
  duplicate: number;
  invalid: number;
  created: number;
  skipped: number;
}

interface ScanPreview {
  dryRun: boolean;
  scannedAt: string | null;
  cidr: string | null;
  summary: ScanSummary;
  items: ScanPreviewItem[];
}

interface ImportResponse extends ScanPreview {
  created: number;
  skipped: number;
}

interface ScanImportPanelProps {
  onClose: () => void;
}

function formatScanDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-ES');
}

export function ScanImportPanel({ onClose }: ScanImportPanelProps) {
  const router = useRouter();
  const ids = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function resetFile() {
    setPreview(null);
    setSelected(new Set());
    setError('');
    setSuccess('');
    if (inputRef.current) inputRef.current.value = '';
  }

  function toggle(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setPreview(null);
    setSelected(new Set());
    setError('');
    setSuccess('');

    if (file.size > 1_000_000) {
      setError('El archivo es demasiado grande (máximo 1 MB).');
      return;
    }

    let raw: unknown;

    try {
      raw = JSON.parse(await file.text());
    } catch {
      setError('El archivo no es un JSON válido.');
      return;
    }

    if (!raw || typeof raw !== 'object') {
      setError('El archivo no contiene un escaneo válido.');
      return;
    }

    const parsed = raw as {
      version?: unknown;
      scannedAt?: unknown;
      cidr?: unknown;
      devices?: unknown;
    };

    if (!Array.isArray(parsed.devices) || parsed.devices.length === 0) {
      setError('El archivo no contiene dispositivos.');
      return;
    }

    setPending(true);

    try {
      const res = await fetch('/api/devices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: parsed.version,
          scannedAt: parsed.scannedAt,
          cidr: parsed.cidr,
          devices: parsed.devices,
          dryRun: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | ScanPreview
        | { error?: string };

      if (!res.ok) {
        setError(
          'error' in data && data.error
            ? data.error
            : 'No se pudo leer el escaneo.',
        );
        return;
      }

      const nextPreview = data as ScanPreview;
      setPreview(nextPreview);
      setSelected(
        new Set(
          nextPreview.items
            .filter((item) => item.status === 'new')
            .map((item) => item.index),
        ),
      );
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  async function handleImport() {
    if (!preview || selected.size === 0) return;

    const devices = preview.items
      .filter((item) => selected.has(item.index))
      .map((item) => ({
        ip: item.ip,
        mac: item.mac,
        vendor: item.vendor,
        name: item.suggestedName,
      }));

    setPending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/devices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devices,
          dryRun: false,
          ...(preview.scannedAt ? { scannedAt: preview.scannedAt } : {}),
          ...(preview.cidr ? { cidr: preview.cidr } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | ImportResponse
        | { error?: string };

      if (!res.ok) {
        setError(
          'error' in data && data.error
            ? data.error
            : 'No se pudo importar el escaneo.',
        );
        return;
      }

      const imported = data as ImportResponse;
      const skipped = imported.skipped > 0 ? ` · ${imported.skipped} omitidos` : '';
      setSuccess(
        `${imported.created} ${imported.created === 1 ? 'equipo importado' : 'equipos importados'}${skipped}.`,
      );
      setPreview(null);
      setSelected(new Set());
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  const newCount = preview
    ? preview.items.filter((item) => item.status === 'new').length
    : 0;
  const scannedAt = formatScanDate(preview?.scannedAt ?? null);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-wider2 text-ash">Escaneo de red</p>
          <p className="mt-1 max-w-2xl text-xs text-ash">
            El escaneo se ejecuta en tu ordenador, no en Vercel. Sube el archivo
            y revisa el resultado antes de importar.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-ash transition-colors hover:text-ink disabled:opacity-40"
          onClick={onClose}
          disabled={pending}
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 border border-mist bg-canvas p-4">
        <p className="text-xs text-ash">
          En el ordenador conectado a la red de casa:
        </p>
        <code className="mt-2 block break-words text-xs text-ink">
          npm run scan -- --out scan-latest.json
        </code>
        <p className="mt-2 text-xs text-ash">
          Luego selecciona <span className="text-ink">scan-latest.json</span>.
          Solo se importan los equipos nuevos que marques.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor={`${ids}-scan-file`} className="label">
          Archivo de escaneo
        </label>
        <input
          ref={inputRef}
          id={`${ids}-scan-file`}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          disabled={pending}
          className="block w-full text-xs text-ash file:mr-3 file:border file:border-mist file:bg-canvas file:px-3 file:py-2 file:text-xs file:text-ink disabled:opacity-40"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border border-alarm px-4 py-3 text-xs text-alarm"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mt-4 border border-mist px-4 py-3 text-xs text-ink"
        >
          {success}
        </p>
      )}

      {pending && (
        <p role="status" className="mt-4 text-xs text-ash">
          Procesando el escaneo...
        </p>
      )}

      {preview && (
        <div className="mt-6 border-t border-mist pt-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ash">
            <span>
              <strong className="font-normal text-ink">
                {preview.summary.total}
              </strong>{' '}
              descubiertos
            </span>
            <span>
              <strong className="font-normal text-ink">
                {preview.summary.new}
              </strong>{' '}
              nuevos
            </span>
            <span>{preview.summary.existing} ya existentes</span>
            <span>{preview.summary.conflict} conflictos</span>
            <span>{preview.summary.duplicate} duplicados</span>
            <span>{preview.summary.invalid} inválidos</span>
          </div>

          {(scannedAt || preview.cidr) && (
            <p className="mt-2 text-xs text-ash">
              {scannedAt && <>Escaneo: {scannedAt}</>}
              {scannedAt && preview.cidr && ' · '}
              {preview.cidr && <>Red: {preview.cidr}</>}
            </p>
          )}

          <ul className="mt-4 border-t border-mist">
            {preview.items.map((item) => {
              const isSelectable = item.status === 'new';
              const statusClass =
                item.status === 'conflict' || item.status === 'invalid'
                  ? 'text-alarm'
                  : item.status === 'new'
                    ? 'text-ink'
                    : 'text-ash';

              return (
                <li key={item.index} className="border-b border-mist py-4">
                  <div className="flex gap-3">
                    <div className="w-4 shrink-0 pt-1">
                      {isSelectable ? (
                        <input
                          type="checkbox"
                          checked={selected.has(item.index)}
                          onChange={() => toggle(item.index)}
                          disabled={pending}
                          aria-label={`Importar ${item.suggestedName}`}
                          className="h-4 w-4 accent-ink"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="break-words text-sm text-ink">
                          {item.suggestedName}
                        </span>
                        <span
                          className={`text-[10px] tracking-wider2 ${statusClass}`}
                        >
                          {SCAN_STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ash">
                        <span>IP · {item.ip}</span>
                        <span>MAC · {item.mac ?? '—'}</span>
                        {item.vendor && <span>{item.vendor}</span>}
                      </div>

                      <p className="mt-1 text-xs text-ash">{item.reason}</p>

                      {item.existingDevice && (
                        <p className="mt-1 text-xs text-ash">
                          Inventario: {item.existingDevice.name}
                        </p>
                      )}

                      {item.status === 'conflict' &&
                        item.ipDevice &&
                        item.macDevice && (
                          <p className="mt-1 text-xs text-ash">
                            IP: {item.ipDevice.name} · MAC:{' '}
                            {item.macDevice.name}
                          </p>
                        )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={pending || selected.size === 0}
            >
              {pending
                ? 'Importando...'
                : `Importar ${selected.size} ${
                    selected.size === 1 ? 'nuevo' : 'nuevos'
                  }`}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetFile}
              disabled={pending}
            >
              Descartar
            </button>
          </div>

          {newCount === 0 && (
            <p className="mt-3 text-xs text-ash">
              No hay equipos nuevos que importar. Revisa los conflictos o el
              inventario.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
