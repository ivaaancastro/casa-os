import { describe, expect, it } from 'vitest';
import { countByFolder, filterNotes, NOTE_FOLDERS } from '../src/lib/utils/note-filter';
import type { Note } from '../src/types/note';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Compra del finde',
    content: '<p>Pan y leche</p>',
    type: 'SHOPPING',
    completed: false,
    createdAt: new Date('2026-11-18T10:00:00Z'),
    updatedAt: new Date('2026-11-18T10:00:00Z'),
    author: { id: 'u1', name: 'Iván' },
    ...overrides,
  };
}

describe('filterNotes', () => {
  const notes: Note[] = [
    makeNote({
      id: 'old-shopping',
      title: 'Compra del finde',
      content: '<p>Pan y leche</p>',
      type: 'SHOPPING',
      createdAt: new Date('2026-11-17T10:00:00Z'),
    }),
    makeNote({
      id: 'new-todo',
      title: 'Llamar al fontanero',
      content: '<p>Avería del grifo</p>',
      type: 'TODO',
      createdAt: new Date('2026-11-19T10:00:00Z'),
    }),
    makeNote({
      id: 'general',
      title: 'Ideas para el verano',
      content: '<p>Playa y lecturas</p>',
      type: 'GENERAL',
      createdAt: new Date('2026-11-18T10:00:00Z'),
    }),
  ];

  it('devuelve todas las notas ordenadas por fecha descendente', () => {
    expect(filterNotes(notes, { folder: 'ALL', query: '' }).map((n) => n.id)).toEqual([
      'new-todo',
      'general',
      'old-shopping',
    ]);
  });

  it.each([
    ['SHOPPING', 'old-shopping'],
    ['GENERAL', 'general'],
    ['TODO', 'new-todo'],
  ] as const)('filtra por carpeta %s', (folder, expectedId) => {
    const result = filterNotes(notes, { folder, query: '' });
    expect(result.map((n) => n.id)).toEqual([expectedId]);
  });

  it('busca por título sin distinguir mayúsculas', () => {
    const result = filterNotes(notes, { folder: 'ALL', query: '  COMPRA  ' });
    expect(result.map((n) => n.id)).toEqual(['old-shopping']);
  });

  it('busca por contenido', () => {
    const result = filterNotes(notes, { folder: 'ALL', query: 'grifo' });
    expect(result.map((n) => n.id)).toEqual(['new-todo']);
  });

  it('combina carpeta y búsqueda', () => {
    expect(filterNotes(notes, { folder: 'GENERAL', query: 'grifo' })).toEqual([]);
    expect(filterNotes(notes, { folder: 'SHOPPING', query: 'leche' })).toHaveLength(1);
  });

  it('devuelve una lista vacía si no hay coincidencias', () => {
    expect(filterNotes(notes, { folder: 'ALL', query: 'nada' })).toEqual([]);
    expect(filterNotes([], { folder: 'ALL', query: '' })).toEqual([]);
  });

  it('no muta el array original', () => {
    const copy = [...notes];
    filterNotes(notes, { folder: 'ALL', query: '' });
    expect(notes).toEqual(copy);
  });
});

describe('countByFolder', () => {
  it('cuenta todas y cada carpeta', () => {
    const notes = [
      makeNote({ id: '1', type: 'SHOPPING' }),
      makeNote({ id: '2', type: 'TODO' }),
      makeNote({ id: '3', type: 'TODO' }),
    ];
    expect(countByFolder(notes, 'ALL')).toBe(3);
    expect(countByFolder(notes, 'SHOPPING')).toBe(1);
    expect(countByFolder(notes, 'GENERAL')).toBe(0);
    expect(countByFolder(notes, 'TODO')).toBe(2);
  });

  it('NOTE_FOLDERS cubre las cuatro carpetas en orden', () => {
    expect(NOTE_FOLDERS.map((f) => f.value)).toEqual([
      'ALL',
      'SHOPPING',
      'GENERAL',
      'TODO',
    ]);
  });
});
