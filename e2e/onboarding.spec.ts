import { expect, test } from '@playwright/test';

import { waitForHydration } from './helpers';

/**
 * Alta de una cuenta nueva.
 *
 * El onboarding es el único recorrido en el que la interfaz decide por sí sola
 * cuándo se puede avanzar, y esa decisión depende de un formulario reactivo.
 * Una regresión ahí deja al visitante encerrado en un paso sin ningún error
 * visible que lo explique, así que se recorre entero.
 */
test.describe('Onboarding de una cuenta nueva', () => {
  test('recorre los cuatro pasos y entra en el panel', async ({ page }) => {
    await page.goto('/registro');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await waitForHydration(page);

    await page.getByLabel('Nombre').fill('Brigitte Chávez');
    await page.getByLabel('Correo electrónico').fill('nueva@relay.demo');
    await page.getByRole('button', { name: /crear cuenta y continuar/i }).click();

    // El alta encadena varias llamadas a la API simulada, cada una con su
    // latencia: con el margen por defecto la navegación llega tarde.
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });

    const next = page.getByRole('button', { name: /^continuar$/i });

    // Paso 1: el camino ya viene elegido, así que se puede avanzar sin tocar nada.
    await next.click();
    await expect(page.getByText(/paso 2 de 4/i)).toBeVisible();

    // Paso 2: sin titular no se puede seguir, y con él sí. Esto es lo que se
    // rompió al leer la validez del formulario dentro de un `computed`: el
    // botón se quedaba deshabilitado para siempre.
    await expect(next).toBeDisabled();
    await page.getByLabel(/titular/i).fill('Consultor de marketing digital');
    await expect(next).toBeEnabled();

    await next.click();
    await expect(page.getByText(/paso 3 de 4/i)).toBeVisible();

    // Paso 3: los canales son opcionales.
    await next.click();
    await expect(page.getByText(/paso 4 de 4/i)).toBeVisible();

    await page.getByRole('button', { name: /entrar en relay/i }).click();
    await expect(page).toHaveURL(/\/app\/affiliate\/inicio/, { timeout: 15_000 });
  });

  test('«Completar después» lleva al resumen sin bloquear el alta', async ({ page }) => {
    await page.goto('/registro');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await waitForHydration(page);

    await page.getByLabel('Nombre').fill('Brigitte Chávez');
    await page.getByLabel('Correo electrónico').fill('nueva@relay.demo');
    await page.getByRole('button', { name: /crear cuenta y continuar/i }).click();
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });

    await page.getByRole('button', { name: /^continuar$/i }).click();
    await page.getByRole('button', { name: /completar después/i }).click();

    await expect(page.getByText(/paso 4 de 4/i)).toBeVisible();
  });
});
