import { Pipe, PipeTransform } from '@angular/core';

import {
  formatCompactNumber,
  formatCurrency,
  formatDelta,
  formatNumber,
  formatPercent,
} from '../utils/format';
import { daysSince, daysUntil } from '@data/seed/demo-clock';

/** `S/ 2,840` */
@Pipe({ name: 'rlyMoney' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrency(value ?? 0);
  }
}

/** `1,240` */
@Pipe({ name: 'rlyNumber' })
export class NumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value ?? 0);
  }
}

/** `24.8K` */
@Pipe({ name: 'rlyCompact' })
export class CompactPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCompactNumber(value ?? 0);
  }
}

/** `1.45%` */
@Pipe({ name: 'rlyPercent' })
export class PercentPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 1): string {
    return formatPercent(value ?? 0, digits);
  }
}

/** `+12.4%` */
@Pipe({ name: 'rlyDelta' })
export class DeltaPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 1): string {
    return value === null || value === undefined ? '—' : formatDelta(value, digits);
  }
}

/**
 * `hace 3 días` · `hoy` · `en 12 días`.
 *
 * Se calcula contra el reloj fijo de la demo, no contra la hora real, para que
 * la narrativa siga siendo coherente cuando el proyecto lleve meses publicado.
 */
@Pipe({ name: 'rlyRelativeDate' })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';

    const elapsed = daysSince(value);

    if (elapsed === 0) return 'hoy';
    if (elapsed === 1) return 'ayer';
    if (elapsed > 1 && elapsed < 30) return `hace ${elapsed} días`;
    if (elapsed >= 30 && elapsed < 60) return 'hace un mes';
    if (elapsed >= 60) return `hace ${Math.round(elapsed / 30)} meses`;

    const remaining = daysUntil(value);
    if (remaining === 1) return 'mañana';
    return `en ${remaining} días`;
  }
}

/** `13 ago 2026` */
@Pipe({ name: 'rlyDate' })
export class DatePipe implements PipeTransform {
  private static readonly formatter = new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return DatePipe.formatter.format(new Date(`${value}T12:00:00Z`)).replace('.', '');
  }
}
