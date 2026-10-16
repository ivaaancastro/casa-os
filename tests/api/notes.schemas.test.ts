import { describe, it, expect } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesSchema,
  NOTE_TYPES,
  NOTE_TITLE_MAX,
  NOTE_CONTENT_MAX,
} from '../../src/lib/schemas/note';

describe('schemas - createNoteSchema', () => {
  it('acepta datos validos', () => {
    const result = createNoteSchema.safeParse({
      title: 'Lista de la compra',
      content: 'Leche, pan',
      type: 'SHOPPING',
    });
    expect(result.success).toBe(true);
  });

  it.each(NOTE_TYPES)('acepta tipo %s', (type) => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido largo',
      content: 'contenido valido',
      type,
    });
    expect(result.success).toBe(true);
  });

  it('acepta titulo vacio (la nota se crea y se rellena despues)', () => {
    const result = createNoteSchema.safeParse({
      title: '',
      content: '',
      type: 'GENERAL',
    });
    expect(result.success).toBe(true);
  });

  it('por defecto titulo y contenido son cadena vacia', () => {
    const result = createNoteSchema.safeParse({ type: 'GENERAL' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('');
      expect(result.data.content).toBe('');
    }
  });

  it(`rechaza titulo con mas de ${NOTE_TITLE_MAX} caracteres`, () => {
    const result = createNoteSchema.safeParse({
      title: 'a'.repeat(NOTE_TITLE_MAX + 1),
      content: 'contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it(`rechaza contenido con mas de ${NOTE_CONTENT_MAX} caracteres`, () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: 'a'.repeat(NOTE_CONTENT_MAX + 1),
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza tipo invalido', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: 'contenido',
      type: 'INVALIDO' as never,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza type ausente', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: 'contenido',
    });
    expect(result.success).toBe(false);
  });
});

describe('schemas - updateNoteSchema', () => {
  it('acepta objeto vacio (campos opcionales)', () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('acepta solo title', () => {
    const result = updateNoteSchema.safeParse({ title: 'Nuevo titulo' });
    expect(result.success).toBe(true);
  });

  it('acepta titulo vacio (primera linea en blanco)', () => {
    const result = updateNoteSchema.safeParse({ title: '' });
    expect(result.success).toBe(true);
  });

  it('acepta solo completed', () => {
    const result = updateNoteSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it(`rechaza title con mas de ${NOTE_TITLE_MAX} caracteres`, () => {
    const result = updateNoteSchema.safeParse({ title: 'a'.repeat(NOTE_TITLE_MAX + 1) });
    expect(result.success).toBe(false);
  });

  it('acepta completed boolean false', () => {
    const result = updateNoteSchema.safeParse({ completed: false });
    expect(result.success).toBe(true);
  });

  it('rechaza completed no-boolean', () => {
    const result = updateNoteSchema.safeParse({ completed: 'true' as never });
    expect(result.success).toBe(false);
  });
});

describe('schemas - listNotesSchema', () => {
  it('acepta objeto vacio', () => {
    const result = listNotesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('transforma completed=true a boolean', () => {
    const result = listNotesSchema.safeParse({ completed: 'true' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.completed).toBe(true);
  });

  it('transforma completed=false a boolean', () => {
    const result = listNotesSchema.safeParse({ completed: 'false' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.completed).toBe(false);
  });

  it('rechaza type invalido', () => {
    const result = listNotesSchema.safeParse({ type: 'X' });
    expect(result.success).toBe(false);
  });
});
