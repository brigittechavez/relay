import { Conversion } from '../models/tracking';
import { IsoDate, Money, SeriesPoint } from '../models/common';
import { ReferralLink } from '../models/tracking';
import { ChannelId } from '../models/taxonomy';
import { DEMO_TODAY, daysSince, demoDate } from '../seed/demo-clock';

/**
 * Agregaciones sobre las conversiones.
 *
 * Todo lo que muestran los paneles sale de aquí, de modo que un KPI y la tabla
 * que hay debajo nunca pueden contar cosas distintas. No hay métricas
 * guardadas: se calculan a partir de los registros.
 */

/** Estados en los que la conversión ya cuenta como comisión ganada. */
const EARNED: readonly Conversion['status'][] = ['approved', 'scheduled', 'paid'];

export interface ConversionTotals {
  readonly conversions: number;
  readonly commission: Money;
  readonly pending: Money;
  readonly available: Money;
  readonly paid: Money;
  readonly revenue: Money;
}

export function totals(conversions: readonly Conversion[]): ConversionTotals {
  let commission = 0;
  let pending = 0;
  let available = 0;
  let paid = 0;
  let revenue = 0;
  let counted = 0;

  for (const conversion of conversions) {
    if (conversion.status === 'rejected' || conversion.status === 'refunded') continue;

    counted++;
    commission += conversion.commission;
    revenue += conversion.value;

    if (conversion.status === 'paid') paid += conversion.commission;
    else if (EARNED.includes(conversion.status)) available += conversion.commission;
    else pending += conversion.commission;
  }

  return {
    conversions: counted,
    commission: round(commission),
    pending: round(pending),
    available: round(available),
    paid: round(paid),
    revenue: round(revenue),
  };
}

/**
 * Registros dentro de una ventana de N días.
 *
 * `offset` desplaza la ventana hacia atrás, que es lo que permite pedir «el
 * mes anterior» sin duplicar la función.
 */
export function withinDays<T extends { occurredAt: IsoDate }>(
  records: readonly T[],
  days: number,
  offset = 0,
): T[] {
  return records.filter((record) => {
    const age = daysSince(record.occurredAt);
    return age >= offset && age < offset + days;
  });
}

/** Ventana inmediatamente anterior, para calcular la variación. */
export function previousWindow<T extends { occurredAt: IsoDate }>(
  records: readonly T[],
  days: number,
  offset = 0,
): T[] {
  return withinDays(records, days, offset + days);
}

/** Variación porcentual entre dos valores. `null` si no hay base de comparación. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/**
 * Serie diaria acumulando un campo de las conversiones.
 *
 * Devuelve un punto por día aunque no haya actividad: un gráfico con huecos
 * miente sobre el ritmo real.
 */
export function dailySeries(
  conversions: readonly Conversion[],
  days: number,
  field: 'commission' | 'value' | 'count',
  offset = 0,
): SeriesPoint[] {
  const buckets = new Map<string, number>();

  for (let day = offset + days - 1; day >= offset; day--) {
    buckets.set(demoDate(-day), 0);
  }

  for (const conversion of conversions) {
    if (conversion.status === 'rejected' || conversion.status === 'refunded') continue;
    if (!buckets.has(conversion.occurredAt)) continue;

    const amount = field === 'count' ? 1 : conversion[field];
    buckets.set(conversion.occurredAt, (buckets.get(conversion.occurredAt) ?? 0) + amount);
  }

  return [...buckets.entries()].map(([date, value]) => ({ date, value: round(value) }));
}

export interface ChannelBreakdown {
  readonly channel: ChannelId;
  readonly clicks: number;
  readonly conversions: number;
  readonly commission: Money;
  readonly conversionRate: number;
}

/** Rendimiento por canal, calculado sobre los links del afiliado. */
export function breakdownByChannel(links: readonly ReferralLink[]): ChannelBreakdown[] {
  const grouped = new Map<ChannelId, { clicks: number; conversions: number; commission: number }>();

  for (const link of links) {
    const current = grouped.get(link.channel) ?? { clicks: 0, conversions: 0, commission: 0 };
    grouped.set(link.channel, {
      clicks: current.clicks + link.clicks,
      conversions: current.conversions + link.conversions,
      commission: current.commission + link.commission,
    });
  }

  return [...grouped.entries()]
    .map(([channel, values]) => ({
      channel,
      clicks: values.clicks,
      conversions: values.conversions,
      commission: round(values.commission),
      conversionRate: values.clicks ? (values.conversions / values.clicks) * 100 : 0,
    }))
    .sort((a, b) => b.commission - a.commission);
}

export interface FunnelStage {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

/**
 * Embudo conceptual clic → visita → lead → conversión.
 *
 * Las etapas intermedias son proporciones fijas y simuladas: RELAY no mide
 * tráfico. Se muestran porque explican dónde se pierde la conversión, no
 * porque procedan de un evento real.
 */
export function funnel(clicks: number, conversions: number): FunnelStage[] {
  const visits = Math.round(clicks * 0.82);
  const leads = Math.round(visits * 0.21);

  return [
    { id: 'clicks', label: 'Clics', value: clicks },
    { id: 'visits', label: 'Visitas', value: visits },
    { id: 'leads', label: 'Leads', value: Math.max(leads, conversions) },
    { id: 'conversions', label: 'Conversiones', value: conversions },
  ];
}

export function conversionRate(conversions: number, clicks: number): number {
  return clicks ? (conversions / clicks) * 100 : 0;
}

/** Fecha de referencia de todos los cálculos. Se expone para la interfaz. */
export const ANALYTICS_TODAY = DEMO_TODAY;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
