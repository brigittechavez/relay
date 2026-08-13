import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatCurrency,
  formatDelta,
  formatNumber,
  formatPercent,
} from './format';

describe('formatCurrency', () => {
  it('formatea importes enteros sin decimales', () => {
    expect(formatCurrency(2840)).toBe('S/ 2,840');
  });

  it('muestra decimales solo cuando el importe los tiene', () => {
    expect(formatCurrency(300.5)).toBe('S/ 300.50');
  });

  it('soporta el cero', () => {
    expect(formatCurrency(0)).toBe('S/ 0');
  });
});

describe('formatNumber', () => {
  it('agrupa los miles', () => {
    expect(formatNumber(1240)).toBe('1,240');
  });
});

describe('formatCompactNumber', () => {
  it('deja los valores pequeños intactos', () => {
    expect(formatCompactNumber(840)).toBe('840');
  });

  it('abrevia los millares', () => {
    expect(formatCompactNumber(24800)).toBe('24.8K');
    expect(formatCompactNumber(3100)).toBe('3.1K');
    expect(formatCompactNumber(8000)).toBe('8K');
  });

  it('abrevia los millones', () => {
    expect(formatCompactNumber(1_400_000)).toBe('1.4M');
  });
});

describe('formatPercent', () => {
  it('usa una decimal por defecto', () => {
    expect(formatPercent(1.45)).toBe('1.5%');
    expect(formatPercent(93)).toBe('93.0%');
  });

  it('acepta precisión explícita', () => {
    expect(formatPercent(1.45, 2)).toBe('1.45%');
    expect(formatPercent(93, 0)).toBe('93%');
  });
});

describe('formatDelta', () => {
  it('antepone el signo en las variaciones positivas', () => {
    expect(formatDelta(12.4)).toBe('+12.4%');
  });

  it('conserva el signo negativo', () => {
    expect(formatDelta(-3.1)).toBe('-3.1%');
  });
});
