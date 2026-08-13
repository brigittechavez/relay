import { describe, expect, it } from 'vitest';

import { AFFILIATES } from '../seed/affiliates.seed';
import { CAMPAIGNS } from '../seed/campaigns.seed';
import { computeMatch, computeMatchScore, evaluateEligibility } from './matching';

const lucia = AFFILIATES.find((affiliate) => affiliate.id === 'lucia-vega')!;
const campaign = (id: string) => CAMPAIGNS.find((item) => item.id === id)!;

describe('computeMatchScore', () => {
  /**
   * Los datos demo definen la compatibilidad de Lucía con cada campaña. Estas
   * cifras no están guardadas: salen del algoritmo, así que la prueba fija el
   * contrato entre el seed y la fórmula.
   */
  it.each([
    ['landing-pro', 93],
    ['growth-bootcamp', 90],
    ['workspace-plus', 88],
    ['estrategia-de-marca', 86],
    ['brand-sprint', 85],
    ['membresia-profesional', 82],
    ['revenue-systems', 79],
  ])('el match de Lucía con %s es %i%%', (id, expected) => {
    expect(computeMatchScore(lucia, campaign(id))).toBe(expected);
  });

  it('el desglose suma la puntuación total', () => {
    const result = computeMatch(lucia, campaign('landing-pro'));
    const sum = result.components.reduce((total, component) => total + component.points, 0);

    expect(Math.round(sum)).toBe(result.score);
  });

  it('penaliza a quien no está en un país admitido', () => {
    const foreign = { ...lucia, country: 'ES' };

    expect(computeMatchScore(foreign, campaign('landing-pro'))).toBeLessThan(
      computeMatchScore(lucia, campaign('landing-pro')),
    );
  });

  it('nunca supera 100 ni baja de 0', () => {
    for (const item of CAMPAIGNS) {
      for (const affiliate of AFFILIATES) {
        const score = computeMatchScore(affiliate, item);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('evaluateEligibility', () => {
  it('Lucía cumple todos los requisitos de Landing Pro', () => {
    const result = evaluateEligibility(lucia, campaign('landing-pro'));

    expect(result.eligible).toBe(true);
    expect(result.metCount).toBe(result.total);
  });

  it('a Lucía le falta la experiencia B2B obligatoria de Revenue Systems', () => {
    const result = evaluateEligibility(lucia, campaign('revenue-systems'));

    expect(result.eligible).toBe(false);
    expect(result.missingMandatory).toHaveLength(1);
    expect(result.missingMandatory[0].requirement.kind).toBe('experience');
  });

  it('los requisitos recomendados no bloquean la solicitud', () => {
    const withoutNiche = { ...lucia, niches: [] as never[] };
    const result = evaluateEligibility(withoutNiche, campaign('landing-pro'));

    expect(result.eligible).toBe(true);
    expect(result.missingRecommended.length).toBeGreaterThan(0);
  });

  it('un perfil incompleto bloquea una campaña que lo exige', () => {
    const incomplete = { ...lucia, profileCompleteness: 55 };

    expect(evaluateEligibility(incomplete, campaign('landing-pro')).eligible).toBe(false);
  });
});
