import { expect, test, type Page } from '@playwright/test';
import {
  DEVICE_LAMP,
  DEVICE_NEW,
  DEVICE_ROUTER,
  E2E_FAMILY_EMAIL,
  E2E_FAMILY_PASSWORD,
  ensureDevicesForE2E,
  scanFixture,
} from './helpers/devices-setup';

/**
 * E2E de Dispositivos móvil con sesión real contra la BD local sembrada.
 * Requiere: docker compose up -d db && npm run db:migrate:deploy && npm run db:seed
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'admin123';

async function login(page: Page, email = EMAIL, password = PASSWORD) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }),
  ).toBeVisible();
}

test.describe('dispositivos móvil', () => {
  test.beforeAll(async () => {
    await ensureDevicesForE2E();
  });

  // Restaura los fixtures después de cada prueba que crea/edita/borra datos.
  test.afterEach(async () => {
    await ensureDevicesForE2E();
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto('/devices');
    await expect(page.getByTestId('devices-mobile-list')).toBeVisible();
  });

  test('entrar muestra la lista de tarjetas sin overflow', async ({ page }) => {
    await expect(page.getByText(DEVICE_ROUTER)).toBeVisible();
    await expect(page.getByText(DEVICE_LAMP)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const font = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? getComputedStyle(h1).fontFamily : '';
    });
    expect(font).toContain('Jost');
  });

  test('el FAB abre las acciones y permite dar de alta', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir dispositivo' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Añadir dispositivo' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo dispositivo' })).toBeVisible();

    const form = page.getByRole('dialog');
    await form.getByLabel('Nombre').fill('Dispositivo E2E nuevo');
    await form.getByLabel('IP', { exact: true }).fill('10.99.0.30');
    await form.getByRole('button', { name: 'Añadir', exact: true }).click();

    await expect(form).toHaveCount(0);
    await expect(page.getByText('Dispositivo E2E nuevo')).toBeVisible({ timeout: 10_000 });
  });

  test('editar desde la hoja inferior guarda el cambio', async ({ page }) => {
    const card = page.getByText(DEVICE_LAMP).locator('..').locator('..');
    await card.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar dispositivo' })).toBeVisible();

    const form = page.getByRole('dialog');
    await form.getByLabel('Nombre').fill('Dispositivo E2E editado');
    await form.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(form).toHaveCount(0);
    await expect(page.getByText('Dispositivo E2E editado')).toBeVisible({ timeout: 10_000 });
  });

  test('el borrado en dos pasos elimina el dispositivo', async ({ page }) => {
    const card = page.getByText(DEVICE_LAMP).locator('..').locator('..');
    await card.getByRole('button', { name: 'Eliminar' }).click();
    await card.getByRole('button', { name: 'Sí', exact: true }).click();

    await expect(page.getByText(DEVICE_LAMP)).toHaveCount(0, { timeout: 10_000 });
  });

  test('importar un escaneo muestra el preview y aplica los cambios', async ({ page }) => {
    await page.getByRole('button', { name: 'Añadir dispositivo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Importar escaneo' }).click();
    await expect(page.getByRole('heading', { name: 'Importar escaneo' })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'scan-latest.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(scanFixture())),
    });

    await expect(page.getByText('Estado tras aplicar')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Importar 1 nuevo/ }).click();

    await expect(page.getByText(/Escaneo aplicado/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEVICE_NEW)).toBeVisible({ timeout: 15_000 });
  });

  test('copiar comando anuncia el resultado', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-write']);
    await page.getByRole('button', { name: 'Añadir dispositivo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Importar escaneo' }).click();

    await page.getByRole('button', { name: 'Copiar comando' }).click();
    await expect(page.getByText('Comando copiado')).toBeVisible();
  });

  test('FAMILY ve la lista pero no acciones de escritura', async ({ page }) => {
    await login(page, E2E_FAMILY_EMAIL, E2E_FAMILY_PASSWORD);
    await page.goto('/devices');
    await expect(page.getByTestId('devices-mobile-list')).toBeVisible();
    await expect(page.getByText(DEVICE_ROUTER)).toBeVisible();
    await expect(
      page.getByText('Solo los administradores pueden editar el inventario.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Añadir dispositivo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);
  });

  test('objetivos táctiles de al menos 44 px', async ({ page }) => {
    const heights = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="devices-mobile-list"]');
      const button = list?.querySelector('button');
      const fab = document.querySelector('button[aria-label="Añadir dispositivo"]');
      return {
        action: button ? button.getBoundingClientRect().height : 0,
        fab: fab ? fab.getBoundingClientRect().height : 0,
      };
    });

    expect(heights.action).toBeGreaterThanOrEqual(44);
    expect(heights.fab).toBeGreaterThanOrEqual(44);
  });
});
