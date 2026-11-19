import { expect, test } from '@playwright/test';
import {
  backgroundApp,
  createVaultWithAccounts,
  enableTwoFactor,
  expectUnlockScreen,
  expectWorkspace,
  login,
  resetVaultState,
  unlockWithPassword,
} from './helpers/vault-setup';

/**
 * Flujo completo de la Fase 2 con sesión real y BD local sembrada.
 * La biometría no se puede probar en Chromium: se verifica la vía password y
 * el ciclo de vida del desbloqueo. El auto-intento WebAuthn queda como
 * follow-up en dispositivo real (ver cierre.md).
 */
test.afterAll(async () => {
  await resetVaultState();
});

test('desbloqueo único por estancia, bloqueo al salir y búsqueda local', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });

  // globalSetup ya dejó la BD limpia. Este test activa 2FA, lo que invalida
  // la sesión: hay que volver a entrar con el código antes de crear la bóveda.
  let totp!: () => Promise<string>;

  await test.step('login, activar 2FA y preparar la bóveda', async () => {
    await login(page);
    totp = await enableTwoFactor(page);
    await login(page, totp);
    await createVaultWithAccounts(page);
  });

  await test.step('recargar pide desbloquear una vez', async () => {
    await page.goto('/cuentas');
    await expectUnlockScreen(page);
    await unlockWithPassword(page, totp);
  });

  await test.step('cambiar de pestaña dentro de la app mantiene la bóveda abierta', async () => {
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await nav.getByRole('link', { name: 'Notas' }).click();
    await expect(page).toHaveURL(/\/notas$/);
    await nav.getByRole('link', { name: 'Calendario' }).click();
    await expect(page).toHaveURL(/\/calendario$/);
    await nav.getByRole('link', { name: 'Perfil' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
    await nav.getByRole('link', { name: 'Cuentas' }).click();
    await expectWorkspace(page);
    await expect(page.getByRole('heading', { name: /Desbloquea tus cuentas/i })).toHaveCount(0);
  });

  await test.step('salir de la app bloquea y vuelve a pedir al regresar', async () => {
    await backgroundApp(page);
    await expectUnlockScreen(page);
    await unlockWithPassword(page, totp);
  });

  await test.step('la búsqueda filtra por nombre y por página/app sin recargar', async () => {
    const search = page.getByLabel('Buscar cuentas');
    await search.fill('Amazon');
    await expect(page.getByRole('button', { name: /Amazon/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Correo de casa/ })).toHaveCount(0);

    await search.fill('amazon.es');
    await expect(page.getByRole('button', { name: /Amazon/ })).toBeVisible();

    await search.fill('mail.example.com');
    await expect(page.getByRole('button', { name: /Correo de casa/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Amazon/ })).toHaveCount(0);
  });
});
