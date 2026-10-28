'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ACCOUNT_CATEGORIES,
  VISIBILITY_LABEL,
  type Visibility,
} from '@/lib/vault/constants';
import type {
  VaultAccountRecord,
  VaultMember,
  VaultStatusResponse,
} from '@/lib/vault/types';
import {
  decryptRecords,
  memberLabel,
  membersWithVault,
  type DecryptedAccount,
} from './account-crypto';
import { AccountDialog } from './AccountDialog';
import { VaultApiError, errorMessage, vaultFetch } from './api';
import { ShareDialog } from './ShareDialog';
import type { VaultSession } from './session';
import { Alert, Button, Spinner } from './ui';
import { VaultSettings } from './VaultSettings';

type VaultBlob = NonNullable<VaultStatusResponse['vault']>;

type LoadedAccount =
  | DecryptedAccount
  | { record: VaultAccountRecord; payload: null };

export function VaultWorkspace({
  status,
  session,
  userId,
  email,
  onLocked,
  onRefreshStatus,
  onSessionReplaced,
  onVaultDeleted,
}: {
  status: VaultStatusResponse & { vault: VaultBlob };
  session: VaultSession;
  userId: string;
  email: string;
  onLocked: (notice: string) => void;
  onRefreshStatus: () => Promise<void>;
  onSessionReplaced: (session: VaultSession) => void;
  onVaultDeleted: () => Promise<void>;
}) {
  const [accounts, setAccounts] = useState<LoadedAccount[] | null>(null);
  const [members, setMembers] = useState<VaultMember[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const [visibilityFilter, setVisibilityFilter] = useState<'todas' | Visibility>('todas');
  const [dialog, setDialog] = useState<{ mode: 'create' | 'view' | 'edit'; account?: DecryptedAccount } | null>(null);
  const [share, setShare] = useState<DecryptedAccount | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountResult, memberResult] = await Promise.all([
        vaultFetch<{ accounts: VaultAccountRecord[] }>('/api/cuentas/accounts'),
        vaultFetch<{ members: VaultMember[] }>('/api/cuentas/members'),
      ]);
      const decrypted = await decryptRecords(accountResult.accounts, session);
      setAccounts(decrypted);
      setMembers(memberResult.members);
    } catch (err) {
      if (err instanceof VaultApiError && err.status === 401) {
        onLocked('La bóveda se ha bloqueado. Vuelve a desbloquearla para continuar.');
        return;
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [session, onLocked]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const allMembers = useMemo(() => members ?? [], [members]);
  const ownerId = userId;
  const familyMissing = useMemo(() => {
    if (!accounts) return 0;
    const withVault = new Set(
      membersWithVault(allMembers)
        .map((member) => member.id)
        .filter((id) => id !== ownerId),
    );
    return accounts.filter((account) => {
      if (account.record.visibility !== 'FAMILY') return false;
      const included = new Set(account.record.keys.map((key) => key.userId));
      return Array.from(withVault).some((id) => !included.has(id));
    }).length;
  }, [accounts, allMembers, ownerId]);

  const filtered = useMemo(() => {
    if (!accounts) return [];
    const term = query.trim().toLowerCase();
    return accounts.filter((account) => {
      if (visibilityFilter !== 'todas' && account.record.visibility !== visibilityFilter) {
        return false;
      }
      if (!account.payload) return term.length === 0;
      if (category !== 'todas' && account.payload.category !== category) return false;
      if (!term) return true;
      const haystack = [
        account.payload.title,
        account.payload.username,
        account.payload.url,
        account.payload.notes,
        account.payload.category,
      ]
        .join('\n')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [accounts, query, category, visibilityFilter]);

  async function deleteAccount(account: DecryptedAccount) {
    setDeleting(account.record.id);
    try {
      await vaultFetch(`/api/cuentas/accounts/${account.record.id}`, { method: 'DELETE' });
      await refresh();
    } finally {
      setDeleting(null);
    }
  }

  const memberById = useMemo(
    () => new Map(allMembers.map((member) => [member.id, member])),
    [allMembers],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 md:py-10 lg:px-16">
      <header className="flex flex-wrap items-end justify-between gap-4 border-t border-mist pt-7">
        <div>
          <p className="text-xs tracking-wider2 text-ash">Cuentas · bóveda zero-knowledge</p>
          <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-editorial md:text-5xl">
            Tus cuentas.
          </h1>
          <p className="mt-3 text-sm text-ash">
            {accounts ? `${accounts.length} cuenta${accounts.length === 1 ? '' : 's'}` : 'Cargando'} ·{' '}
            se bloquea sola por inactividad
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setDialog({ mode: 'create' })}>
            Nueva cuenta
          </Button>
          <Button type="button" variant="ghost" onClick={() => setSettingsOpen(true)}>
            Ajustes
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onLocked('Bóveda bloqueada. Introduce la master password para volver.')}
          >
            Bloquear
          </Button>
        </div>
      </header>

      {familyMissing > 0 ? (
        <div className="mt-5">
          <Alert tone="warning">
            {familyMissing === 1
              ? 'Hay 1 cuenta de familia con miembros nuevos sin acceso.'
              : `Hay ${familyMissing} cuentas de familia con miembros nuevos sin acceso.`}{' '}
            Abre cada cuenta y pulsa «Volver a compartir» para incluir a los miembros con bóveda.
          </Alert>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 border-y border-mist py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="sr-only" htmlFor="cuentas-search">
          Buscar cuentas
        </label>
        <input
          id="cuentas-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título, usuario, URL o notas"
          className="w-full border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
        />
        <label className="sr-only" htmlFor="cuentas-category">
          Filtrar por categoría
        </label>
        <select
          id="cuentas-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
        >
          <option value="todas">Todas las categorías</option>
          {ACCOUNT_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="cuentas-visibility">
          Filtrar por visibilidad
        </label>
        <select
          id="cuentas-visibility"
          value={visibilityFilter}
          onChange={(event) =>
            setVisibilityFilter(event.target.value as 'todas' | Visibility)
          }
          className="border border-mist bg-canvas px-3 py-2.5 text-sm outline-none focus:border-ink"
        >
          <option value="todas">Toda visibilidad</option>
          {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((value) => (
            <option key={value} value={value}>
              {VISIBILITY_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mt-5">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {loading && !accounts ? (
        <div className="py-16">
          <Spinner label="Descifrando tus cuentas en este navegador" />
        </div>
      ) : null}

      {accounts && filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl tracking-editorial">
            {accounts.length === 0 ? 'La bóveda está vacía.' : 'No hay cuentas que coincidan.'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ash">
            {accounts.length === 0
              ? 'Crea la primera cuenta. Se cifra en este navegador antes de salir.'
              : 'Prueba con otra búsqueda o cambia los filtros.'}
          </p>
          {accounts.length === 0 ? (
            <div className="mt-5">
              <Button type="button" onClick={() => setDialog({ mode: 'create' })}>
                Nueva cuenta
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((account) => {
            const owner = memberById.get(account.record.ownerId);
            const isOwner = account.record.ownerId === ownerId;
            const shared = account.record.keys.length > 1;
            return (
              <li key={account.record.id}>
                <button
                  type="button"
                  onClick={() =>
                    account.payload
                      ? setDialog({ mode: 'view', account })
                      : undefined
                  }
                  disabled={!account.payload}
                  className="flex h-full w-full flex-col items-start gap-3 border border-mist p-5 text-left transition-colors hover:border-ink disabled:cursor-default disabled:hover:border-mist"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-xl tracking-editorial">
                        {account.payload ? account.payload.title : 'No se pudo descifrar'}
                      </span>
                      <span className="mt-1 block truncate text-sm text-ash">
                        {account.payload
                          ? account.payload.username || 'Sin usuario'
                          : 'Clave de la cuenta no válida'}
                      </span>
                    </span>
                    <span className="shrink-0 border border-mist px-2 py-1 text-[10px] tracking-wider2 text-ash">
                      {VISIBILITY_LABEL[account.record.visibility]}
                    </span>
                  </div>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-ash">
                    {account.payload ? <span>{account.payload.category}</span> : null}
                    {shared ? <span>· Compartida</span> : null}
                    {!isOwner && owner ? <span>· De {memberLabel(owner)}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {dialog ? (
        <AccountDialog
          mode={dialog.mode}
          account={dialog.account}
          members={allMembers}
          ownerId={ownerId}
          session={session}
          onClose={() => setDialog(null)}
          onSaved={refresh}
          onShare={(account) => {
            setDialog(null);
            setShare(account);
          }}
          onDelete={async (account) => {
            await deleteAccount(account);
          }}
        />
      ) : null}

      {share ? (
        <ShareDialog
          account={share}
          members={allMembers}
          ownerId={ownerId}
          onClose={() => setShare(null)}
          onSaved={refresh}
        />
      ) : null}

      {settingsOpen ? (
        <VaultSettings
          vault={status.vault}
          email={email}
          members={allMembers}
          session={session}
          onClose={() => setSettingsOpen(false)}
          onChanged={onRefreshStatus}
          onSessionReplaced={onSessionReplaced}
          onVaultDeleted={onVaultDeleted}
        />
      ) : null}

      {deleting ? (
        <p className="sr-only" role="status">
          Borrando cuenta
        </p>
      ) : null}
    </div>
  );
}
