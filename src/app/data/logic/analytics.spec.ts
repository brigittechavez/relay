import { describe, expect, it } from 'vitest';

import { CONVERSIONS, REFERRAL_LINKS } from '../seed/activity.seed';
import {
  breakdownByChannel,
  conversionRate,
  dailySeries,
  delta,
  funnel,
  totals,
  withinDays,
} from './analytics';

const luciaConversions = CONVERSIONS.filter((item) => item.affiliateId === 'lucia-vega');
const luciaLinks = REFERRAL_LINKS.filter((item) => item.affiliateId === 'lucia-vega');

describe('KPIs del panel de Lucía', () => {
  const window = withinDays(luciaConversions, 30);
  const summary = totals(window);
  const clicks = luciaLinks.reduce((total, link) => total + link.clicks, 0);

  it('cuenta 18 conversiones en los últimos 30 días', () => {
    expect(summary.conversions).toBe(18);
  });

  it('acumula 1.240 clics entre todos sus links', () => {
    expect(clicks).toBe(1240);
  });

  it('produce una tasa de conversión del 1,45%', () => {
    expect(conversionRate(summary.conversions, clicks).toFixed(2)).toBe('1.45');
  });

  it('reparte las comisiones entre pendiente, disponible y pagado', () => {
    expect(summary.pending + summary.available + summary.paid).toBeCloseTo(summary.commission, 2);
    expect(summary.paid).toBeGreaterThan(summary.available);
  });
});

describe('totals', () => {
  it('excluye conversiones rechazadas y reembolsadas del recuento', () => {
    const withRefund = [
      ...luciaConversions.slice(0, 2),
      { ...luciaConversions[0], id: 'x', status: 'refunded' as const, commission: 0 },
    ];

    expect(totals(withRefund).conversions).toBe(2);
  });
});

describe('delta', () => {
  it('calcula la variación porcentual', () => {
    expect(delta(120, 100)).toBe(20);
    expect(delta(80, 100)).toBe(-20);
  });

  it('devuelve null cuando no hay base de comparación', () => {
    expect(delta(10, 0)).toBeNull();
    expect(delta(0, 0)).toBe(0);
  });
});

describe('dailySeries', () => {
  it('devuelve un punto por día, incluidos los días sin actividad', () => {
    const series = dailySeries(luciaConversions, 30, 'count');

    expect(series).toHaveLength(30);
    expect(series.some((point) => point.value === 0)).toBe(true);
  });

  it('el total de la serie coincide con las conversiones de la ventana', () => {
    const series = dailySeries(withinDays(luciaConversions, 30), 30, 'count');
    const sum = series.reduce((total, point) => total + point.value, 0);

    expect(sum).toBe(18);
  });
});

describe('breakdownByChannel', () => {
  it('agrupa los links por canal y ordena por comisión', () => {
    const breakdown = breakdownByChannel(luciaLinks);

    expect(breakdown[0].commission).toBeGreaterThanOrEqual(breakdown[1].commission);
    expect(breakdown.map((entry) => entry.channel)).toContain('instagram');
  });
});

describe('funnel', () => {
  it('es monótono decreciente', () => {
    const stages = funnel(1240, 18);

    for (let index = 1; index < stages.length; index++) {
      expect(stages[index].value).toBeLessThanOrEqual(stages[index - 1].value);
    }
  });
});
