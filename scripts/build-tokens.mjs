/**
 * Genera `src/styles/tokens.generated.css` a partir de `tokens/*.json`.
 *
 * Los JSON son la fuente de verdad (y el punto de enganche para una futura
 * sincronización con Tokens Studio). El CSS generado expone dos capas:
 *
 *   :root     → variables `--rly-*`, utilizables desde CSS suelto.
 *   @theme    → variables de Tailwind, que producen las utilidades del proyecto.
 *
 * Ejecutar con `npm run tokens`. Los hooks `pre*` de npm lo lanzan antes de
 * cualquier build, así que el CSS generado nunca queda desincronizado.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_DIR = join(ROOT, 'tokens');
const OUTPUT = join(ROOT, 'src', 'styles', 'tokens.generated.css');

const read = (name) => JSON.parse(readFileSync(join(TOKENS_DIR, `${name}.json`), 'utf8'));

const primitive = read('primitive');
const semantic = read('semantic');
const typography = read('typography');
const spacing = read('spacing');
const radius = read('radius');
const shadow = read('shadow');
const motion = read('motion');
const layout = read('layout');

/** Resuelve referencias `{color.acid.default}` contra el árbol de primitivos. */
function resolve(value) {
  if (typeof value !== 'string') return value;

  return value.replace(/\{([^}]+)\}/g, (_match, path) => {
    const resolved = path
      .split('.')
      .reduce((node, key) => (node === undefined ? undefined : node[key]), primitive);

    if (resolved === undefined) {
      throw new Error(`Token no resuelto: {${path}}`);
    }

    return resolved;
  });
}

const kebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Aplana `{ a: { b: 'x' } }` en `[['a-b', 'x']]`, ignorando claves `$meta`. */
function flatten(node, prefix = []) {
  return Object.entries(node).flatMap(([key, value]) => {
    if (key.startsWith('$')) return [];
    const path = [...prefix, key];
    const name = path
      .filter((segment) => segment !== 'default')
      .map(kebab)
      .join('-');
    return typeof value === 'object' && value !== null
      ? flatten(value, path)
      : [[name, resolve(value)]];
  });
}

const declarations = (entries, indent = '  ') =>
  entries.map(([name, value]) => `${indent}${name}: ${value};`).join('\n');

const block = (title, entries, indent = '  ') =>
  entries.length ? `\n${indent}/* ${title} */\n${declarations(entries, indent)}\n` : '';

// --- Capa 1: roles semánticos como variables `--rly-*` -----------------------
// Los primitivos no se emiten: son una capa de autoría, no de consumo.

const semanticVars = flatten(semantic.color).map(([name, value]) => [`--rly-color-${name}`, value]);

const layoutVars = Object.entries(spacing.layout).map(([name, value]) => [
  `--rly-layout-${name}`,
  value,
]);

const zVars = Object.entries(layout.z).map(([name, value]) => [`--rly-z-${name}`, value]);

const durationVars = Object.entries(motion.duration).map(([name, value]) => [
  `--rly-duration-${name}`,
  value,
]);

const easeVars = Object.entries(motion.ease).map(([name, value]) => [`--rly-ease-${name}`, value]);

// --- Capa 2: tema de Tailwind ------------------------------------------------

const themeColors = flatten(semantic.color).map(([name, value]) => [`--color-${name}`, value]);

const themeText = Object.entries(typography.text).flatMap(([name, spec]) => [
  [`--text-${name}`, spec.size],
  [`--text-${name}--line-height`, spec.lineHeight],
  [`--text-${name}--font-weight`, spec.weight],
  [`--text-${name}--letter-spacing`, spec.tracking],
]);

const themeRadius = Object.entries(radius.radius).map(([name, value]) => [
  `--radius-${name}`,
  value,
]);

const themeShadow = Object.entries(shadow.shadow).map(([name, value]) => [
  `--shadow-${name}`,
  value,
]);

const themeBreakpoints = Object.entries(layout.breakpoint).map(([name, value]) => [
  `--breakpoint-${name}`,
  value,
]);

const themeEase = Object.entries(motion.ease).map(([name, value]) => [`--ease-${name}`, value]);

const themeDuration = Object.entries(motion.duration).map(([name, value]) => [
  `--duration-${name}`,
  value,
]);

const themeSpacingLayout = Object.entries(spacing.layout).map(([name, value]) => [
  `--spacing-${name}`,
  value,
]);

const css = `/**
 * ARCHIVO GENERADO — no editar a mano.
 * Fuente: tokens/*.json · Generador: scripts/build-tokens.mjs (npm run tokens)
 */

:root {
  color-scheme: light;
${block('Roles semánticos', semanticVars).trimEnd()}
${block('Layout', layoutVars).trimEnd()}
${block('Capas', zVars).trimEnd()}
${block('Movimiento', [...durationVars, ...easeVars]).trimEnd()}
}

@theme {
  /* Se descartan las paletas y familias por defecto de Tailwind: RELAY solo
     expone sus propios tokens, de modo que utilidades como bg-blue-500 o
     font-serif no existen y no pueden colarse en la interfaz. */
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --breakpoint-*: initial;
  --ease-*: initial;

  --color-transparent: transparent;
  --color-current: currentColor;
${block('Color', themeColors).trimEnd()}

  /* Tipografía */
  --font-sans: ${typography.fontFamily.sans};
  --font-mono: ${typography.fontFamily.mono};
${block('Escala tipográfica', themeText).trimEnd()}

  /* Espaciado */
  --spacing: ${spacing.base};
${declarations(themeSpacingLayout)}
${block('Radios', themeRadius).trimEnd()}
${block('Sombras', themeShadow).trimEnd()}
${block('Breakpoints', themeBreakpoints).trimEnd()}
${block('Movimiento', [...themeDuration, ...themeEase]).trimEnd()}
}
`;

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, css, 'utf8');

const count = semanticVars.length + themeColors.length + themeText.length;
console.log(`tokens → src/styles/tokens.generated.css (${count} variables)`);
