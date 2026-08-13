import { describe, expect, it } from 'vitest';

import { CAMPAIGNS } from '../seed/campaigns.seed';
import {
  commissionDetail,
  commissionLabel,
  commissionPerConversion,
  estimateEarnings,
} from './commission';

const campaign = (id: string) => CAMPAIGNS.find((item) => item.id === id)!;

describe('commissionPerConversion', () => {
  it('devuelve el importe fijo tal cual', () => {
    expect(commissionPerConversion(campaign('landing-pro').commission, 2500)).toBe(300);
  });

  it('aplica el porcentaje sobre el valor de la conversión', () => {
    expect(commissionPerConversion(campaign('brand-sprint').commission, 1800)).toBe(216);
  });

  it('multiplica la recurrente por los meses que se paga', () => {
    // 20% de S/ 69 durante 3 meses.
    expect(commissionPerConversion(campaign('workspace-plus').commission, 69)).toBe(41.4);
  });
});

describe('estimateEarnings', () => {
  const landingPro = campaign('landing-pro');

  it('multiplica la comisión base por el número de conversiones', () => {
    const estimate = estimateEarnings(landingPro, 3);

    expect(estimate.base).toBe(900);
    expect(estimate.bonus).toBe(0);
    expect(estimate.total).toBe(900);
  });

  it('indica cuántas conversiones faltan para el bono', () => {
    expect(estimateEarnings(landingPro, 3).conversionsToBonus).toBe(2);
  });

  it('aplica el bono al alcanzar el umbral', () => {
    const estimate = estimateEarnings(landingPro, 5);

    expect(estimate.base).toBe(1500);
    expect(estimate.bonus).toBe(500);
    expect(estimate.total).toBe(2000);
    expect(estimate.conversionsToBonus).toBeNull();
  });

  it('no acumula el bono por múltiplos del umbral', () => {
    expect(estimateEarnings(landingPro, 10).bonus).toBe(500);
  });

  it('ignora conversiones negativas o fraccionarias', () => {
    expect(estimateEarnings(landingPro, -4).total).toBe(0);
    expect(estimateEarnings(landingPro, 2.7).base).toBe(600);
  });

  it('devuelve null en conversionsToBonus cuando la campaña no tiene bono', () => {
    expect(estimateEarnings(campaign('brand-sprint'), 3).conversionsToBonus).toBeNull();
  });
});

describe('etiquetas de comisión', () => {
  it('resume el modelo fijo con el importe', () => {
    expect(commissionLabel(campaign('landing-pro'))).toBe('S/ 300 por conversión');
  });

  it('resume el porcentaje por venta', () => {
    expect(commissionLabel(campaign('brand-sprint'))).toBe('12% por venta');
  });

  it('detalla la duración de la comisión recurrente', () => {
    expect(commissionLabel(campaign('workspace-plus'))).toBe('20% recurrente');
    expect(commissionDetail(campaign('workspace-plus'))).toBe('20% durante 3 meses');
  });
});
