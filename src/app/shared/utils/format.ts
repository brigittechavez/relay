/**
 * Formateo de valores para la interfaz de RELAY.
 *
 * Toda la aplicación trabaja en soles peruanos (PEN) y en español, por lo que
 * el formateo vive aquí en lugar de repartirse por los componentes.
 */

const CURRENCY_LOCALE = 'es-PE';

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyWithCentsFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  maximumFractionDigits: 0,
});

/**
 * `S/ 2,840`. Los céntimos se muestran solo cuando el importe los tiene, para
 * que las tablas de comisiones no se llenen de `,00` sin información.
 */
export function formatCurrency(value: number): string {
  const hasCents = Math.abs(value % 1) > 0.001;
  const formatter = hasCents ? currencyWithCentsFormatter : currencyFormatter;
  return formatter.format(value).replace(/\u00a0/g, ' ');
}

/** `1,240` — separador de miles sin decimales. */
export function formatNumber(value: number): string {
  return integerFormatter.format(value);
}

/**
 * `24.8K` — usado en audiencias y métricas de canal, donde el valor exacto
 * no aporta y la densidad sí.
 */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) < 1000) {
    return integerFormatter.format(value);
  }

  if (Math.abs(value) < 1_000_000) {
    return `${trimTrailingZero(value / 1000)}K`;
  }

  return `${trimTrailingZero(value / 1_000_000)}M`;
}

/** `1.45%` — una decimal, que es la precisión con la que se leen las CVR. */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${toFixedHalfUp(value, fractionDigits)}%`;
}

/** `+12.4%` / `-3.1%` — variación respecto a un periodo anterior. */
export function formatDelta(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${toFixedHalfUp(value, fractionDigits)}%`;
}

/**
 * `Number.prototype.toFixed` redondea sobre la representación binaria, de modo
 * que `1.45` cae a `1.4`. En una UI de métricas eso se lee como un error, así
 * que forzamos redondeo half-up antes de formatear.
 */
function toFixedHalfUp(value: number, fractionDigits: number): string {
  const factor = 10 ** fractionDigits;
  const scaled = Number((value * factor).toPrecision(12));
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
  return (rounded / factor).toFixed(fractionDigits);
}

function trimTrailingZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}
