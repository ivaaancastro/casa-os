import { PrismaClient } from '@prisma/client';

/**
 * Emergencia: desactiva 2FA de un usuario por email.
 * Uso: npm run 2fa:reset -- usuario@ejemplo.com
 *
 * No imprime secretos, codigos ni la clave de cifrado.
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Uso: npm run 2fa:reset -- <email>');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error(`No existe ningun miembro con el email ${email}`);
      process.exitCode = 1;
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorConfirmedAt: null,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
    });

    console.log(`2FA desactivado para ${user.email ?? user.id}.`);
    console.log('El usuario debera configurarlo de nuevo desde /perfil.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('No se pudo desactivar 2FA.');
  if (process.env.NODE_ENV !== 'production') {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
