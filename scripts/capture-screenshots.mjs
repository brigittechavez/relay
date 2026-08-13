/**
 * Captura las imágenes del README (`screenshots/`).
 *
 * Son la interfaz real: se recorre la aplicación con Playwright, se entra en
 * las demos con los mismos botones que usa cualquiera y se fotografía lo que
 * sale. Ninguna es un mockup, así que no pueden envejecer sin que se note.
 *
 * Requiere el servidor levantado: `npm start` en otra terminal y después
 * `npm run screenshots`.
 */

import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'screenshots');
const BASE = process.env.RELAY_BASE_URL ?? 'http://localhost:4200';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

/** Entra en una demo desde la pantalla de acceso, sin atajos internos. */
async function signIn(page, role) {
  await page.goto(BASE + '/login');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  // La página llega prerenderizada: el botón se ve antes de que Angular se
  // enganche a él. Angular limpia los `jsaction` al hidratar, así que su
  // ausencia marca el momento en que la pantalla responde de verdad.
  await page.waitForFunction(() => !document.querySelector('[jsaction]'));

  await page.getByRole('button', { name: new RegExp('ver demo como ' + role, 'i') }).click();
  await page.waitForURL(/\/app\//);
}

async function shoot(page, name, { full = false } = {}) {
  // Dar tiempo a que la tipografía y los datos estén en pantalla: una captura
  // a medio pintar es peor que no tenerla.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, name + '.png'), fullPage: full });
  console.log('  ' + name + '.png');
}

console.log('escritorio (1440×900)');
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();

await page.goto(BASE + '/');
await shoot(page, '01-landing');

await page.goto(BASE + '/marketplace');
await shoot(page, '02-marketplace');

await page.goto(BASE + '/campanas/landing-pro');
await shoot(page, '03-campana');

await signIn(page, 'afiliado');
await shoot(page, '04-panel-afiliado');

await page.goto(BASE + '/app/affiliate/ganancias');
await shoot(page, '05-ganancias');

await signIn(page, 'empresa');
await shoot(page, '06-panel-organizacion');

const organizationBase = new URL(page.url()).pathname.split('/').slice(0, 4).join('/');
await page.goto(BASE + organizationBase + '/aplicaciones');
await shoot(page, '07-solicitudes');

await desktop.close();

console.log('móvil (Pixel 7)');
const mobile = await browser.newContext({ ...devices['Pixel 7'] });
const small = await mobile.newPage();

await small.goto(BASE + '/marketplace');
await shoot(small, '08-marketplace-movil');

await signIn(small, 'afiliado');
await shoot(small, '09-panel-afiliado-movil');

await mobile.close();
await browser.close();

console.log('screenshots → screenshots/');
