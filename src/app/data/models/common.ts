/** Importe en soles peruanos. RELAY no maneja multi-divisa. */
export type Money = number;

/** Fecha en formato ISO 8601 (`2026-08-13`). */
export type IsoDate = string;

export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Variación de una métrica respecto al periodo anterior. */
export interface Trend {
  readonly value: number;
  readonly deltaPercent: number;
}

export type PeriodId = '7d' | '30d' | '90d' | 'this-month' | 'last-month';

export interface Period {
  readonly id: PeriodId;
  readonly label: string;
  readonly days: number;
}

export const PERIODS: readonly Period[] = [
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
  { id: 'this-month', label: 'Este mes', days: 30 },
  { id: 'last-month', label: 'Mes anterior', days: 30 },
];

/** Punto de una serie temporal de los gráficos. */
export interface SeriesPoint {
  readonly date: IsoDate;
  readonly value: number;
}
