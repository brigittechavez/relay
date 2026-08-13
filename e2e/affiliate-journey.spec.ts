import { expect, test, type Page } from '@playwright/test';

/**
 * Recorrido protagonista del afiliado.
 *
 * Cubre los dos flujos críticos documentados: descubrir una campaña y
 * solicitarla, y —una vez aprobada— generar el link de seguimiento.
 *
 * Cada prueba parte de una demo limpia: el estado vive en `localStorage`, así
 * que basta con vaciarlo antes de navegar.
 */

/**
 * Vacía el estado de la demo una sola vez.
 *
 * No sirve `addInitScript`: se ejecuta en cada navegación y borraría la sesión
 * a mitad del recorrido, que es justo lo que estas pruebas comprueban.
 */
async function resetDemoState(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function startAffiliateDemo(page: Page): Promise<void> {
  await resetDemoState(page);

  await page.getByRole('button', { name: /ver demo como afiliado/i }).click();
  await expect(page).toHaveURL(/\/app\/affiliate\/inicio/);
}

test.describe('Afiliado: descubrir y solicitar', () => {
  test('desde el marketplace hasta la solicitud enviada', async ({ page }) => {
    await startAffiliateDemo(page);

    // El panel muestra los KPIs calculados sobre los datos demo.
    await expect(page.getByRole('heading', { name: /hola, lucía/i })).toBeVisible();

    // Marketplace autenticado: con perfil hay compatibilidad y elegibilidad.
    await page.getByRole('link', { name: /buscar campañas/i }).click();
    await expect(page).toHaveURL(/\/app\/affiliate\/marketplace/);

    // Buscar la campaña protagonista.
    await page.getByRole('searchbox', { name: /buscar campañas/i }).fill('Landing Pro');
    await expect(page.getByRole('heading', { name: 'Landing Pro' }).first()).toBeVisible();

    await page.getByRole('link', { name: 'Landing Pro' }).first().click();
    await expect(page).toHaveURL(/\/campanas\/landing-pro/);

    // El detalle muestra la compatibilidad y los requisitos evaluados. El bloque
    // que la muestra cambia entre móvil y escritorio, así que se busca el visible.
    await expect(
      page.getByText('93% de compatibilidad', { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Requisitos' }).first()).toBeVisible();

    // Landing Pro es selectiva: la solicitud se resuelve en un panel lateral.
    await page
      .getByRole('button', { name: /^aplicar$/i })
      .first()
      .click();

    const drawer = page.getByRole('dialog', { name: /solicitar acceso/i });
    await expect(drawer).toBeVisible();

    await drawer
      .getByRole('textbox')
      .fill(
        'Lo presentaría en la newsletter con un caso propio de rediseño y después en Instagram ' +
          'con el antes y el después, que es el formato que mejor funciona con mi audiencia.',
      );

    await drawer.getByRole('button', { name: /enviar solicitud/i }).click();

    // Confirmación y salto al detalle de la solicitud.
    await expect(page.getByRole('dialog', { name: /solicitud enviada/i })).toBeVisible();
    await page.getByRole('button', { name: /ver mi solicitud/i }).click();

    await expect(page).toHaveURL(/\/app\/affiliate\/aplicaciones\//);
    await expect(page.getByText('Enviada', { exact: true })).toBeVisible();
  });

  test('una campaña sin los requisitos obligatorios no deja solicitar', async ({ page }) => {
    await startAffiliateDemo(page);

    // Revenue Systems exige experiencia B2B que Lucía no tiene.
    await page.goto('/campanas/revenue-systems');

    await expect(page.getByText(/te falta 1 requisito obligatorio/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /ver qué me falta/i }).first()).toBeVisible();
  });
});

test.describe('Afiliado: generar link tras la aprobación', () => {
  test('crea un link de seguimiento y ve su rendimiento', async ({ page }) => {
    await startAffiliateDemo(page);

    // Workspace Plus es de aceptación inmediata: sirve para llegar al estado
    // aprobado sin depender de que la organización revise.
    await page.goto('/app/affiliate/campanas/workspace-plus');
    await expect(page.getByRole('heading', { name: 'Workspace Plus' })).toBeVisible();

    await page
      .getByRole('button', { name: /nuevo link/i })
      .first()
      .click();

    const modal = page.getByRole('dialog', { name: /nuevo link de seguimiento/i });
    await expect(modal).toBeVisible();

    await modal.getByRole('textbox').fill('Reel lanzamiento');
    await modal.getByRole('combobox').selectOption('instagram');
    await modal.getByRole('button', { name: /crear link/i }).click();

    // El link aparece en su pestaña con la actividad simulada del canal.
    await expect(page.getByText('Reel lanzamiento')).toBeVisible();
    await expect(page.getByText('https://rly.pe/reel-lanzamiento')).toBeVisible();

    // Y el rendimiento del canal queda reflejado.
    await page.getByRole('tab', { name: /rendimiento/i }).click();
    await expect(page.getByText(/es tu mejor canal en esta campaña/i)).toBeVisible();
  });
});

test.describe('Demo', () => {
  test('el marketplace público funciona sin sesión', async ({ page }) => {
    await resetDemoState(page);
    await page.goto('/marketplace');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/oportunidades/i);

    // Sin perfil no hay compatibilidad que mostrar y aplicar lleva al acceso.
    await page.getByRole('link', { name: 'Landing Pro' }).first().click();
    await expect(page.getByRole('link', { name: /entrar para aplicar/i }).first()).toBeVisible();
  });
});
