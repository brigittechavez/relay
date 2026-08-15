/**
 * Convierte las portadas de campaña a WebP.
 *
 * Las imágenes de origen viven en `source-images/campanas/` —material de
 * trabajo, fuera del repositorio— y el resultado se publica en
 * `public/campanas/`, que es lo que declara el seed.
 *
 * La codificación la hace el navegador que ya trae Playwright: no hace falta
 * ninguna dependencia binaria nueva y el WebP es real, no un PNG renombrado.
 * La calidad baja solo lo justo para entrar en el presupuesto de peso, y se
 * informa de la que ha hecho falta en cada archivo.
 *
 * Ejecutar con `npm run campaign-images`.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'source-images/campanas');
const OUTPUT = join(ROOT, 'public/campanas');

/** Presupuesto por archivo. Por encima de esto la portada pesa más que la vista. */
const BUDGET_BYTES = 120 * 1024;

/** De mayor a menor: se baja solo lo justo para entrar en presupuesto. */
const QUALITIES = [0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62];

/**
 * Qué imagen va con qué campaña.
 *
 * La correspondencia se decidió mirando cada archivo, no leyendo su nombre:
 * siete de los once originales llegaron con el nombre de otra campaña —una
 * esterilla de yoga bajo «membresia-profesional», una calculadora y varios
 * informes contables bajo «growth-bootcamp»—. La clave es el slug de destino;
 * el valor, el archivo de origen.
 */
const ASSIGNMENT = {
  // Una página de destino terminada en pantalla, con sus wireframes al lado.
  'landing-pro': 'automatiza-tu-operacion.png',
  // Tablero de tarjetas por columnas: el espacio de trabajo de un equipo.
  'workspace-plus': 'cierre-mensual.png',
  // Sesión de grupo alrededor de una mesa: la cohorte del programa.
  'growth-bootcamp': 'plan-doce-semanas.png',
  'brand-sprint': 'brand-sprint.png',
  'revenue-systems': 'revenue-systems.png',
  // Plantillas impresas y una lista de tareas: lo que da la membresía.
  'membresia-profesional': 'workspace-plus.png',
  'estrategia-de-marca': 'estrategia-de-marca.png',
  // Calculadora, hoja de cálculo e informes: el cierre contable.
  'cierre-mensual': 'growth-bootcamp.png',
  // Esterilla, botella y cuaderno de seguimiento: el plan de salud.
  'plan-doce-semanas': 'membresia-profesional.png',
  'kit-de-lanzamiento': 'kit-de-lanzamiento.png',
  // Diagrama de flujo en pantalla y en papel: el proceso automatizado.
  'automatiza-tu-operacion': 'landing-pro.png',
};

mkdirSync(OUTPUT, { recursive: true });

const available = new Set(readdirSync(SOURCE).filter((file) => /\.(png|jpe?g)$/i.test(file)));
const missing = Object.values(ASSIGNMENT).filter((file) => !available.has(file));
if (missing.length) throw new Error('Faltan imágenes de origen: ' + missing.join(', '));

const browser = await chromium.launch();
const page = await browser.newPage();

// Una página en blanco basta: el trabajo lo hace el canvas.
await page.goto('about:blank');

const report = [];

for (const [slug, file] of Object.entries(ASSIGNMENT)) {
  const source = readFileSync(join(SOURCE, file));

  const result = await page.evaluate(
    async ({ base64, mime, qualities, budget }) => {
      const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob();
      const bitmap = await createImageBitmap(blob);

      // Sin redimensionar: la resolución de origen se respeta tal cual, así que
      // no hay ni ampliación inventada ni deformación.
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      canvas.getContext('2d').drawImage(bitmap, 0, 0);

      let chosen = null;

      for (const quality of qualities) {
        const encoded = await canvas.convertToBlob({ type: 'image/webp', quality });
        chosen = { quality, bytes: new Uint8Array(await encoded.arrayBuffer()) };
        if (chosen.bytes.length <= budget) break;
      }

      return {
        width: bitmap.width,
        height: bitmap.height,
        quality: chosen.quality,
        data: [...chosen.bytes],
      };
    },
    {
      base64: source.toString('base64'),
      mime: file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      qualities: QUALITIES,
      budget: BUDGET_BYTES,
    },
  );

  const output = Buffer.from(result.data);
  writeFileSync(join(OUTPUT, `${slug}.webp`), output);

  report.push({
    slug,
    file,
    size: `${result.width}×${result.height}`,
    quality: result.quality,
    kb: Math.round(output.length / 1024),
    fromKb: Math.round(source.length / 1024),
  });
}

await browser.close();

const total = report.reduce((sum, item) => sum + item.kb, 0);

for (const item of [...report].sort((a, b) => b.kb - a.kb)) {
  const flag = item.kb <= 120 ? ' ' : '!';
  const renamed = item.file === `${item.slug}.png` ? '' : `  ← ${item.file}`;
  console.log(
    `${flag} ${item.slug.padEnd(24)} ${item.size}  q${item.quality}  ` +
      `${String(item.kb).padStart(4)} kB  (desde ${item.fromKb} kB)${renamed}`,
  );
}

console.log(`\ncampaign-images → ${report.length} archivos, ${total} kB en total`);
