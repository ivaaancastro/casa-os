import bcrypt from 'bcryptjs';
import { prisma } from '../../../src/lib/prisma';

export const E2E_FAMILY_EMAIL = 'e2e-family@casa.local';
export const E2E_FAMILY_PASSWORD = 'family123';

export const DEVICE_ROUTER = 'Dispositivo E2E Router';
export const DEVICE_LAMP = 'Dispositivo E2E Lámpara';
export const DEVICE_NEW = 'Proveedor E2E (10.99.0.20)';

const ADMIN_EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';

/** JSON de escaneo con un dispositivo ya conocido y uno nuevo. */
export function scanFixture() {
  return {
    version: 1,
    scannedAt: new Date().toISOString(),
    cidr: '10.99.0.0/24',
    devices: [
      {
        ip: '10.99.0.10',
        mac: '02:00:00:00:00:10',
        vendor: 'Router E2E',
        name: DEVICE_ROUTER,
      },
      {
        ip: '10.99.0.20',
        mac: '02:00:00:00:00:20',
        vendor: 'Proveedor E2E',
      },
    ],
  };
}

/** Deja dispositivos y un usuario FAMILY deterministas; limpia los artefactos
 * de ejecuciones anteriores por id/IP (rango reservado 10.99.0.x). */
export async function ensureDevicesForE2E(): Promise<void> {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) throw new Error('No existe el usuario E2E; ejecuta npm run db:seed');

  await prisma.device.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'e2e-' } },
        { ip: { startsWith: '10.99.0.' } },
      ],
    },
  });

  await prisma.user.upsert({
    where: { email: E2E_FAMILY_EMAIL },
    create: {
      email: E2E_FAMILY_EMAIL,
      name: 'Familia E2E',
      role: 'FAMILY',
      active: true,
      password: await bcrypt.hash(E2E_FAMILY_PASSWORD, 10),
    },
    update: { role: 'FAMILY', active: true },
  });

  await prisma.device.create({
    data: {
      id: 'e2e-device-router',
      name: DEVICE_ROUTER,
      ip: '10.99.0.10',
      mac: '02:00:00:00:00:10',
      type: 'ROUTER',
      online: true,
      lastSeen: new Date(),
    },
  });

  await prisma.device.create({
    data: {
      id: 'e2e-device-lamp',
      name: DEVICE_LAMP,
      ip: '10.99.0.11',
      mac: null,
      type: 'OTHER',
      online: false,
    },
  });

  await prisma.$disconnect();
}
