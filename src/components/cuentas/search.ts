import type { Visibility } from '@/lib/vault/constants';
import type { VaultAccountRecord } from '@/lib/vault/types';
import type { DecryptedAccount } from './account-crypto';

/** Una cuenta puede no descifrarse: se muestra el registro sin payload. */
export type LoadedAccount =
  | DecryptedAccount
  | { record: VaultAccountRecord; payload: null };

export type AccountFilters = {
  query: string;
  category: string;
  visibility: 'todas' | Visibility;
};

/**
 * Filtra las cuentas ya descifradas, íntegramente en el navegador.
 * El servidor nunca recibe el término de búsqueda. Extraído de VaultWorkspace
 * para poder probarlo sin montar React.
 */
export function filterAccounts(
  accounts: LoadedAccount[],
  { query, category, visibility }: AccountFilters,
): LoadedAccount[] {
  const term = query.trim().toLowerCase();
  return accounts.filter((account) => {
    if (visibility !== 'todas' && account.record.visibility !== visibility) {
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
}
