export interface CsvColumn<T> {
  readonly header: string;
  readonly value: (row: T) => string | number | null | undefined;
}

/** Marca de orden de bytes: sin ella Excel abre los acentos del castellano mal. */
const BOM = '﻿';

const ROW_SEPARATOR = '\r\n';

/**
 * Exportación a CSV desde el navegador.
 *
 * RELAY exporta lo que hay en pantalla —con los filtros aplicados— y no todo
 * el conjunto: si la tabla muestra 12 conversiones filtradas, eso es lo que
 * espera recibir quien pulsa exportar.
 *
 * No hay servidor: el archivo se compone y se descarga en el cliente.
 */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((column) => escape(column.header)).join(',');

  const body = rows.map((row) =>
    columns.map((column) => escape(format(column.value(row)))).join(','),
  );

  return BOM + [header, ...body].join(ROW_SEPARATOR);
}

/** Descarga el contenido como archivo. Solo tiene efecto en el navegador. */
export function downloadCsv(filename: string, content: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/** Nombre con fecha, para que varias exportaciones no se pisen. */
export function csvFilename(prefix: string, date: string): string {
  return `relay-${prefix}-${date}.csv`;
}

function format(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return typeof value === 'number' ? String(value) : value;
}

function escape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
