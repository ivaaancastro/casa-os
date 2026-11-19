import { expect, test, type Page } from '@playwright/test';
import {
  ensureNotesForE2E,
  NOTA_COMPRA,
  NOTA_GENERAL,
} from './helpers/notes-setup';

/**
 * E2E de Notas móvil con sesión real contra la BD local sembrada.
 * Requiere: docker compose up -d db && npm run db:migrate:deploy && npm run db:seed
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'admin123';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' })
  ).toBeVisible();
}

test.describe('notas móvil', () => {
  test.beforeAll(async () => {
    await ensureNotesForE2E();
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto('/notas');
    await expect(page.getByTestId('notes-mobile-list')).toBeVisible();
  });

  test('entrar muestra la lista, no el editor vacío', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Notas', exact: true })).toBeVisible();
    await expect(page.getByText(NOTA_COMPRA).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Volver a la lista de notas' })
    ).toHaveCount(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('la búsqueda filtra por contenido sin peticiones por tecla', async ({ page }) => {
    const notesRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/notes')) notesRequests.push(request.url());
    });

    const search = page.getByRole('textbox', { name: 'Buscar notas' });
    await search.fill('leche-e2e');

    await expect(page.getByText(NOTA_COMPRA).first()).toBeVisible();
    await expect(page.getByText(NOTA_GENERAL).first()).toHaveCount(0);
    expect(notesRequests).toEqual([]);

    await search.fill('no-existe');
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });

  test('los chips de carpeta filtran y vuelven a «Todas»', async ({ page }) => {
    const compra = page.getByRole('button', { name: /Compra/ });
    await compra.click();
    await expect(compra).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(NOTA_COMPRA).first()).toBeVisible();
    await expect(page.getByText(NOTA_GENERAL).first()).toHaveCount(0);

    await page.getByRole('button', { name: /Todas/ }).click();
    await expect(page.getByText(NOTA_GENERAL).first()).toBeVisible();
  });

  test('abrir una nota y volver conserva la búsqueda', async ({ page }) => {
    const search = page.getByRole('textbox', { name: 'Buscar notas' });
    await search.fill('leche-e2e');
    await page.getByText(NOTA_COMPRA).first().click();

    await expect(
      page.getByRole('button', { name: 'Volver a la lista de notas' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Más formato' })).toBeVisible();

    await page.getByRole('button', { name: 'Volver a la lista de notas' }).click();
    await expect(page.getByTestId('notes-mobile-list')).toBeVisible();
    await expect(search).toHaveValue('leche-e2e');
    await expect(page.getByText(NOTA_COMPRA).first()).toBeVisible();
  });

  test('el FAB crea una nota y «Más formato» abre el toolbar completo', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva nota' }).click();
    await expect(
      page.getByRole('button', { name: 'Volver a la lista de notas' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Más formato' })).toBeVisible();

    await page.getByRole('button', { name: 'Más formato' }).click();
    await expect(page.getByRole('button', { name: 'Menos formato' })).toBeVisible();
    await expect(page.getByLabel('Estilo')).toBeVisible();
    await page.getByRole('button', { name: 'Menos formato' }).click();
    await expect(page.getByRole('button', { name: 'Más formato' })).toBeVisible();

    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Nota creada desde el móvil');
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('section[aria-label="Editar nota"] > div').first()
    ).toContainText('Nota creada desde el móvil');

    await page.getByRole('button', { name: 'Volver a la lista de notas' }).click();
    await expect(page.getByText('Nota creada desde el móvil').first()).toBeVisible();

    // Limpieza: se abre y se borra para no acumular notas entre runs.
    await page.getByText('Nota creada desde el móvil').first().click();
    await page.getByRole('button', { name: 'Eliminar nota' }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByTestId('notes-mobile-list')).toBeVisible();
  });

  test('el checklist tiene objetivos táctiles y se puede marcar', async ({ page }) => {
    await page.getByRole('button', { name: 'Nueva nota' }).click();
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Tareas de prueba');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Lista de tareas' }).click();
    await page.keyboard.type('Pan');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Leche');
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 10_000 });

    const checkboxes = page.locator(
      '.ProseMirror ul[data-type="taskList"] input[type="checkbox"]'
    );
    await expect(checkboxes).toHaveCount(2);
    const labelHeight = await checkboxes.first().evaluate((input) => {
      const label = input.closest('label');
      return label ? label.getBoundingClientRect().height : 0;
    });
    expect(labelHeight).toBeGreaterThanOrEqual(44);

    await checkboxes.first().check();
    await expect(checkboxes.first()).toBeChecked();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 10_000 });

    // Limpieza.
    await page.getByRole('button', { name: 'Volver a la lista de notas' }).click();
    await page.getByText('Tareas de prueba').first().click();
    await page.getByRole('button', { name: 'Eliminar nota' }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByTestId('notes-mobile-list')).toBeVisible();
  });
});
