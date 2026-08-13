/**
 * Genera `robots.txt` y `sitemap.xml` a partir de las rutas reales.
 *
 * Se derivan del catálogo demo en lugar de mantenerse a mano: al añadir una
 * campaña al seed, su ficha entra en el sitemap sin que nadie tenga que
 * acordarse. El área privada queda fuera, tanto del sitemap como del rastreo.
 *
 * Ejecutar con `npm run seo`; el hook `prebuild` lo lanza antes de compilar.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const ORIGIN = 'https://relay-marketplace.netlify.app';

/**
 * Los slugs se leen del seed con una expresión regular en lugar de importarlo:
 * el seed es TypeScript y este script corre en Node sin compilar nada.
 */
function slugsFrom(file) {
  const source = readFileSync(join(ROOT, 'src/app/data/seed', file), 'utf8');
  return [...source.matchAll(/^\s{4}slug: '([^']+)',$/gm)].map((match) => match[1]);
}

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/marketplace', priority: '0.9', changefreq: 'daily' },
  { path: '/como-funciona', priority: '0.7', changefreq: 'monthly' },
  { path: '/para-empresas', priority: '0.8', changefreq: 'monthly' },
  { path: '/pricing', priority: '0.7', changefreq: 'monthly' },
  { path: '/registro', priority: '0.5', changefreq: 'monthly' },
];

const dynamicRoutes = [
  ...slugsFrom('campaigns.seed.ts').map((slug) => ({
    path: `/campanas/${slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  })),
  ...slugsFrom('organizations.seed.ts').map((slug) => ({
    path: `/organizaciones/${slug}`,
    priority: '0.6',
    changefreq: 'monthly',
  })),
  ...slugsFrom('affiliates.seed.ts').map((slug) => ({
    path: `/afiliados/${slug}`,
    priority: '0.5',
    changefreq: 'monthly',
  })),
];

const routes = [...staticRoutes, ...dynamicRoutes];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${ORIGIN}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `# RELAY — proyecto de portafolio
User-agent: *
Allow: /

# El área autenticada depende del estado local del navegador: no hay nada que
# rastrear y su contenido no es público.
Disallow: /app/
Disallow: /onboarding

Sitemap: ${ORIGIN}/sitemap.xml
`;

writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
writeFileSync(join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');

console.log(`seo → sitemap.xml (${routes.length} rutas) y robots.txt`);
