/**
 * Reloj de la demo.
 *
 * Todas las fechas del seed se derivan de esta constante en lugar de
 * `Date.now()`. Dos razones: el prerender produce exactamente el mismo HTML en
 * cada build, y la narrativa de la demo —«hace 3 días», «termina en 12 días»—
 * no se descoloca con el paso del tiempo real.
 */
export const DEMO_TODAY = '2026-08-13';

const MS_PER_DAY = 86_400_000;

/** Fecha ISO a N días del presente de la demo. Negativo = pasado. */
export function demoDate(offsetDays: number): string {
  const date = new Date(`${DEMO_TODAY}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/** Días transcurridos entre una fecha del seed y el presente de la demo. */
export function daysSince(date: string): number {
  const then = new Date(`${date}T12:00:00Z`).getTime();
  const now = new Date(`${DEMO_TODAY}T12:00:00Z`).getTime();
  return Math.round((now - then) / MS_PER_DAY);
}

/** Días que faltan hasta una fecha del seed. Negativo si ya pasó. */
export function daysUntil(date: string): number {
  return -daysSince(date);
}
