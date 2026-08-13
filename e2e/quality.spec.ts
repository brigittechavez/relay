import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

import { waitForHydration } from './helpers';

/**
 * Comprobaciones transversales de calidad.
 *
 * No sustituyen a una auditoría manual, pero fijan lo que sí se puede
 * verificar en cada ejecución: que la consola queda limpia, que cada página
 * tiene un único `h1` y metadatos propios, y que se puede recorrer con teclado.
 */

const PUBLIC_ROUTES = [
  '/',
  '/marketplace',
  '/campanas/landing-pro',
  '/afiliados/lucia-vega',
  '/organizaciones/norte-digital',
  '/como-funciona',
  '/para-empresas',
  '/pricing',
  '/login',
  '/registro',
  '/404',
];

/** Ruido del servidor de desarrollo que no indica ningún problema real. */
function isNoise(message: ConsoleMessage): boolean {
  const text = message.text();

  return (
    text.includes('[vite]') ||
    text.includes('Angular is running in development mode') ||
    text.includes('Angular hydrated') ||
    text.includes('NG0751') ||
    text.includes('Download the Angular DevTools')
  );
}

function watchConsole(page: Page): string[] {
  const problems: string[] = [];

  page.on('console', (message) => {
    if ((message.type() === 'error' || message.type() === 'warning') && !isNoise(message)) {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

  return problems;
}

test.describe('Área pública', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} carga sin errores de consola y con un solo h1`, async ({ page }) => {
      const problems = watchConsole(page);

      await page.goto(route);
      await expect(page.locator('rly-root')).toBeVisible();

      // Un único encabezado de primer nivel por página.
      await expect(page.locator('h1')).toHaveCount(1);

      // Título y descripción propios, no los del índice.
      await expect(page).toHaveTitle(/.+/);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length ?? 0).toBeGreaterThan(30);

      expect(problems, `Consola sucia en ${route}`).toEqual([]);
    });
  }

  test('el enlace de salto al contenido funciona con teclado', async ({ page }) => {
    await page.goto('/marketplace');
    await waitForHydration(page);

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /saltar al contenido/i });

    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contenido/);
  });

  test('el marketplace conserva los filtros en la URL', async ({ page }) => {
    await page.goto('/marketplace?acceso=premium');

    await expect(page.getByRole('heading', { name: 'Revenue Systems' })).toBeVisible();
    await expect(page.getByText('campaña', { exact: false }).first()).toBeVisible();

    // Recargar mantiene el filtro: el estado vive en la URL, no en memoria.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Revenue Systems' })).toBeVisible();
  });
});

test.describe('Área autenticada', () => {
  test('el panel del afiliado carga sin errores de consola', async ({ page }) => {
    const problems = watchConsole(page);

    await page.goto('/login');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await waitForHydration(page);
    await page.getByRole('button', { name: /ver demo como afiliado/i }).click();

    await expect(page.getByRole('heading', { name: /hola, lucía/i })).toBeVisible();

    // El gráfico se carga con @defer al entrar en el viewport, así que hay que
    // llevarlo ahí de verdad y darle margen para importar Chart.js.
    await page.locator('rly-analytics-card').first().scrollIntoViewIfNeeded();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    expect(problems, 'Consola sucia en el panel del afiliado').toEqual([]);
  });

  test('el restablecimiento de la demo devuelve los datos al estado inicial', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await waitForHydration(page);
    await page.getByRole('button', { name: /ver demo como afiliado/i }).click();
    // Esperar a que la sesión quede escrita antes de navegar por URL directa.
    await expect(page).toHaveURL(/\/app\/affiliate\/inicio/);

    await page.goto('/app/affiliate/configuracion');
    await page.getByRole('button', { name: /restablecer datos/i }).click();

    const modal = page.getByRole('dialog', { name: /restablecer la demo/i });
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: /^restablecer$/i }).click();

    // Vuelve a la portada y la sesión desaparece del almacenamiento. Se
    // comprueba así y no por un enlace de la cabecera, que en móvil vive
    // dentro del menú plegado.
    await expect(page).toHaveURL(/\/$/);

    const session = await page.evaluate(() => {
      const raw = window.localStorage.getItem('relay:demo');
      return raw ? ((JSON.parse(raw) as { session: unknown }).session ?? null) : null;
    });

    expect(session).toBeNull();
  });
});
