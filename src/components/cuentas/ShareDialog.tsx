'use client';

import { useState } from 'react';
import { VISIBILITY_LABEL, type Visibility } from '@/lib/vault/constants';
import type { VaultMember } from '@/lib/vault/types';
import {
  memberLabel,
  membersWithVault,
  recipientsForVisibility,
  rotateAccount,
  type DecryptedAccount,
} from './account-crypto';
import { errorMessage, vaultFetch } from './api';
import { Alert, Button, Modal } from './ui';

export function ShareDialog({
  account,
  members,
  ownerId,
  onSaved,
  onClose,
}: {
  account: DecryptedAccount;
  members: VaultMember[];
  ownerId: string;
  onSaved: () => Promise<void> | void;
  onClose: () => void;
}) {
  const recipientIds = account.record.keys.map((key) => key.userId);
  const [visibility, setVisibility] = useState<Visibility>(account.record.visibility);
  const [customIds, setCustomIds] = useState<string[]>(
    recipientIds.filter((id) => id !== ownerId),
  );
  const [editIds, setEditIds] = useState<string[]>(
    account.record.keys.filter((key) => key.canEdit && key.userId !== ownerId).map((key) => key.userId),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const available = membersWithVault(members);
  const familyIds = available.filter((member) => member.id !== ownerId).map((member) => member.id);
  const missingFamily = familyIds.filter((id) => !recipientIds.includes(id));
  const selectedIds =
    visibility === 'PRIVATE'
      ? []
      : visibility === 'FAMILY'
        ? familyIds
        : customIds.filter((id) => familyIds.includes(id));

  function toggle(id: string) {
    setCustomIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleEdit(id: string) {
    setEditIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function save() {
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
      const rotated = await rotateAccount(account.payload, recipients);
      await vaultFetch(`/api/cuentas/accounts/${account.record.id}/keys`, {
        method: 'PUT',
        body: {
          visibility,
          ciphertext: rotated.ciphertext,
          nonce: rotated.nonce,
          revision: account.record.revision,
          keys: rotated.keys,
        },
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      title="Compartir cuenta"
      subtitle={`${account.payload.title} · al guardar se rota la clave de la cuenta y se re-cifra el contenido.`}
      onClose={onClose}
      wide
    >
      <div className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-xs tracking-wider2 text-ash">Quién puede verla</legend>
          {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 border border-mist p-3 text-sm transition-colors hover:border-ink"
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                className="mt-0.5 h-4 w-4 accent-ink"
              />
              <span>
                <span className="block">{VISIBILITY_LABEL[value]}</span>
                <span className="mt-1 block text-xs text-ash">
                  {value === 'PRIVATE'
                    ? 'Solo tú tienes la clave de esta cuenta.'
                    : value === 'FAMILY'
                      ? 'Todos los miembros con bóveda en este momento.'
                      : 'Elige miembros concretos con bóveda.'}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {availabilityNotice(visibility, available.length, ownerId, missingFamily)}

        {visibility !== 'PRIVATE' ? (
          <div className="space-y-2">
            <p className="text-xs tracking-wider2 text-ash">
              {visibility === 'FAMILY' ? 'Miembros incluidos' : 'Elige personas'}
            </p>
            {available.length <= 1 ? (
              <p className="text-sm text-ash">Todavía no hay otros miembros con bóveda.</p>
            ) : (
              <ul className="divide-y divide-mist border border-mist">
                {available
                  .filter((member) => member.id !== ownerId)
                  .map((member) => {
                    const included =
                      visibility === 'FAMILY' || selectedIds.includes(member.id);
                    return (
                      <li key={member.id} className="flex flex-wrap items-center gap-3 p-3">
                        {visibility === 'CUSTOM' ? (
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={() => toggle(member.id)}
                            aria-label={`Compartir con ${memberLabel(member)}`}
                            className="h-4 w-4 accent-ink"
                          />
                        ) : (
                          <span className="h-4 w-4 border border-ink bg-ink" aria-hidden="true" />
                        )}
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="block truncate">{memberLabel(member)}</span>
                          <span className="block truncate text-xs text-ash">{member.email}</span>
                        </span>
                        {included ? (
                          <label className="flex items-center gap-2 text-xs text-ash">
                            <input
                              type="checkbox"
                              checked={editIds.includes(member.id)}
                              onChange={() => toggleEdit(member.id)}
                              className="h-4 w-4 accent-ink"
                            />
                            Puede editar
                          </label>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        ) : null}

        <p className="border-t border-mist pt-4 text-xs leading-relaxed text-ash">
          Revocar corta el acceso futuro; no borra lo que la otra persona ya haya visto. Si hay
          miembros nuevos, vuelve a compartir para darles acceso.
        </p>

        {error ? <Alert>{error}</Alert> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar y rotar clave'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function availabilityNotice(
  visibility: Visibility,
  memberCount: number,
  ownerId: string,
  missingFamily: string[],
) {
  if (visibility === 'PRIVATE' && memberCount > 1) {
    return (
      <Alert tone="warning">
        Al pasar a «Solo yo» se revocará el acceso al resto de destinatarios.
      </Alert>
    );
  }
  if (visibility === 'FAMILY' && missingFamily.length > 0) {
    return (
      <Alert tone="warning">
        {missingFamily.length === 1
          ? 'Hay 1 miembro con bóveda que aún no tiene esta cuenta.'
          : `Hay ${missingFamily.length} miembros con bóveda que aún no tienen esta cuenta.`}
      </Alert>
    );
  }
  if (visibility !== 'PRIVATE' && memberCount <= 1) {
    return (
      <Alert tone="info">
        Todavía no hay otros miembros con bóveda. La cuenta quedará solo para ti hasta que
        alguien cree la suya y la vuelvas a compartir.
      </Alert>
    );
  }
  if (ownerId && visibility === 'CUSTOM' && missingFamily.length === 0) {
    return null;
  }
  return null;
}
