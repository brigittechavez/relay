import { expect, type Page } from '@playwright/test';

/**
 * Espera a que la página prerenderizada esté hidratada.
 *
 * Las rutas públicas llegan como HTML estático: el botón se ve y se puede
 * pulsar antes de que Angular se haya enganchado a él. Angular marca los
 * elementos con `jsaction` mientras tanto y los limpia al hidratar, así que la
 * ausencia de ese atributo es la señal exacta de que la página ya responde.
 *
 * Sin esta espera las pruebas miden la velocidad del empaquetador, no el
 * comportamiento del producto.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('[jsaction]'), null, {
    timeout: 30_000,
  });
}

/**
 * Deja la demo en su estado inicial.
 *
 * No sirve `addInitScript`: se ejecuta en cada navegación y borraría la sesión
 * a mitad del recorrido, que es justo lo que estas pruebas comprueban.
 */
export async function resetDemoState(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await waitForHydration(page);
}

export async function startAffiliateDemo(page: Page): Promise<void> {
  await resetDemoState(page);

  await page.getByRole('button', { name: /ver demo como afiliado/i }).click();
  await expect(page).toHaveURL(/\/app\/affiliate\/inicio/);
}

export async function startOrganizationDemo(page: Page): Promise<void> {
  await resetDemoState(page);

  await page.getByRole('button', { name: /ver demo como empresa/i }).click();
  await expect(page).toHaveURL(/\/app\/organization\//);
}
