import { Campaign, CommissionTerms } from '../models/campaign';
import { Money } from '../models/common';

/**
 * Cálculo de comisiones.
 *
 * Es la única aritmética del proyecto que el usuario ve directamente —en la
 * calculadora de ingresos del detalle de campaña— y por eso vive aislada y con
 * pruebas propias, en lugar de repartida por los componentes.
 *
 * No hay pagos reales: el resultado es una estimación que la interfaz etiqueta
 * como tal.
 */

/** Comisión que genera una única conversión del valor indicado. */
export function commissionPerConversion(terms: CommissionTerms, conversionValue: Money): Money {
  switch (terms.model) {
    case 'percentage':
      return round(conversionValue * ((terms.percentage ?? 0) / 100));

    case 'recurring':
      // La recurrente paga el mismo porcentaje durante N ciclos de facturación.
      return round(
        conversionValue * ((terms.percentage ?? 0) / 100) * (terms.recurringMonths ?? 1),
      );

    case 'fixed':
    case 'per-lead':
    case 'tiered':
      return round(terms.amount ?? 0);
  }
}

export interface EarningsEstimate {
  readonly conversions: number;
  readonly base: Money;
  readonly bonus: Money;
  readonly total: Money;
  /** Conversiones que faltan para desbloquear el bono, si lo hay. */
  readonly conversionsToBonus: number | null;
}

/**
 * Estimación de ingresos para un número de conversiones.
 *
 * El bono se aplica una sola vez al alcanzar el umbral: RELAY no acumula
 * bonos por múltiplos, que es una regla que la interfaz no podría explicar
 * de forma breve.
 */
export function estimateEarnings(campaign: Campaign, conversions: number): EarningsEstimate {
  const safeConversions = Math.max(0, Math.floor(conversions));
  const base = round(
    commissionPerConversion(campaign.commission, campaign.price) * safeConversions,
  );

  const bonusTerms = campaign.commission.bonus;
  const bonusReached = !!bonusTerms && safeConversions >= bonusTerms.threshold;
  const bonus = bonusReached ? bonusTerms.amount : 0;

  return {
    conversions: safeConversions,
    base,
    bonus,
    total: round(base + bonus),
    conversionsToBonus: bonusTerms && !bonusReached ? bonusTerms.threshold - safeConversions : null,
  };
}

/** Etiqueta corta de la comisión, la que se muestra en las tarjetas. */
export function commissionLabel(campaign: Campaign): string {
  const { commission } = campaign;

  switch (commission.model) {
    case 'percentage':
      return `${commission.percentage}% por venta`;

    case 'recurring':
      return `${commission.percentage}% recurrente`;

    case 'per-lead':
      return `${formatSoles(commission.amount ?? 0)} por lead`;

    case 'fixed':
    case 'tiered':
      return `${formatSoles(commission.amount ?? 0)} por conversión`;
  }
}

/** Detalle largo de la comisión, para el panel de la campaña. */
export function commissionDetail(campaign: Campaign): string {
  const { commission } = campaign;

  if (commission.model === 'recurring') {
    const months = commission.recurringMonths ?? 1;
    return `${commission.percentage}% durante ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  return commissionLabel(campaign);
}

function round(value: Money): Money {
  return Math.round(value * 100) / 100;
}

function formatSoles(value: Money): string {
  return `S/ ${value.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
}
