import { describe, expect, it } from 'vitest';
import type { AccountPayload, VaultAccountRecord } from '../src/lib/vault/types';
import { filterAccounts, type LoadedAccount } from '../src/components/cuentas/search';

function record(id: string, visibility: VaultAccountRecord['visibility'] = 'FAMILY'): VaultAccountRecord {
  return {
    id,
    ownerId: 'user_1',
    visibility,
    ciphertext: 'YQ==',
    nonce: 'YQ==',
    revision: 1,
    canEdit: true,
    wrappedDek: 'YQ==',
    keys: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function payload(overrides: Partial<AccountPayload> = {}): AccountPayload {
  return {
    title: 'Correo de casa',
    username: 'familia@casa.local',
    password: 'secreto',
    url: 'https://mail.example.com',
    notes: 'Cuenta compartida',
    category: 'Correo',
    customFields: [],
    ...overrides,
  };
}

const accounts: LoadedAccount[] = [
  { record: record('1'), payload: payload() },
  {
    record: record('2', 'PRIVATE'),
    payload: payload({
      title: 'Amazon',
      username: 'ivan',
      url: 'https://amazon.es',
      notes: 'Tarjeta de regalo',
      category: 'Compras',
    }),
  },
  { record: record('3'), payload: null },
];

const noFilters = { query: '', category: 'todas', visibility: 'todas' } as const;

describe('filterAccounts', () => {
  it('sin filtros devuelve también los registros no descifrables', () => {
    const result = filterAccounts(accounts, noFilters);
    expect(result.map((account) => account.record.id)).toEqual(['1', '2', '3']);
  });

  it('excluye registros no descifrables cuando hay búsqueda', () => {
    const result = filterAccounts(accounts, { ...noFilters, query: 'cualquiera' });
    expect(result).toHaveLength(0);
  });

  it('busca por título, usuario, URL/página y notas', () => {
    const cases: Array<[string, string[]]> = [
      ['correo', ['1']],
      ['familia@', ['1']],
      ['amazon.es', ['2']],
      ['tarjeta de regalo', ['2']],
    ];
    for (const [query, expected] of cases) {
      const result = filterAccounts(accounts, { ...noFilters, query });
      expect(result.map((account) => account.record.id), query).toEqual(expected);
    }
  });

  it('busca sin distinguir mayúsculas y espacios', () => {
    const result = filterAccounts(accounts, { ...noFilters, query: '  CORREO DE CASA  ' });
    expect(result.map((account) => account.record.id)).toEqual(['1']);
  });

  it('filtra por categoría y visibilidad', () => {
    expect(
      filterAccounts(accounts, { ...noFilters, category: 'Compras' }).map((a) => a.record.id),
    ).toEqual(['2', '3']);
    expect(
      filterAccounts(accounts, { ...noFilters, visibility: 'PRIVATE' }).map((a) => a.record.id),
    ).toEqual(['2']);
  });

  it('combina búsqueda y filtros', () => {
    const result = filterAccounts(accounts, {
      query: 'amazon',
      category: 'Compras',
      visibility: 'PRIVATE',
    });
    expect(result.map((account) => account.record.id)).toEqual(['2']);
  });
});
