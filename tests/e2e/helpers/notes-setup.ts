import { prisma } from '../../../src/lib/prisma';

export const NOTA_COMPRA = 'Nota E2E de la compra';
export const NOTA_GENERAL = 'Nota E2E general';
export const CONTENIDO_COMPRA = 'leche-e2e, pan-e2e';

/**
 * Deja dos notas conocidas en la BD local para el E2E de Notas móvil,
 * independientemente del estado en que haya quedado la base en sesiones
 * anteriores. Solo se usa contra la BD local sembrada; nunca en producción.
 */
export async function ensureNotesForE2E(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: process.env.E2E_EMAIL ?? 'admin@casa.local' },
  });
  if (!user) throw new Error('No existe el usuario E2E; ejecuta npm run db:seed');

  const fixtures = [
    {
      id: 'e2e-nota-compra',
      title: NOTA_COMPRA,
      content: `<h1>${NOTA_COMPRA}</h1><p>${CONTENIDO_COMPRA}</p>`,
      type: 'SHOPPING',
    },
    {
      id: 'e2e-nota-general',
      title: NOTA_GENERAL,
      content: `<h1>${NOTA_GENERAL}</h1><p>Contenido de la nota general</p>`,
      type: 'GENERAL',
    },
  ];

  // Limpia artefactos de ejecuciones anteriores del propio E2E (borradores
  // duplicados y notas creadas por los tests), solo en la BD local sembrada.
  await prisma.note.deleteMany({
    where: {
      authorId: user.id,
      OR: [
        { title: '', content: { in: ['<h1></h1>', '<p></p>', '<h1></h1><p></p>'] } },
        {
          title: {
            in: [
              'Nota creada desde el móvil',
              'Tareas de prueba',
              'Pan Leche',
              'Compra de la semana',
              'Lista final auditada',
            ],
          },
        },
      ],
    },
  });

  for (const note of fixtures) {
    await prisma.note.upsert({
      where: { id: note.id },
      create: { ...note, authorId: user.id },
      update: { title: note.title, content: note.content, type: note.type },
    });
  }

  await prisma.$disconnect();
}
