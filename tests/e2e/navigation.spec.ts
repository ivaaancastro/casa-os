import { expect, test } from '@playwright/test';

/**
 * E2E de la navegación móvil con sesión real contra la BD local sembrada.
 * Requiere: docker compose up -d db && npm run db:migrate:deploy && npm run db:seed
 * y NEXTAUTH_SECRET válido en .env para el servidor bajo prueba.
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'admin123';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeVisible();
}

test.describe('navegación móvil', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
  });

  test('la tab bar tiene exactamente cuatro pestañas', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    const links = nav.getByRole('link');
    await expect(links).toHaveCount(4);

    await expect(links.nth(0)).toHaveAttribute('href', '/notas');
    await expect(links.nth(1)).toHaveAttribute('href', '/cuentas');
    await expect(links.nth(2)).toHaveAttribute('href', '/calendario');
    await expect(links.nth(3)).toHaveAttribute('href', '/perfil');
  });

  test('navegar marca la pestaña activa con aria-current', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });

    await nav.getByRole('link', { name: 'Calendario' }).click();
    await expect(page).toHaveURL(/\/calendario$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Calendario');

    await nav.getByRole('link', { name: 'Perfil' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Perfil');
  });

  test('el menú «Más» abre el drawer con el resto de secciones', async ({
    page,
  }) => {
    await page.goto('/perfil');
    await page.getByRole('button', { name: 'Más' }).click();
    const drawer = page.getByRole('dialog', { name: 'Más secciones' });
    await expect(drawer).toBeVisible();
    for (const name of ['Dashboard', 'Dispositivos', 'Familia']) {
      await expect(drawer.getByRole('link', { name })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('no hay overflow horizontal a 390 px', async ({ page }) => {
    for (const path of ['/notas', '/cuentas', '/calendario', '/perfil']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `overflow en ${path}`).toBeLessThanOrEqual(1);
    }
  });
});
