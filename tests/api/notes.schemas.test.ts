import { describe, it, expect } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesSchema,
  NOTE_TYPES,
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

  it('rechaza titulo con menos de 3 caracteres', () => {
    const result = createNoteSchema.safeParse({
      title: 'ab',
      content: 'contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza titulo con mas de 100 caracteres', () => {
    const result = createNoteSchema.safeParse({
      title: 'a'.repeat(101),
      content: 'contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contenido vacio', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: '',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza contenido con mas de 2000 caracteres', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: 'a'.repeat(2001),
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

  it('rechaza title ausente', () => {
    const result = createNoteSchema.safeParse({
      content: 'contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza content ausente', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      type: 'GENERAL',
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

  it('acepta solo completed', () => {
    const result = updateNoteSchema.safeParse({ completed: true });
    expect(result.success).toBe(true);
  });

  it('rechaza title corto si se envia', () => {
    const result = updateNoteSchema.safeParse({ title: 'ab' });
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
