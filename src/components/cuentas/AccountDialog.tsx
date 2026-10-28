'use client';

import { useState } from 'react';
import {
  ACCOUNT_CATEGORIES,
  VISIBILITY_LABEL,
  type Visibility,
} from '@/lib/vault/constants';
import { generatePassword, passwordStrength } from '@/lib/vault/password';
import type { AccountField, AccountPayload, VaultMember } from '@/lib/vault/types';
import {
  encryptNewAccount,
  encryptWithExistingDek,
  memberLabel,
  membersWithVault,
  recipientsForVisibility,
  type DecryptedAccount,
} from './account-crypto';
import { VaultApiError, errorMessage, vaultFetch } from './api';
import type { VaultSession } from './session';
import { Alert, Button, Field, Modal } from './ui';

type Mode = 'create' | 'view' | 'edit';

const EMPTY: AccountPayload = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: 'Otros',
  customFields: [],
};

export function AccountDialog({
  mode,
  account,
  members,
  ownerId,
  session,
  onClose,
  onSaved,
  onShare,
  onDelete,
}: {
  mode: Mode;
  account?: DecryptedAccount;
  members: VaultMember[];
  ownerId: string;
  session: VaultSession;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onShare?: (account: DecryptedAccount) => void;
  onDelete?: (account: DecryptedAccount) => Promise<void> | void;
}) {
  const [current, setCurrent] = useState<Mode>(mode);
  const [payload, setPayload] = useState<AccountPayload>(account?.payload ?? EMPTY);
  const [visibility, setVisibility] = useState<Visibility>(
    account?.record.visibility ?? 'FAMILY',
  );
  const [customIds, setCustomIds] = useState<string[]>(
    account?.record.keys
      .map((key) => key.userId)
      .filter((id) => id !== ownerId) ?? [],
  );
  const [editIds, setEditIds] = useState<string[]>(
    account?.record.keys
      .filter((key) => key.canEdit && key.userId !== ownerId)
      .map((key) => key.userId) ?? [],
  );
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stale, setStale] = useState(false);

  const owner = members.find((member) => member.id === ownerId);
  const accountOwner = account
    ? members.find((member) => member.id === account.record.ownerId)
    : owner;
  const isOwner = account ? account.record.ownerId === ownerId : true;
  const readable = account ? account.payload : null;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => {
        setCopied((current) => (current === label ? '' : current));
      }, 2000);
      // Best-effort: el portapapeles puede fallar si la pestaña pierde el foco.
      window.setTimeout(() => {
        void navigator.clipboard.writeText('').catch(() => undefined);
      }, 60_000);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  }

  function update<K extends keyof AccountPayload>(key: K, value: AccountPayload[K]) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  function updateField(index: number, patch: Partial<AccountField>) {
    setPayload((current) => ({
      ...current,
      customFields: current.customFields.map((field, i) =>
        i === index ? { ...field, ...patch } : field,
      ),
    }));
  }

  function addField() {
    if (payload.customFields.length >= 10) return;
    setPayload((current) => ({
      ...current,
      customFields: [...current.customFields, { label: '', value: '' }],
    }));
  }

  function removeField(index: number) {
    setPayload((current) => ({
      ...current,
      customFields: current.customFields.filter((_, i) => i !== index),
    }));
  }

  function normalize(): AccountPayload {
    return {
      ...payload,
      title: payload.title.trim(),
      username: payload.username.trim(),
      url: payload.url.trim(),
      notes: payload.notes,
      customFields: payload.customFields
        .map((field) => ({ label: field.label.trim(), value: field.value }))
        .filter((field) => field.label.length > 0),
    };
  }

  async function create() {
    const data = normalize();
    if (!data.title) {
      setError('El título es obligatorio.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const recipients = recipientsForVisibility({
        visibility,
        ownerId,
        members,
        customIds,
        editIds,
      });
      const encrypted = await encryptNewAccount(data, recipients);
      await vaultFetch('/api/cuentas/accounts', {
        method: 'POST',
        body: { visibility, ...encrypted },
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function saveEdit() {
    if (!account) return;
    const data = normalize();
    if (!data.title) {
      setError('El título es obligatorio.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const encrypted = await encryptWithExistingDek(data, account.record, session);
      await vaultFetch(`/api/cuentas/accounts/${account.record.id}`, {
        method: 'PATCH',
        body: { ...encrypted, revision: account.record.revision },
      });
      await onSaved();
      onClose();
    } catch (err) {
      if (err instanceof VaultApiError && err.status === 409) {
        setStale(true);
        setError('La cuenta cambió en otro dispositivo. Recarga antes de guardar.');
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!account || !onDelete) return;
    setPending(true);
    setError('');
    try {
      await onDelete(account);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  const form = current !== 'view';

  return (
    <Modal
      title={current === 'create' ? 'Nueva cuenta' : payload.title || 'Cuenta'}
      subtitle={
        current === 'view' && account
          ? `${VISIBILITY_LABEL[account.record.visibility]} · ${
              isOwner ? 'Tu cuenta' : `Compartida por ${accountOwner ? memberLabel(accountOwner) : 'otro miembro'}`
            }`
          : undefined
      }
      onClose={onClose}
      wide
    >
      {form ? (
        <div className="grid gap-5">
          <Field label="Título" htmlFor="account-title">
            <input
              id="account-title"
              value={payload.title}
              onChange={(event) => update('title', event.target.value)}
              autoComplete="off"
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Usuario o email" htmlFor="account-username">
              <input
                id="account-username"
                value={payload.username}
                onChange={(event) => update('username', event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
              />
            </Field>
            <Field label="Categoría" htmlFor="account-category">
              <select
                id="account-category"
                value={payload.category}
                onChange={(event) => update('category', event.target.value)}
                className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
              >
                {ACCOUNT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Contraseña" htmlFor="account-password">
            <div className="flex gap-2">
              <input
                id="account-password"
                type={revealed ? 'text' : 'password'}
                value={payload.password}
                onChange={(event) => update('password', event.target.value)}
                autoComplete="new-password"
                spellCheck={false}
                className="min-w-0 flex-1 border border-mist bg-canvas px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
              />
              <Button type="button" variant="ghost" onClick={() => setRevealed((value) => !value)}>
                {revealed ? 'Ocultar' : 'Ver'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => update('password', generatePassword())}
              >
                Generar
              </Button>
            </div>
          </Field>

          {payload.password ? (
            <p className="text-xs text-ash">
              Fortaleza local: {passwordStrength(payload.password).label} ·{' '}
              {payload.password.length} caracteres
            </p>
          ) : null}

          <Field label="URL" htmlFor="account-url" hint="Opcional. Se abre en una pestaña nueva.">
            <input
              id="account-url"
              value={payload.url}
              onChange={(event) => update('url', event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>

          <Field label="Notas" htmlFor="account-notes">
            <textarea
              id="account-notes"
              value={payload.notes}
              onChange={(event) => update('notes', event.target.value)}
              rows={3}
              className="w-full resize-y border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-wider2 text-ash">Campos personalizados</p>
              <button
                type="button"
                onClick={addField}
                className="text-xs text-ink underline decoration-mist underline-offset-4 hover:decoration-ink"
              >
                Añadir campo
              </button>
            </div>
            {payload.customFields.map((field, index) => (
              <div key={index} className="flex flex-wrap gap-2">
                <input
                  value={field.label}
                  onChange={(event) => updateField(index, { label: event.target.value })}
                  placeholder="Etiqueta"
                  className="min-w-0 flex-1 border border-mist bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <input
                  value={field.value}
                  onChange={(event) => updateField(index, { value: event.target.value })}
                  placeholder="Valor"
                  className="min-w-0 flex-[2] border border-mist bg-canvas px-3 py-2 text-sm outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="border border-mist px-3 text-sm text-ash transition-colors hover:border-alarm hover:text-alarm"
                  aria-label="Eliminar campo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {current === 'create' ? (
            <div className="space-y-3 border-t border-mist pt-5">
              <p className="text-xs tracking-wider2 text-ash">Visibilidad</p>
              {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 border border-mist p-3 text-sm hover:border-ink"
                >
                  <input
                    type="radio"
                    name="create-visibility"
                    checked={visibility === value}
                    onChange={() => setVisibility(value)}
                    className="h-4 w-4 accent-ink"
                  />
                  <span>{VISIBILITY_LABEL[value]}</span>
                </label>
              ))}
              {visibility === 'CUSTOM' ? (
                <div className="space-y-2">
                  {membersWithVault(members)
                    .filter((member) => member.id !== ownerId)
                    .map((member) => (
                      <label key={member.id} className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={customIds.includes(member.id)}
                          onChange={() =>
                            setCustomIds((current) =>
                              current.includes(member.id)
                                ? current.filter((id) => id !== member.id)
                                : [...current, member.id],
                            )
                          }
                          className="h-4 w-4 accent-ink"
                        />
                        <span className="flex-1">{memberLabel(member)}</span>
                        {customIds.includes(member.id) ? (
                          <label className="flex items-center gap-2 text-xs text-ash">
                            <input
                              type="checkbox"
                              checked={editIds.includes(member.id)}
                              onChange={() =>
                                setEditIds((current) =>
                                  current.includes(member.id)
                                    ? current.filter((id) => id !== member.id)
                                    : [...current, member.id],
                                )
                              }
                              className="h-4 w-4 accent-ink"
                            />
                            Puede editar
                          </label>
                        ) : null}
                      </label>
                    ))}
                </div>
              ) : null}
              <p className="text-xs text-ash">
                Toda la familia incluye a los miembros con bóveda de ahora. Si entra alguien
                nuevo, vuelve a compartir.
              </p>
            </div>
          ) : null}

          {error ? <Alert>{error}</Alert> : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-mist pt-5">
            {stale ? (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  await onSaved();
                  onClose();
                }}
              >
                Recargar cuenta
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={current === 'create' ? create : saveEdit}
              disabled={pending}
            >
              {pending ? 'Guardando…' : current === 'create' ? 'Crear cuenta' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <dl className="grid gap-4 text-sm">
            <Detail
              label="Usuario"
              value={payload.username || '—'}
              onCopy={payload.username ? () => copy(payload.username, 'usuario') : undefined}
              copied={copied === 'usuario'}
            />
            <div className="border-t border-mist pt-4">
              <dt className="text-xs tracking-wider2 text-ash">Contraseña</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-sm">
                  {revealed ? payload.password || '—' : '••••••••••••'}
                </code>
                <Button type="button" variant="ghost" onClick={() => setRevealed((value) => !value)}>
                  {revealed ? 'Ocultar' : 'Revelar'}
                </Button>
                {payload.password ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => copy(payload.password, 'contraseña')}
                  >
                    {copied === 'contraseña' ? 'Copiada' : 'Copiar'}
                  </Button>
                ) : null}
              </dd>
            </div>
            <Detail
              label="URL"
              value={payload.url || '—'}
              href={payload.url || undefined}
              onCopy={payload.url ? () => copy(payload.url, 'url') : undefined}
              copied={copied === 'url'}
            />
            {payload.notes ? (
              <div className="border-t border-mist pt-4">
                <dt className="text-xs tracking-wider2 text-ash">Notas</dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm">{payload.notes}</dd>
              </div>
            ) : null}
            {payload.customFields.length > 0 ? (
              <div className="space-y-3 border-t border-mist pt-4">
                {payload.customFields.map((field, index) => (
                  <Detail
                    key={`${field.label}-${index}`}
                    label={field.label}
                    value={field.value || '—'}
                    onCopy={field.value ? () => copy(field.value, field.label) : undefined}
                    copied={copied === field.label}
                  />
                ))}
              </div>
            ) : null}
            <div className="border-t border-mist pt-4">
              <dt className="text-xs tracking-wider2 text-ash">Categoría</dt>
              <dd className="mt-1">{payload.category || 'Otros'}</dd>
            </div>
          </dl>

          <p className="border-t border-mist pt-4 text-xs text-ash">
            {readable
              ? 'La contraseña se oculta al cerrar este panel. Copiar usa el portapapeles del sistema; intentamos vaciarlo a los 60 s, pero el navegador puede impedirlo.'
              : 'No se pudo descifrar esta cuenta.'}
          </p>

          {error ? <Alert>{error}</Alert> : null}

          {confirmDelete ? (
            <div className="border border-alarm/40 bg-alarm/5 p-4">
              <p className="text-sm text-alarm">
                Se borrará la cuenta y sus claves envueltas para todos. No se puede deshacer.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="danger" onClick={remove} disabled={pending}>
                  {pending ? 'Borrando…' : 'Sí, borrar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-mist pt-5">
            {account?.record.canEdit ? (
              <Button type="button" variant="ghost" onClick={() => setCurrent('edit')}>
                Editar
              </Button>
            ) : null}
            {isOwner && account && onShare ? (
              <Button type="button" variant="ghost" onClick={() => onShare(account)}>
                Compartir
              </Button>
            ) : null}
            {isOwner && account && onDelete ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                Borrar
              </Button>
            ) : null}
            <Button type="button" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Detail({
  label,
  value,
  href,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  href?: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs tracking-wider2 text-ash">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2">
        {href && /^https?:\/\//i.test(href) ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="min-w-0 flex-1 break-all underline decoration-mist underline-offset-4 hover:decoration-ink"
          >
            {value}
          </a>
        ) : (
          <span className="min-w-0 flex-1 break-all">{value}</span>
        )}
        {onCopy ? (
          <Button type="button" variant="ghost" onClick={onCopy}>
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        ) : null}
      </dd>
    </div>
  );
}
