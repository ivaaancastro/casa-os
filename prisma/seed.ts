import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Usuario administrador inicial
  const admin = await prisma.user.upsert({
    where: { email: 'admin@casa.local' },
    update: {},
    create: {
      email: 'admin@casa.local',
      name: 'Admin Casa',
      role: 'ADMIN',
    },
  });

  // Notas de ejemplo
  await prisma.note.create({
    data: {
      title: 'Lista de la compra',
      content: 'Leche, pan, huevos, fruta',
      type: 'SHOPPING',
      authorId: admin.id,
    },
  });

  await prisma.note.create({
    data: {
      title: 'Bienvenido a casa-os',
      content: 'Edita esta nota o bórrala. ¡Tu hogar digital comienza aquí!',
      type: 'GENERAL',
      authorId: admin.id,
    },
  });

  // Dispositivos de ejemplo
  await prisma.device.create({
    data: {
      name: 'Router Principal',
      ip: '192.168.1.1',
      type: 'ROUTER',
      online: true,
      lastSeen: new Date(),
      ownerId: admin.id,
    },
  });

  console.log('Base de datos poblada con datos iniciales.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
