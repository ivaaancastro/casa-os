'use client';

import { useEffect, useState } from 'react';
import {
  decryptKeyring,
  deriveMasterKeys,
  deriveRecoveryKek,
  encryptKeyring,
  generateKey,
  generateSalt,
  memzero,
  toBase64,
  unwrapKeyForRecipient,
  wrapKeyForRecipient,
} from '@/lib/vault/crypto';
import {
  KDF_MEM_LIMIT,
  KDF_OPS_LIMIT,
  MASTER_PASSWORD_MIN_LENGTH,
} from '@/lib/vault/constants';
import {
  decodeRecoveryCode,
  encodeRecoveryKey,
} from '@/lib/vault/recovery-code';
import { isMasterPasswordAcceptable } from '@/lib/vault/password';
import type {
  RecoveryKit,
  VaultContactSummary,
  VaultMember,
  VaultPasskeySummary,
  VaultStatusResponse,
} from '@/lib/vault/types';
import { errorMessage, vaultFetch } from './api';
import { buildRecoveryKit, downloadRecoveryKit } from './kit';
import { registerPasskeyOnDevice } from './passkey';
import { createSession, sessionKeyring, type VaultSession } from './session';
import { Alert, Button, Field, Spinner } from './ui';

type VaultBlob = NonNullable<VaultStatusResponse['vault']>;
type Section = 'security' | 'passkeys' | 'contacts' | 'activity' | 'danger';

const SECTION_LABEL: Record<Section, string> = {
  security: 'Seguridad',
  passkeys: 'Passkeys',
  contacts: 'Contactos de confianza',
  activity: 'Actividad',
  danger: 'Borrar bóveda',
};

const ACTION_LABEL: Record<string, string> = {
  VAULT_CREATED: 'Bóveda creada',
  UNLOCK_OK: 'Bóveda desbloqueada',
  UNLOCK_FAILED: 'Intento de desbloqueo fallido',
  RATE_LIMITED: 'Límite de intentos alcanzado',
  ACCOUNT_CREATED: 'Cuenta creada',
  ACCOUNT_UPDATED: 'Cuenta actualizada',
  ACCOUNT_DELETED: 'Cuenta borrada',
  SHARE_GRANTED: 'Acceso concedido',
  SHARE_REVOKED: 'Acceso revocado',
  KEY_ROTATED: 'Clave de cuenta rotada',
  MASTER_PASSWORD_CHANGED: 'Master password cambiada',
  RECOVERY_SET: 'Kit de recuperación creado',
  RECOVERY_ROTATED: 'Kit de recuperación rotado',
  RECOVERY_USED: 'Bóveda recuperada',
  RECOVERY_FAILED: 'Recuperación fallida',
  PASSKEY_ADDED: 'Passkey añadida',
  PASSKEY_REMOVED: 'Passkey eliminada',
  CONTACT_INVITED: 'Contacto invitado',
  CONTACT_ACCEPTED: 'Contacto aceptado',
  CONTACT_REVOKED: 'Contacto revocado',
  CONTACT_REVEALED: 'Copia de recuperación consultada',
};

interface PasskeyOptions {
  options: Parameters<typeof registerPasskeyOnDevice>[0]['options'];
  prfSalt: string;
}

interface VaultEvent {
  id: string;
  action: string;
  targetId: string | null;
  actorId: string | null;
  createdAt: string;
}

export function VaultSettings({
  vault,
  email,
  members,
  session,
  onClose,
  onChanged,
  onSessionReplaced,
  onVaultDeleted,
}: {
  vault: VaultBlob;
  email: string;
  members: VaultMember[];
  session: VaultSession;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onSessionReplaced: (session: VaultSession) => void;
  onVaultDeleted: () => Promise<void> | void;
}) {
  const [section, setSection] = useState<Section>('security');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-0 sm:p-6">
      <div className="mx-auto min-h-full w-full max-w-5xl bg-canvas p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-t border-mist pt-5">
          <div>
            <p className="text-xs tracking-wider2 text-ash">Cuentas</p>
            <h2 className="mt-2 font-display text-3xl tracking-editorial">Ajustes de la bóveda</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-mist text-ash transition-colors hover:border-ink hover:text-ink"
            aria-label="Cerrar ajustes"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-mist pb-3">
          {(Object.keys(SECTION_LABEL) as Section[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              className={`px-3 py-2 text-sm transition-colors ${
                section === value
                  ? 'bg-ink text-canvas'
                  : 'border border-mist text-ink hover:border-ink'
              }`}
            >
              {SECTION_LABEL[value]}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {section === 'security' ? (
            <SecuritySection
              vault={vault}
              email={email}
              session={session}
              contacts={vault.contacts}
              members={members}
              onChanged={onChanged}
              onSessionReplaced={onSessionReplaced}
            />
          ) : null}
          {section === 'passkeys' ? (
            <PasskeysSection
              passkeys={vault.passkeys}
              session={session}
              onChanged={onChanged}
            />
          ) : null}
          {section === 'contacts' ? (
            <ContactsSection
              contacts={vault.contacts}
              members={members}
              session={session}
              onChanged={onChanged}
            />
          ) : null}
          {section === 'activity' ? <ActivitySection /> : null}
          {section === 'danger' ? (
            <DangerSection
              vault={vault}
              onVaultDeleted={onVaultDeleted}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecuritySection({
  vault,
  email,
  session,
  contacts,
  members,
  onChanged,
  onSessionReplaced,
}: {
  vault: VaultBlob;
  email: string;
  session: VaultSession;
  contacts: VaultContactSummary[];
  members: VaultMember[];
  onChanged: () => Promise<void> | void;
  onSessionReplaced: (session: VaultSession) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordDone, setPasswordDone] = useState('');

  const [kitPassword, setKitPassword] = useState('');
  const [kitPending, setKitPending] = useState(false);
  const [kitError, setKitError] = useState('');
  const [kit, setKit] = useState<RecoveryKit | null>(null);
  const [kitNotice, setKitNotice] = useState('');

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError('');
    setPasswordDone('');
    if (!isMasterPasswordAcceptable(newPassword)) {
      setPasswordError(
        `La nueva master password debe tener al menos ${MASTER_PASSWORD_MIN_LENGTH} caracteres y no ser común.`,
      );
      return;
    }
    if (newPassword !== confirm) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setPasswordPending(true);
    let oldKek: Uint8Array | null = null;
    let newKek: Uint8Array | null = null;
    try {
      const oldDerived = await deriveMasterKeys(
        currentPassword,
        vault.kdfSalt,
        vault.kdfOpsLimit,
        vault.kdfMemLimit,
      );
      oldKek = oldDerived.kek;
      const keyring = await decryptKeyring(
        session.wrappedKeyring,
        session.keyringNonce,
        oldKek,
      );

      const salt = await generateSalt();
      const derived = await deriveMasterKeys(newPassword, salt, KDF_OPS_LIMIT, KDF_MEM_LIMIT);
      newKek = derived.kek;
      const encrypted = await encryptKeyring(keyring, derived.kek);

      const result = await vaultFetch<{
        vault: {
          kdfSalt: string;
          kdfOpsLimit: number;
          kdfMemLimit: number;
          publicKey: string;
          wrappedKeyring: string;
          keyringNonce: string;
          keyringVersion: number;
        };
      }>('/api/cuentas/vault/keyring', {
        method: 'PUT',
        body: {
          kdfSalt: salt,
          kdfOpsLimit: KDF_OPS_LIMIT,
          kdfMemLimit: KDF_MEM_LIMIT,
          authKey: toBase64(derived.authKey),
          wrappedKeyring: encrypted.wrappedKeyring,
          keyringNonce: encrypted.keyringNonce,
        },
      });

      onSessionReplaced(createSession(keyring, result.vault));
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setPasswordDone('Master password cambiada. Las passkeys se han eliminado.');
      await onChanged();
    } catch (err) {
      setPasswordError(
        err instanceof Error && /descifr|base64|nonce/i.test(err.message)
          ? 'La master password actual no es correcta.'
          : errorMessage(err),
      );
    } finally {
      memzero(oldKek);
      memzero(newKek);
      setPasswordPending(false);
    }
  }

  async function rotateKit(event: React.FormEvent) {
    event.preventDefault();
    setKitError('');
    setKitNotice('');
    setKitPending(true);
    let kek: Uint8Array | null = null;
    let recoveryKey: Uint8Array | null = null;
    let recoveryKek: Uint8Array | null = null;
    try {
      const derived = await deriveMasterKeys(
        kitPassword,
        vault.kdfSalt,
        vault.kdfOpsLimit,
        vault.kdfMemLimit,
      );
      kek = derived.kek;
      const keyring = await decryptKeyring(session.wrappedKeyring, session.keyringNonce, kek);

      const nextRecoveryKey = await generateKey();
      recoveryKey = nextRecoveryKey;
      const salt = await generateSalt();
      recoveryKek = await deriveRecoveryKek(
        nextRecoveryKey,
        salt,
        KDF_OPS_LIMIT,
        KDF_MEM_LIMIT,
      );
      const encrypted = await encryptKeyring(keyring, recoveryKek);

      const contactShares: Array<{ contactId: string; wrappedRecoveryKey: string }> = [];
      for (const contact of contacts) {
        if (contact.direction !== 'outgoing' || contact.status === 'REVOKED') continue;
        const member = members.find((item) => item.id === contact.contactId);
        if (!member?.publicKey) continue;
        contactShares.push({
          contactId: contact.contactId,
          wrappedRecoveryKey: await wrapKeyForRecipient(nextRecoveryKey, member.publicKey),
        });
      }

      await vaultFetch('/api/cuentas/recovery', {
        method: 'PUT',
        body: {
          kdfSalt: salt,
          kdfOpsLimit: KDF_OPS_LIMIT,
          kdfMemLimit: KDF_MEM_LIMIT,
          wrappedKeyring: encrypted.wrappedKeyring,
          nonce: encrypted.keyringNonce,
          contactShares,
        },
      });

      const nextKit = buildRecoveryKit({
        email,
        recoveryKey: await encodeRecoveryKey(nextRecoveryKey),
      });
      setKit(nextKit);
      setKitPassword('');
      setKitNotice(
        contactShares.length > 0
          ? 'Kit rotado. Las copias de tus contactos se han renovado y vuelven a estar pendientes de aceptación.'
          : 'Kit rotado. El kit anterior ya no abre la bóveda.',
      );
      await onChanged();
    } catch (err) {
      setKitError(
        err instanceof Error && /descifr|base64|nonce/i.test(err.message)
          ? 'La master password no es correcta.'
          : errorMessage(err),
      );
    } finally {
      memzero(kek);
      memzero(recoveryKey);
      memzero(recoveryKek);
      setKitPending(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h3 className="font-display text-2xl tracking-editorial">Cambiar master password</h3>
        <p className="mt-2 text-sm text-ash">
          No se vuelven a cifrar las cuentas: la clave privada de la bóveda no cambia. Se
          invalidan los grants y las passkeys.
        </p>
        <form onSubmit={changePassword} className="mt-5 grid gap-4">
          <Field label="Master password actual" htmlFor="settings-current-password">
            <input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>
          <Field label="Nueva master password" htmlFor="settings-new-password">
            <input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>
          <Field label="Repite la nueva" htmlFor="settings-confirm-password">
            <input
              id="settings-confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>
          {passwordError ? <Alert>{passwordError}</Alert> : null}
          {passwordDone ? <Alert tone="success">{passwordDone}</Alert> : null}
          <div>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? 'Cambiando…' : 'Cambiar master password'}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="font-display text-2xl tracking-editorial">Kit de recuperación</h3>
        <p className="mt-2 text-sm text-ash">
          El código no se vuelve a mostrar. Puedes generar uno nuevo confirmando la master
          password; el anterior dejará de funcionar.
        </p>
        <form onSubmit={rotateKit} className="mt-5 grid gap-4">
          <Field label="Master password" htmlFor="settings-kit-password">
            <input
              id="settings-kit-password"
              type="password"
              value={kitPassword}
              onChange={(event) => setKitPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
          </Field>
          {kitError ? <Alert>{kitError}</Alert> : null}
          {kitNotice ? <Alert tone="success">{kitNotice}</Alert> : null}
          {kit ? (
            <div className="border border-mist bg-pearl p-4">
              <p className="text-sm">Kit nuevo listo. Descárgalo y guárdalo antes de cerrar.</p>
              <div className="mt-3">
                <Button type="button" variant="ghost" onClick={() => downloadRecoveryKit(kit)}>
                  Descargar kit .txt
                </Button>
              </div>
            </div>
          ) : null}
          <div>
            <Button type="submit" disabled={kitPending}>
              {kitPending ? 'Rotando…' : 'Generar kit nuevo'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PasskeysSection({
  passkeys,
  session,
  onChanged,
}: {
  passkeys: VaultPasskeySummary[];
  session: VaultSession;
  onChanged: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function add() {
    setPending(true);
    setError('');
    setMessage('');
    try {
      const options = await vaultFetch<PasskeyOptions>('/api/cuentas/passkeys/options', {
        method: 'POST',
        body: {},
      });
      const result = await registerPasskeyOnDevice({
        options: options.options,
        prfSalt: options.prfSalt,
        keyring: sessionKeyring(session),
      });
      await vaultFetch('/api/cuentas/passkeys', {
        method: 'POST',
        body: {
          response: result.response,
          prfSalt: options.prfSalt,
          wrappedKeyring: result.wrappedKeyring,
          keyringNonce: result.keyringNonce,
        },
      });
      setMessage('Passkey añadida. Para desbloquear seguirás necesitando el código 2FA.');
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setPending(true);
    setError('');
    try {
      await vaultFetch(`/api/cuentas/passkeys/${id}`, { method: 'DELETE' });
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h3 className="font-display text-2xl tracking-editorial">Passkeys</h3>
      <p className="mt-2 text-sm text-ash">
        Solo se registran autenticadores con PRF. Sin PRF no se muestra la opción de desbloquear
        con huella o cara.
      </p>

      {passkeys.length === 0 ? (
        <p className="mt-5 border border-mist p-4 text-sm text-ash">No hay passkeys registradas.</p>
      ) : (
        <ul className="mt-5 divide-y divide-mist border border-mist">
          {passkeys.map((passkey, index) => (
            <li key={passkey.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className="flex-1">
                Passkey {index + 1}
                <span className="mt-1 block text-xs text-ash">
                  Añadida el {new Date(passkey.createdAt).toLocaleDateString('es-ES')}
                  {passkey.lastUsedAt
                    ? ` · última vez ${new Date(passkey.lastUsedAt).toLocaleDateString('es-ES')}`
                    : ''}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(passkey.id)}
                disabled={pending}
              >
                Eliminar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      {message ? <div className="mt-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="mt-5">
        <Button type="button" onClick={add} disabled={pending}>
          {pending ? 'Esperando al autenticador…' : 'Añadir passkey'}
        </Button>
      </div>
    </section>
  );
}

function ContactsSection({
  contacts,
  members,
  session,
  onChanged,
}: {
  contacts: VaultContactSummary[];
  members: VaultMember[];
  session: VaultSession;
  onChanged: () => Promise<void> | void;
}) {
  const [contactId, setContactId] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState<{ id: string; code: string } | null>(null);

  const eligible = members.filter((member) => member.hasVault && member.publicKey);
  const outgoing = contacts.filter((contact) => contact.direction === 'outgoing');
  const incoming = contacts.filter((contact) => contact.direction === 'incoming');

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const member = eligible.find((item) => item.id === contactId);
    if (!member?.publicKey) {
      setError('Elige un miembro con bóveda.');
      return;
    }
    setPending(true);
    let recoveryKey: Uint8Array | null = null;
    try {
      recoveryKey = await decodeRecoveryCode(code);
      const wrappedRecoveryKey = await wrapKeyForRecipient(recoveryKey, member.publicKey);
      await vaultFetch('/api/cuentas/trusted-contacts', {
        method: 'POST',
        body: { contactId: member.id, wrappedRecoveryKey },
      });
      setCode('');
      setContactId('');
      setMessage(
        'Invitación enviada. El contacto debe aceptarla desde sus Ajustes antes de poder ver la copia.',
      );
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error && /checksum|código/i.test(err.message)
          ? 'El código de recuperación no es válido.'
          : errorMessage(err),
      );
    } finally {
      memzero(recoveryKey);
      setPending(false);
    }
  }

  async function accept(id: string) {
    setPending(true);
    setError('');
    try {
      await vaultFetch(`/api/cuentas/trusted-contacts/${id}/accept`, { method: 'POST' });
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function reveal(contact: VaultContactSummary) {
    setPending(true);
    setError('');
    try {
      const result = await vaultFetch<{ wrappedRecoveryKey: string }>(
        `/api/cuentas/trusted-contacts/${contact.id}/reveal`,
        { method: 'POST' },
      );
      const bytes = await unwrapKeyForRecipient(
        result.wrappedRecoveryKey,
        session.pk,
        toBase64(session.sk),
      );
      try {
        setRevealed({ id: contact.id, code: await encodeRecoveryKey(bytes) });
        setMessage(
          'Copia abierta. Entrégala en persona: quien la tenga puede iniciar una recuperación con el 2FA del dueño.',
        );
      } finally {
        memzero(bytes);
      }
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setPending(true);
    setError('');
    try {
      await vaultFetch(`/api/cuentas/trusted-contacts/${id}`, { method: 'DELETE' });
      setRevealed(null);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h3 className="font-display text-2xl tracking-editorial">Tus contactos</h3>
        <p className="mt-2 text-sm text-ash">
          Custodian una copia de tu clave de recuperación. No pueden leer tus cuentas por su
          cuenta. Si rotas el kit, sus copias se renuevan y deben aceptarlas otra vez.
        </p>

        {outgoing.length === 0 ? (
          <p className="mt-5 border border-mist p-4 text-sm text-ash">
            No has invitado a ningún contacto.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-mist border border-mist">
            {outgoing.map((contact) => (
              <li key={contact.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <span className="flex-1">
                  {contact.contactName || contact.contactEmail}
                  <span className="mt-1 block text-xs text-ash">
                    {statusLabel(contact.status)}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(contact.id)}
                  disabled={pending}
                >
                  Revocar
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={invite} className="mt-6 grid gap-4 border-t border-mist pt-5">
          <Field label="Invitar a un miembro" htmlFor="contact-member">
            <select
              id="contact-member"
              value={contactId}
              onChange={(event) => setContactId(event.target.value)}
              className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
            >
              <option value="">Elige un miembro con bóveda</option>
              {eligible.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Tu código de recuperación"
            htmlFor="contact-code"
            hint="Se envuelve para el contacto; el servidor no puede abrirlo."
          >
            <textarea
              id="contact-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full resize-none border border-mist bg-canvas px-3 py-2.5 font-mono text-sm outline-none focus:border-ink"
            />
          </Field>
          <div>
            <Button type="submit" disabled={pending || !contactId || !code.trim()}>
              {pending ? 'Guardando…' : 'Invitar contacto'}
            </Button>
          </div>
        </form>

        {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
        {message ? <div className="mt-4"><Alert tone="info">{message}</Alert></div> : null}
      </section>

      <section>
        <h3 className="font-display text-2xl tracking-editorial">Copias que custodia</h3>
        <p className="mt-2 text-sm text-ash">
          Si alguien te eligió como contacto, aquí puedes aceptar y consultar su código cuando lo
          necesite.
        </p>

        {incoming.length === 0 ? (
          <p className="mt-5 border border-mist p-4 text-sm text-ash">
            Nadie te ha elegido como contacto.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-mist border border-mist">
            {incoming.map((contact) => (
              <li key={contact.id} className="p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex-1">
                    {contact.ownerName || contact.ownerEmail}
                    <span className="mt-1 block text-xs text-ash">
                      {statusLabel(contact.status)}
                    </span>
                  </span>
                  {contact.status === 'PENDING' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => accept(contact.id)}
                      disabled={pending}
                    >
                      Aceptar
                    </Button>
                  ) : null}
                  {contact.status === 'ACCEPTED' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => reveal(contact)}
                      disabled={pending}
                    >
                      Ver código
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(contact.id)}
                    disabled={pending}
                  >
                    Quitar
                  </Button>
                </div>
                {revealed?.id === contact.id ? (
                  <div className="mt-4 border border-mist bg-pearl p-4">
                    <p className="text-xs tracking-wider2 text-ash">
                      Código de recuperación de {contact.ownerName || contact.ownerEmail}
                    </p>
                    <code className="mt-2 block break-all font-mono text-sm">
                      {revealed.code}
                    </code>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActivitySection() {
  const [events, setEvents] = useState<VaultEvent[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    vaultFetch<{ events: VaultEvent[] }>('/api/cuentas/events')
      .then((result) => {
        if (active) setEvents(result.events);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="max-w-3xl">
      <h3 className="font-display text-2xl tracking-editorial">Actividad reciente</h3>
      <p className="mt-2 text-sm text-ash">
        Solo metadatos: nunca títulos, usuarios, URLs, contraseñas ni claves.
      </p>
      {error ? <div className="mt-4"><Alert>{error}</Alert></div> : null}
      {!events && !error ? <div className="mt-5"><Spinner label="Cargando actividad" /></div> : null}
      {events ? (
        events.length === 0 ? (
          <p className="mt-5 border border-mist p-4 text-sm text-ash">Sin actividad todavía.</p>
        ) : (
          <ul className="mt-5 divide-y divide-mist border border-mist">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline gap-2 p-3 text-sm">
                <span className="flex-1">{ACTION_LABEL[event.action] ?? event.action}</span>
                <time className="text-xs text-ash" dateTime={event.createdAt}>
                  {new Date(event.createdAt).toLocaleString('es-ES')}
                </time>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

function DangerSection({
  vault,
  onVaultDeleted,
}: {
  vault: VaultBlob;
  onVaultDeleted: () => Promise<void> | void;
}) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function remove(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    let authKey: Uint8Array | null = null;
    try {
      const derived = await deriveMasterKeys(
        password,
        vault.kdfSalt,
        vault.kdfOpsLimit,
        vault.kdfMemLimit,
      );
      authKey = derived.authKey;
      await vaultFetch('/api/cuentas/vault', {
        method: 'DELETE',
        body: { authKey: toBase64(derived.authKey), code, confirm: 'BORRAR' },
      });
      await onVaultDeleted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      memzero(authKey);
      setPending(false);
    }
  }

  return (
    <section className="max-w-xl border border-alarm/40 bg-alarm/5 p-5">
      <h3 className="font-display text-2xl tracking-editorial text-alarm">Borrar la bóveda</h3>
      <p className="mt-2 text-sm text-ash">
        Se borran la bóveda, el kit, las passkeys, los contactos y la actividad. Las cuentas que
        compartiste no se pueden revocar: sus destinatarios conservan la copia que ya tienen. La
        operación es irreversible.
      </p>
      <form onSubmit={remove} className="mt-5 grid gap-4">
        <Field label="Master password" htmlFor="danger-password">
          <input
            id="danger-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>
        <Field label="Código 2FA" htmlFor="danger-code">
          <input
            id="danger-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>
        <Field label="Escribe BORRAR para confirmar" htmlFor="danger-confirm">
          <input
            id="danger-confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            required
            className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </Field>
        {error ? <Alert>{error}</Alert> : null}
        <div>
          <Button
            type="submit"
            variant="danger"
            disabled={pending || confirm !== 'BORRAR'}
          >
            {pending ? 'Borrando…' : 'Borrar bóveda definitivamente'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function statusLabel(status: VaultContactSummary['status']): string {
  const labels: Record<VaultContactSummary['status'], string> = {
    PENDING: 'Pendiente de aceptación',
    ACCEPTED: 'Aceptado',
    STALE: 'Copia obsoleta: hay que renovarla',
    REVOKED: 'Revocado',
  };
  return labels[status];
}
