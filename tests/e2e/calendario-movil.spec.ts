import { expect, test, type Page } from '@playwright/test';
import {
  ensureEventsForE2E,
  EVENT_ALLDAY_TITLE,
  EVENT_TIMED_TITLE,
  todayKey,
} from './helpers/events-setup';

/**
 * E2E de Calendario móvil con sesión real contra la BD local sembrada.
 * Requiere: docker compose up -d db && npm run db:migrate:deploy && npm run db:seed
 */
const EMAIL = process.env.E2E_EMAIL ?? 'admin@casa.local';
const PASSWORD = process.env.E2E_PASSWORD ?? 'admin123';
const CREATED_TITLE = 'Evento E2E creado móvil';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }),
  ).toBeVisible();
}

test.describe('calendario móvil', () => {
  test.beforeAll(async () => {
    await ensureEventsForE2E();
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto('/calendario');
    await expect(page.getByTestId('calendar-mobile-month')).toBeVisible();
  });

  test('entrar muestra la rejilla de mes con chips de evento', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Calendario', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(EVENT_TIMED_TITLE).first()).toBeVisible();
    await expect(page.getByText(EVENT_ALLDAY_TITLE).first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('navegar entre meses y cambiar a semana y vuelta', async ({ page }) => {
    const initialTitle = await page.locator('header h2').textContent();
    await page.getByRole('button', { name: 'Mes anterior' }).click();
    await expect(page.locator('header h2')).not.toHaveText(initialTitle ?? '');

    await page.getByRole('button', { name: 'Hoy' }).click();
    await expect(page.locator('header h2')).toHaveText(initialTitle ?? '');

    const semana = page.getByRole('button', { name: 'Semana', exact: true });
    await semana.click();
    await expect(semana).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('calendar-mobile-week')).toBeVisible();

    await page.getByRole('button', { name: 'Mes', exact: true }).click();
    await expect(page.getByTestId('calendar-mobile-month')).toBeVisible();
  });

  test('tocar un día abre la agenda y un chip abre el detalle', async ({ page }) => {
    const now = new Date();
    const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(now);
    const dayButton = page.getByRole('button', {
      name: `Abrir el día ${now.getDate()} de ${weekday}`,
      exact: true,
    }).first();

    await dayButton.click({ position: { x: 40, y: 6 } });

    const agenda = page.getByTestId('calendar-mobile-agenda');
    await expect(agenda).toBeVisible();
    await expect(agenda.getByText(EVENT_TIMED_TITLE)).toBeVisible();

    await agenda.getByText(EVENT_TIMED_TITLE).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detalle del evento' })).toBeVisible();
    await page.getByLabel('Cerrar', { exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('el FAB crea un evento y se puede borrar desde el detalle', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo evento' }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo evento' })).toBeVisible();
    await page.getByLabel('Título').fill(CREATED_TITLE);
    await page.getByRole('button', { name: 'Crear evento' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(page.getByText(CREATED_TITLE).first()).toBeVisible({ timeout: 10_000 });

    // Limpieza: se abre y se elimina para no acumular eventos entre runs.
    await page.getByText(CREATED_TITLE).first().click();
    await expect(page.getByRole('heading', { name: 'Detalle del evento' })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.getByRole('button', { name: 'Sí', exact: true }).click();
    await expect(page.getByText(CREATED_TITLE).first()).toHaveCount(0, { timeout: 10_000 });
  });

  test('el deep link ?date= selecciona el día', async ({ page }) => {
    const dateKey = todayKey();
    await page.goto(`/calendario?date=${dateKey}`);
    await expect(page.getByTestId('calendar-mobile-agenda')).toBeVisible();
    await expect(
      page.getByTestId('calendar-mobile-agenda').getByText(EVENT_TIMED_TITLE),
    ).toBeVisible();
  });

  test('el panel Avisos se abre desde la toolbar en móvil', async ({ page }) => {
    await page.getByRole('button', { name: 'Avisos' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Avisos', exact: true })).toBeVisible();

    // En desarrollo el SW no se registra: se comprueba el estado, no el envío.
    await expect(dialog.getByText(/Los avisos se activan en la versión publicada/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  });

  test('objetivos táctiles de al menos 44 px en móvil', async ({ page }) => {
    const heights = await page.evaluate(() => {
      const height = (selector: string) => {
        const element = document.querySelector(selector);
        return element ? element.getBoundingClientRect().height : 0;
      };
      return {
        nav: height('.date-nav'),
        view: height('[role="group"][aria-label="Vista del calendario"] button'),
        fab: height('button[aria-label="Nuevo evento"]'),
      };
    });

    expect(heights.nav).toBeGreaterThanOrEqual(44);
    expect(heights.view).toBeGreaterThanOrEqual(44);
    expect(heights.fab).toBeGreaterThanOrEqual(44);
  });
});
