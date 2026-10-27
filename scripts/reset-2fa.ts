import { prisma } from '../src/lib/prisma';

const email = process.argv[2];
if (!email) {
  console.error("Uso: npm run 2fa:reset -- <email>");
  process.exit(1);
}

async function run() {
  const user = await prisma.user.update({
    where: { email },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorConfirmedAt: null, sessionVersion: { increment: 1 } }
  });
  await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
  console.log(`2FA desactivado para ${email}`);
}

run().catch(console.error);
