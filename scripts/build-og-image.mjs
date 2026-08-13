/**
 * Genera la imagen de compartición social (`public/og-cover.png`).
 *
 * Se dibuja con los mismos tokens y la misma tipografía que la interfaz, y se
 * rasteriza con el navegador que ya trae Playwright: no hace falta ninguna
 * herramienta de diseño externa ni una dependencia nueva, y el resultado no
 * puede desviarse de la marca porque lee los colores del propio archivo de
 * tokens.
 *
 * No forma parte de `prebuild`: la imagen se versiona y solo se regenera a
 * mano con `npm run og` cuando cambian la marca o el mensaje.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const WIDTH = 1200;
const HEIGHT = 630;

/** Los colores salen del archivo generado, no de una copia a mano. */
function token(name) {
  const css = readFileSync(join(ROOT, 'src/styles/tokens.generated.css'), 'utf8');
  const match = css.match(new RegExp('--rly-color-' + name + ':\s*([^;]+);'));
  if (!match) throw new Error('Token de color desconocido: ' + name);
  return match[1].trim();
}

const font = readFileSync(join(ROOT, 'public/fonts/bricolage-grotesque-latin-wght.woff2')).toString(
  'base64',
);

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Bricolage Grotesque';
        src: url(data:font/woff2;base64,${font}) format('woff2-variations');
        font-weight: 200 800;
        font-display: block;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${WIDTH}px;
        height: ${HEIGHT}px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 72px;
        background: ${token('inverse')};
        color: ${token('text-inverse')};
        font-family: 'Bricolage Grotesque', sans-serif;
        font-optical-sizing: none;
      }

      .mark {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      /* La misma marca del producto: cuadro acento con el trazo del relevo. */
      .glyph {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 12px;
        background: ${token('accent')};
      }

      .glyph svg { display: block; width: 34px; height: 34px; }

      h1 {
        max-width: 15ch;
        font-size: 82px;
        line-height: 1.02;
        font-weight: 600;
        letter-spacing: -0.035em;
      }

      .accent { color: ${token('accent')}; }

      footer {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 40px;
        padding-top: 32px;
        border-top: 1px solid ${token('border-inverse')};
      }

      p {
        max-width: 46ch;
        font-size: 25px;
        line-height: 1.4;
        color: ${token('text-inverse-secondary')};
      }

      .pill {
        flex: none;
        padding: 12px 22px;
        border-radius: 999px;
        background: ${token('accent')};
        color: ${token('accent-contrast')};
        font-size: 22px;
        font-weight: 600;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div class="mark">
      <span class="glyph">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8.5h6.5a3.5 3.5 0 0 1 0 7H8"
            stroke="${token('ink')}"
            stroke-width="2.4"
            stroke-linecap="round"
          />
          <path
            d="M13.5 12.5 17 16l-3.5 3.5"
            stroke="${token('ink')}"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      RELAY
    </div>

    <h1>El relevo entre lo que ofreces y <span class="accent">quien sabe recomendarlo</span></h1>

    <footer>
      <p>
        Marketplace de marketing de afiliados. Comisiones explícitas, requisitos
        claros y resultados que se siguen desde el primer clic.
      </p>
      <span class="pill">Proyecto de portafolio</span>
    </footer>
  </body>
</html>
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

const png = await page.screenshot({ type: 'png' });
await browser.close();

writeFileSync(join(ROOT, 'public/og-cover.png'), png);

console.log(
  'og → public/og-cover.png (' +
    WIDTH +
    '×' +
    HEIGHT +
    ', ' +
    Math.round(png.length / 1024) +
    ' kB)',
);
