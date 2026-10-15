import { describe, it, expect } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesSchema,
} from '@/lib/schemas/note';

describe('createNoteSchema', () => {
  it('debe validar una nota correcta', () => {
    const result = createNoteSchema.safeParse({
      title: 'Lista de la compra',
      content: 'Leche, pan, huevos',
      type: 'SHOPPING',
    });
    expect(result.success).toBe(true);
  });

  it('debe rechazar titulo corto', () => {
    const result = createNoteSchema.safeParse({
      title: 'ab',
      content: 'Contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar titulo vacio', () => {
    const result = createNoteSchema.safeParse({
      title: '',
      content: 'Contenido',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar contenido vacio', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: '',
      type: 'GENERAL',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar tipo invalido', () => {
    const result = createNoteSchema.safeParse({
      title: 'Titulo valido',
      content: 'Contenido',
      type: 'INVALIDO',
    });
    expect(result.success).toBe(false);
  });

  it('debe aceptar todos los tipos validos', () => {
    for (const type of ['SHOPPING', 'GENERAL', 'TODO']) {
      const result = createNoteSchema.safeParse({
        title: 'Titulo valido',
        content: 'Contenido',
        type,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateNoteSchema', () => {
  it('debe validar actualizacion parcial', () => {
    const result = updateNoteSchema.safeParse({
      completed: true,
    });
    expect(result.success).toBe(true);
  });

  it('debe validar actualizacion completa', () => {
    const result = updateNoteSchema.safeParse({
      title: 'Nuevo titulo',
      content: 'Nuevo contenido',
      type: 'TODO',
      completed: true,
    });
    expect(result.success).toBe(true);
  });

  it('debe rechazar titulo corto en update', () => {
    const result = updateNoteSchema.safeParse({
      title: 'ab',
    });
    expect(result.success).toBe(false);
  });

  it('debe rechazar tipo invalido en update', () => {
    const result = updateNoteSchema.safeParse({
      type: 'INVALIDO',
    });
    expect(result.success).toBe(false);
  });

  it('debe aceptar objeto vacio (nada que actualizar)', () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('listNotesSchema', () => {
  it('debe validar sin filtros', () => {
    const result = listNotesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('debe validar filtro por tipo', () => {
    const result = listNotesSchema.safeParse({ type: 'SHOPPING' });
    expect(result.success).toBe(true);
  });

  it('debe validar filtro por completado', () => {
    const result = listNotesSchema.safeParse({ completed: 'true' });
    expect(result.success).toBe(true);
  });

  it('debe transformar string "true" a boolean true', () => {
    const result = listNotesSchema.safeParse({ completed: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed).toBe(true);
    }
  });

  it('debe transformar string "false" a boolean false', () => {
    const result = listNotesSchema.safeParse({ completed: 'false' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed).toBe(false);
    }
  });

  it('debe rechazar tipo invalido', () => {
    const result = listNotesSchema.safeParse({ type: 'INVALIDO' });
    expect(result.success).toBe(false);
  });
});
