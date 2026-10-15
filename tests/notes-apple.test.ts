import { describe, it, expect } from 'vitest';

/**
 * Tests de logica de filtrado y busqueda para Apple Notes.
 * Valida la logica que se usa en NotesLayout.
 */

interface TestNote {
  id: string;
  title: string;
  content: string;
  type: 'SHOPPING' | 'GENERAL' | 'TODO';
  completed: boolean;
  createdAt: string;
  author: { id: string; name: string | null };
}

const mockNotes: TestNote[] = [
  { id: '1', title: 'Lista compra', content: 'Leche pan huevos', type: 'SHOPPING', completed: false, createdAt: '2026-10-15T10:00:00Z', author: { id: 'u1', name: 'Ivan' } },
  { id: '2', title: 'Ideas casa', content: 'Pintar salon azul', type: 'GENERAL', completed: false, createdAt: '2026-10-14T10:00:00Z', author: { id: 'u1', name: 'Ivan' } },
  { id: '3', title: 'Pendientes', content: 'Llamar medico', type: 'TODO', completed: true, createdAt: '2026-10-13T10:00:00Z', author: { id: 'u2', name: 'Maria' } },
  { id: '4', title: 'Compra mensual', content: 'Arroz pasta aceite', type: 'SHOPPING', completed: true, createdAt: '2026-10-12T10:00:00Z', author: { id: 'u1', name: 'Ivan' } },
];

describe('NotesLayout - filtrado por carpeta', () => {
  function filterByFolder(notes: TestNote[], folder: 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO'): TestNote[] {
    if (folder === 'ALL') return notes;
    return notes.filter((n) => n.type === folder);
  }

  it('ALL devuelve todas las notas', () => {
    expect(filterByFolder(mockNotes, 'ALL')).toHaveLength(4);
  });

  it('SHOPPING filtra solo notas de compra', () => {
    const result = filterByFolder(mockNotes, 'SHOPPING');
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.type === 'SHOPPING')).toBe(true);
  });

  it('TODO filtra solo pendientes', () => {
    const result = filterByFolder(mockNotes, 'TODO');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pendientes');
  });
});

describe('NotesLayout - busqueda', () => {
  function searchNotes(notes: TestNote[], query: string): TestNote[] {
    const q = query.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }

  it('busca por titulo', () => {
    const result = searchNotes(mockNotes, 'compra');
    expect(result).toHaveLength(2);
  });

  it('busca por contenido', () => {
    const result = searchNotes(mockNotes, 'medico');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Pendientes');
  });

  it('busqueda case-insensitive', () => {
    const result = searchNotes(mockNotes, 'LECHE');
    expect(result).toHaveLength(1);
  });

  it('busqueda vacia devuelve todo', () => {
    const result = searchNotes(mockNotes, '');
    expect(result).toHaveLength(4);
  });
});

describe('NotesLayout - contadores de carpetas', () => {
  function getCount(notes: TestNote[], folder: 'ALL' | 'SHOPPING' | 'GENERAL' | 'TODO'): number {
    if (folder === 'ALL') return notes.length;
    return notes.filter((n) => n.type === folder).length;
  }

  it('conta correctamente cada carpeta', () => {
    expect(getCount(mockNotes, 'ALL')).toBe(4);
    expect(getCount(mockNotes, 'SHOPPING')).toBe(2);
    expect(getCount(mockNotes, 'GENERAL')).toBe(1);
    expect(getCount(mockNotes, 'TODO')).toBe(1);
  });
});

describe('NotesLayout - ordenacion', () => {
  function sortNotes(notes: TestNote[]): TestNote[] {
    return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  it('ordena por fecha descendente', () => {
    const sorted = sortNotes(mockNotes);
    expect(sorted[0].id).toBe('1');
    expect(sorted[3].id).toBe('4');
  });
});
