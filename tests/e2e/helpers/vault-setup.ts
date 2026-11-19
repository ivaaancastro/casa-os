import { generate } from 'otplib';
import { expect, type Page } from '@playwright/test';
import { prisma } from '../../../src/lib/prisma';

export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'admin123';
export const VAULT_PASSWORD = 'casa-os-e2e-boveda-2026-segura';

/**
 * Deja la BD local en un estado determinista para el E2E de Cuentas:
 * sin bóveda, sin passkeys y con 2FA desactivado. Se ejecuta ANTES del login
 * porque incrementa `sessionVersion` e invalidaría la sesión.
 * Solo se usa contra la BD local sembrada; nunca en producción.
 */
export async function resetVaultState(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: E2E_EMAIL } });
  if (!user) throw new Error(`No existe el usuario E2E ${E2E_EMAIL}; ejecuta npm run db:seed`);

  await prisma.vaultAccount.deleteMany({ where: { ownerId: user.id } });
  await prisma.vaultPasskey.deleteMany({ where: { userId: user.id } });
  await prisma.vaultRecovery.deleteMany({ where: { userId: user.id } });
  await prisma.vaultEvent.deleteMany({ where: { userId: user.id } });
  await prisma.vault.deleteMany({ where: { userId: user.id } });
  await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfirmedAt: null,
      sessionVersion: { increment: 1 },
    },
  });
  await prisma.$disconnect();
}

/** Login con credenciales de prueba; con 2FA activo añade el TOTP actual. */
export async function login(page: Page, totp?: () => Promise<string>): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(E2E_PASSWORD);
  if (totp) {
    await page.getByLabel(/Código 2FA/).fill(await totp());
  }
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 20_000 });
}

/** Activa el 2FA por API y devuelve una función que da el TOTP actual. */
export async function enableTwoFactor(page: Page): Promise<() => Promise<string>> {
  const response = await page.request.post('/api/2fa/setup');
  if (!response.ok()) {
    throw new Error(`No se pudo iniciar 2FA: ${await response.text()}`);
  }
  const { secret } = (await response.json()) as { secret: string };
  const code = () => generate({ secret });
  const enabled = await page.request.post('/api/2fa/enable', { data: { code: await code() } });
  if (!enabled.ok()) {
    throw new Error(`No se pudo activar 2FA: ${await enabled.text()}`);
  }
  return code;
}

/** Crea la bóveda y dos cuentas desde la UI, sin passkey. */
export async function createVaultWithAccounts(page: Page): Promise<void> {
  await page.goto('/cuentas');
  await page.getByLabel('Master password', { exact: true }).fill(VAULT_PASSWORD);
  await page.getByLabel('Repite la master password').fill(VAULT_PASSWORD);
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear bóveda' }).click();
  await page.getByRole('button', { name: 'Ahora no' }).click();
  await expectWorkspace(page);
  // Espera a que la lista (y con ella los miembros) esté cargada antes de crear.
  await page.getByText(/0 cuentas/).first().waitFor();

  await addAccount(page, {
    title: 'Correo de casa',
    username: 'familia@casa.local',
    url: 'https://mail.example.com',
    category: 'Correo',
  });
  await addAccount(page, {
    title: 'Amazon',
    username: 'ivan',
    url: 'https://amazon.es',
    category: 'Compras',
  });
}

export async function addAccount(
  page: Page,
  input: { title: string; username: string; url: string; category: string },
): Promise<void> {
  await page.getByRole('button', { name: 'Nueva cuenta' }).first().click();
  await page.getByLabel('Título').fill(input.title);
  await page.getByLabel('Usuario o email').fill(input.username);
  await page.getByLabel('Categoría', { exact: true }).selectOption(input.category);
  await page.getByLabel('Contraseña', { exact: true }).fill('clave-de-prueba-e2e-2026');
  await page.getByLabel('URL', { exact: true }).fill(input.url);
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes('/api/cuentas/accounts') &&
        candidate.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Crear cuenta' }).click(),
  ]);
  if (!response.ok()) {
    throw new Error(`No se pudo crear la cuenta de prueba: ${await response.text()}`);
  }
  await page.getByRole('dialog', { name: 'Nueva cuenta' }).waitFor({ state: 'hidden' });
}

export async function expectWorkspace(page: Page): Promise<void> {
  await page.getByRole('heading', { name: /Tus cuentas/i }).waitFor();
}

/** Desbloquea con master password + 2FA (la vía biométrica no se puede probar aquí). */
export async function unlockWithPassword(
  page: Page,
  totp: () => Promise<string>,
): Promise<void> {
  await page.getByLabel('Master password', { exact: true }).fill(VAULT_PASSWORD);
  await page.getByLabel('Código de verificación (2FA)').fill(await totp());
  await page.getByRole('button', { name: 'Desbloquear' }).click();
  await expectWorkspace(page);
}

export async function expectUnlockScreen(page: Page): Promise<void> {
  await page.getByRole('heading', { name: /Desbloquea tus cuentas/i }).waitFor();
}

/** Simula que la app pasa a segundo plano. */
export async function backgroundApp(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
