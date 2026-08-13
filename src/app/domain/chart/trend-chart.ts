import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import type { Chart, ChartConfiguration } from 'chart.js';

import { SeriesPoint } from '@data/models/common';
import { formatCurrency, formatNumber } from '@shared/utils/format';

export type TrendFormat = 'money' | 'number';

/**
 * Serie temporal.
 *
 * Chart.js se importa de forma dinámica y solo en el navegador: la librería no
 * entra en el bundle inicial ni se ejecuta durante el render en servidor, donde
 * además no hay canvas que dibujar.
 *
 * El estilo es deliberadamente sobrio —una sola serie, rejilla casi invisible,
 * Relay Acid solo en el relleno— porque el gráfico responde una pregunta
 * concreta y no compite con los KPIs que tiene al lado.
 */
@Component({
  selector: 'rly-trend-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative" [style.height.px]="height()">
      <canvas #canvas [attr.aria-label]="ariaLabel()" role="img"></canvas>
    </div>

    <!-- Alternativa textual: un canvas no es legible por lectores de pantalla. -->
    <p class="sr-only">{{ summary() }}</p>
  `,
})
export class TrendChart implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private chart: Chart | null = null;
  private ready = false;

  readonly series = input.required<readonly SeriesPoint[]>();
  readonly label = input('Serie');
  readonly format = input<TrendFormat>('number');
  readonly height = input(240);
  readonly ariaLabel = input('Evolución en el tiempo');

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      void this.render();
    });

    effect(() => {
      // Leer la serie registra la dependencia aunque el gráfico aún no exista.
      this.series();
      if (this.ready) void this.render();
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  /** Resumen textual equivalente al gráfico. */
  protected summary(): string {
    const points = this.series();
    if (!points.length) return 'Sin datos en el periodo seleccionado.';

    const total = points.reduce((sum, point) => sum + point.value, 0);
    const peak = points.reduce((best, point) => (point.value > best.value ? point : best));

    return (
      `${this.label()}: ${this.formatValue(total)} en ${points.length} días. ` +
      `El día con más actividad fue el ${peak.date} con ${this.formatValue(peak.value)}.`
    );
  }

  private async render(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const context = this.canvas().nativeElement.getContext('2d');
    if (!context) return;

    const points = this.series();

    if (this.chart) {
      this.chart.data.labels = points.map((point) => point.date);
      this.chart.data.datasets[0].data = points.map((point) => point.value);
      this.chart.update('none');
      return;
    }

    this.chart = new Chart(context, this.configuration(points));
  }

  private configuration(points: readonly SeriesPoint[]): ChartConfiguration<'line'> {
    const ink = 'rgb(16, 18, 16)';
    const border = 'rgba(221, 224, 216, 0.6)';

    return {
      type: 'line',
      data: {
        labels: points.map((point) => point.date),
        datasets: [
          {
            label: this.label(),
            data: points.map((point) => point.value),
            borderColor: ink,
            borderWidth: 2,
            backgroundColor: 'rgba(215, 255, 63, 0.35)',
            fill: true,
            tension: 0.32,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: ink,
            pointHoverBorderColor: 'rgb(215, 255, 63)',
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: prefersReducedMotion() ? 0 : 420 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ink,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            titleFont: { family: 'inherit', size: 12, weight: 500 },
            bodyFont: { family: 'inherit', size: 13, weight: 600 },
            callbacks: {
              title: (items) => formatDayLabel(String(items[0]?.label ?? '')),
              label: (item) => this.formatValue(item.parsed.y ?? 0),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: border },
            ticks: {
              color: 'rgb(141, 147, 137)',
              font: { family: 'inherit', size: 11 },
              maxRotation: 0,
              autoSkipPadding: 24,
              callback: (_value, index) => formatTick(points[index]?.date ?? ''),
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: border },
            border: { display: false },
            ticks: {
              color: 'rgb(141, 147, 137)',
              font: { family: 'inherit', size: 11 },
              maxTicksLimit: 5,
              callback: (value) => this.formatValue(Number(value)),
            },
          },
        },
      },
    };
  }

  private formatValue(value: number): string {
    return this.format() === 'money' ? formatCurrency(value) : formatNumber(value);
  }
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatTick(date: string): string {
  const [, month, day] = date.split('-');
  return day ? `${Number(day)} ${MONTHS[Number(month) - 1]}` : date;
}

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split('-');
  return day ? `${Number(day)} de ${MONTHS[Number(month) - 1]} de ${year}` : date;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
