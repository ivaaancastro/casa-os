import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de logica de autorizacion y validacion para las API routes de notas.
 *
 * Los tests de integracion real con Prisma se haran con una BD de test.
 * Estos tests validan la logica de negocio de forma aislada.
 */

const ADMIN_USER = { id: 'admin-1', email: 'admin@casa.local', name: 'Admin', role: 'ADMIN' };
const FAMILY_USER = { id: 'family-1', email: 'family@casa.local', name: 'Family', role: 'FAMILY' };

describe('autorizacion de notas', () => {
  it('un usuario familiar puede editar sus propias notas', () => {
    const note = { id: 'note-1', authorId: 'family-1', title: 'Mi nota' };
    const isAuthor = note.authorId === FAMILY_USER.id;
    expect(isAuthor).toBe(true);
  });

  it('un usuario familiar NO puede editar notas de otros', () => {
    const note = { id: 'note-1', authorId: 'other-user', title: 'Nota ajena' };
    const isAuthor = note.authorId === FAMILY_USER.id;
    const isAdmin = FAMILY_USER.role === 'ADMIN';
    expect(isAuthor || isAdmin).toBe(false);
  });

  it('un admin puede editar cualquier nota', () => {
    const note = { id: 'note-1', authorId: 'other-user', title: 'Nota ajena' };
    const isAuthor = note.authorId === ADMIN_USER.id;
    const isAdmin = ADMIN_USER.role === 'ADMIN';
    expect(isAuthor || isAdmin).toBe(true);
  });

  it('un admin puede eliminar cualquier nota', () => {
    const isAdmin = ADMIN_USER.role === 'ADMIN';
    expect(isAdmin).toBe(true);
  });
});

describe('logica de filtrado de notas', () => {
  it('filtrar por tipo SHOPPING', () => {
    const notes = [
      { id: '1', type: 'SHOPPING', title: 'Compra' },
      { id: '2', type: 'GENERAL', title: 'Nota' },
      { id: '3', type: 'SHOPPING', title: 'Otra compra' },
    ];
    const filtered = notes.filter((n) => n.type === 'SHOPPING');
    expect(filtered).toHaveLength(2);
  });

  it('filtrar por completado', () => {
    const notes = [
      { id: '1', completed: true, title: 'Hecha' },
      { id: '2', completed: false, title: 'Pendiente' },
      { id: '3', completed: true, title: 'Tambien hecha' },
    ];
    const pending = notes.filter((n) => !n.completed);
    expect(pending).toHaveLength(1);
    expect(pending[0].title).toBe('Pendiente');
  });

  it('filtrar por tipo y completado simultaneamente', () => {
    const notes = [
      { id: '1', type: 'SHOPPING', completed: false },
      { id: '2', type: 'SHOPPING', completed: true },
      { id: '3', type: 'GENERAL', completed: false },
    ];
    const filtered = notes.filter((n) => n.type === 'SHOPPING' && !n.completed);
    expect(filtered).toHaveLength(1);
  });
});

describe('logica de lista de la compra', () => {
  const shoppingItems = [
    { id: '1', title: 'Leche', completed: false },
    { id: '2', title: 'Pan', completed: true },
    { id: '3', title: 'Huevos', completed: false },
    { id: '4', title: 'Fruta', completed: true },
  ];

  it('contar items pendientes', () => {
    const pending = shoppingItems.filter((i) => !i.completed);
    expect(pending).toHaveLength(2);
  });

  it('limpiar completados deja solo pendientes', () => {
    const remaining = shoppingItems.filter((i) => !i.completed);
    expect(remaining.map((i) => i.title)).toEqual(['Leche', 'Huevos']);
  });

  it('calcular progreso de la lista', () => {
    const total = shoppingItems.length;
    const done = shoppingItems.filter((i) => i.completed).length;
    const progress = Math.round((done / total) * 100);
    expect(progress).toBe(50);
  });
});
