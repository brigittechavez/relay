/**
 * Genera `src/app/design-system/icon/icon-registry.generated.ts`.
 *
 * RELAY usa un subconjunto cerrado de Lucide en lugar de una librería de
 * iconos en runtime: se extrae el interior de cada SVG a un registro tipado,
 * de modo que el bundle solo contiene los iconos que la interfaz usa y el
 * nombre del icono queda validado por el compilador.
 *
 * Ejecutar con `npm run icons` tras añadir un nombre a `ICONS`.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'node_modules', 'lucide-static', 'icons');
const OUTPUT = join(ROOT, 'src', 'app', 'design-system', 'icon', 'icon-registry.generated.ts');

/**
 * Nombre en RELAY → nombre en Lucide.
 *
 * Los canales de difusión (Instagram, YouTube, newsletter…) se representan con
 * iconos genéricos y no con marcas: el nombre del canal ya viaja como texto
 * junto al icono, y RELAY no debe incorporar identidades ajenas.
 */
const ICONS = {
  // Navegación y estructura
  home: 'house',
  marketplace: 'layout-grid',
  campaigns: 'megaphone',
  applications: 'file-text',
  earnings: 'wallet',
  conversions: 'arrow-left-right',
  commissions: 'coins',
  affiliates: 'users',
  team: 'user-round-cog',
  overview: 'layout-dashboard',
  settings: 'settings',
  more: 'ellipsis',
  menu: 'menu',
  bell: 'bell',
  search: 'search',
  filter: 'sliders-horizontal',
  bookmark: 'bookmark',
  'bookmark-filled': 'bookmark-check',
  compare: 'columns-3',
  link: 'link-2',
  ticket: 'ticket-percent',
  resources: 'folder-open',
  activity: 'activity',
  analytics: 'chart-column',
  profile: 'circle-user-round',
  organization: 'building-2',
  logout: 'log-out',
  login: 'log-in',
  plus: 'plus',
  reset: 'rotate-ccw',

  // Direcciones
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevrons-up-down': 'chevrons-up-down',
  'arrow-right': 'arrow-right',
  'arrow-left': 'arrow-left',
  'arrow-up-right': 'arrow-up-right',
  'trending-up': 'trending-up',
  'trending-down': 'trending-down',

  // Estado y feedback
  check: 'check',
  'check-circle': 'circle-check',
  'x-circle': 'circle-x',
  close: 'x',
  alert: 'triangle-alert',
  info: 'info',
  clock: 'clock',
  hourglass: 'hourglass',
  ban: 'ban',
  'shield-check': 'shield-check',
  verified: 'badge-check',
  star: 'star',
  target: 'target',
  zap: 'zap',
  flame: 'flame',
  gauge: 'gauge',

  // Acciones
  copy: 'copy',
  download: 'download',
  'external-link': 'external-link',
  edit: 'pencil',
  trash: 'trash-2',
  eye: 'eye',
  'eye-off': 'eye-off',
  share: 'share-2',
  send: 'send',
  'more-vertical': 'ellipsis-vertical',
  refresh: 'refresh-cw',

  // Datos y contenido
  calendar: 'calendar',
  'map-pin': 'map-pin',
  globe: 'globe',
  mail: 'mail',
  image: 'image',
  file: 'file',
  tag: 'tag',
  layers: 'layers',
  inbox: 'inbox',
  'book-open': 'book-open',
  'help-circle': 'circle-question-mark',

  // Canales (representación genérica, sin marcas)
  'channel-social': 'camera',
  'channel-video': 'circle-play',
  'channel-newsletter': 'mail',
  'channel-community': 'users-round',
  'channel-blog': 'pen-line',
  'channel-podcast': 'mic',
  'channel-web': 'globe',
  'channel-short-video': 'clapperboard',
};

/** Extrae el contenido del `<svg>` y normaliza el espaciado. */
function extractBody(lucideName) {
  const raw = readFileSync(join(SOURCE, `${lucideName}.svg`), 'utf8');
  const match = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);

  if (!match) {
    throw new Error(`SVG no reconocido: ${lucideName}`);
  }

  return match[1]
    .replace(/\s*\n\s*/g, '')
    .replace(/\s*\/>/g, '/>')
    .trim();
}

const entries = Object.entries(ICONS)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, lucideName]) => `  '${name}': '${extractBody(lucideName).replace(/'/g, "\\'")}',`)
  .join('\n');

const output = `/**
 * ARCHIVO GENERADO — no editar a mano.
 * Fuente: lucide-static · Generador: scripts/build-icons.mjs (npm run icons)
 *
 * Iconos de Lucide (https://lucide.dev), ISC License,
 * Copyright (c) Lucide Icons and Contributors.
 */

export const ICON_REGISTRY = {
${entries}
} as const;

export type IconName = keyof typeof ICON_REGISTRY;

export const ICON_NAMES = Object.keys(ICON_REGISTRY) as IconName[];
`;

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, output, 'utf8');

console.log(`icons → ${OUTPUT.replace(ROOT, '.')} (${Object.keys(ICONS).length} iconos)`);
