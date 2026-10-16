import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Usuario administrador inicial con contraseña hasheada
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@casa.local' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@casa.local',
      name: 'Admin Casa',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  // Notas de ejemplo (solo si no existen)
  const existingNotes = await prisma.note.count();
  if (existingNotes === 0) {
    await prisma.note.create({
      data: {
        title: 'Lista de la compra',
        content: '<p>Leche, pan, huevos, fruta</p>',
        type: 'SHOPPING',
        authorId: admin.id,
      },
    });

    await prisma.note.create({
      data: {
        title: 'Bienvenido a casa-os',
        content: '<p>Edita esta nota o bórrala. ¡Tu hogar digital comienza aquí!</p>',
        type: 'GENERAL',
        authorId: admin.id,
      },
    });
  }

  // Dispositivos de ejemplo (solo si no existen)
  const existingDevices = await prisma.device.count();
  if (existingDevices === 0) {
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
  }

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
