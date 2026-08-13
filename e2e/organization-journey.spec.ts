import { expect, test } from '@playwright/test';

import { startOrganizationDemo } from './helpers';

/**
 * Recorrido de la organización.
 *
 * Cubre el flujo crítico documentado —crear una campaña— más la revisión de
 * una solicitud y la validación de una conversión, que son las dos acciones
 * que sostienen el resto del área.
 */

test.describe('Organización: crear campaña', () => {
  test('recorre el wizard completo y publica', async ({ page }) => {
    await startOrganizationDemo(page);

    await expect(page.getByRole('heading', { name: 'Norte Digital' })).toBeVisible();

    await page
      .getByRole('link', { name: /crear campaña/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/campanas\/nueva/);

    // Paso 1 · Campaña
    await page.getByLabel('Nombre de la campaña').fill('Auditoría Express');
    await page
      .getByLabel('Resumen')
      .fill('Auditoría de conversión de tu web con plan de mejoras priorizado');
    await page
      .getByLabel('Descripción')
      .fill(
        'Revisamos tu web con datos reales de comportamiento y entregamos un plan de mejoras ' +
          'ordenado por impacto. Incluye una sesión de una hora para resolver dudas del equipo.',
      );
    await page.getByLabel('Precio de la oferta').fill('1200');
    await page.getByLabel('URL de destino').fill('https://nortedigital.pe/auditoria');

    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 2 · Comisión
    await expect(page.getByRole('heading', { name: /lo que verá un afiliado/i })).toBeHidden();
    await page.getByLabel('Importe por conversión').fill('180');
    await expect(page.getByText('Lo que verá un afiliado')).toBeVisible();

    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 3 · Afiliados
    await expect(page.getByText('Modalidad de acceso')).toBeVisible();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Paso 4 · Publicar
    await expect(page.getByRole('heading', { name: /resumen de la campaña/i })).toBeVisible();
    await expect(page.getByText('Auditoría Express')).toBeVisible();

    await page.getByRole('button', { name: /publicar campaña/i }).click();

    // Aterriza en el resumen de la campaña recién creada.
    await expect(page).toHaveURL(/\/campanas\/[^/]+\/resumen/);
    await expect(page.getByRole('heading', { name: 'Auditoría Express' })).toBeVisible();
    await expect(page.getByText('Activa', { exact: true }).first()).toBeVisible();
  });

  test('el wizard no deja avanzar con campos obligatorios vacíos', async ({ page }) => {
    await startOrganizationDemo(page);
    await page.goto('/app/organization/norte-digital/campanas/nueva');

    await page.getByRole('button', { name: /continuar/i }).click();

    await expect(page.getByText(/revisa los campos marcados/i)).toBeVisible();
    await expect(page.getByText(/escribe un nombre de al menos 3 caracteres/i)).toBeVisible();
  });
});

test.describe('Organización: revisar y validar', () => {
  test('aprueba una solicitud pendiente', async ({ page }) => {
    await startOrganizationDemo(page);

    await page.goto('/app/organization/norte-digital/aplicaciones');
    await expect(page.getByRole('heading', { level: 2, name: 'Solicitudes' })).toBeVisible();

    // La bandeja abre en «Por revisar»: la primera fila es una solicitud abierta.
    await page
      .getByRole('button', { name: /carlos ibáñez/i })
      .first()
      .click();

    const drawer = page.getByRole('dialog', { name: /revisar solicitud/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/requisitos/i).first()).toBeVisible();

    await drawer.getByRole('button', { name: /aprobar solicitud/i }).click();

    // Al aprobar desaparece de la bandeja de pendientes.
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('button', { name: /carlos ibáñez/i })).toBeHidden();
  });

  test('valida una conversión respetando el ciclo', async ({ page }) => {
    await startOrganizationDemo(page);

    await page.goto('/app/organization/norte-digital/conversiones');
    await expect(page.getByRole('heading', { level: 2, name: 'Conversiones' })).toBeVisible();

    // El chip lleva el contador en su nombre accesible, así que no se ancla.
    await page.getByRole('button', { name: /por validar/i }).click();

    // Desde «en validación» solo se puede aprobar o rechazar: el ciclo no
    // permite saltar directamente a pagada. La aserción no depende del layout,
    // que en móvil son tarjetas y en escritorio una tabla.
    const approve = page.getByRole('button', { name: 'Aprobar', exact: true }).first();
    await expect(approve).toBeVisible();
    await expect(page.getByRole('button', { name: /marcar pagada/i })).toHaveCount(0);

    await approve.click();
    await expect(page.getByText(/actualizada/i).first()).toBeVisible();
  });
});
