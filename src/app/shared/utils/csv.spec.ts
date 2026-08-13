import { describe, expect, it } from 'vitest';

import { csvFilename, toCsv } from './csv';

interface Row {
  readonly name: string;
  readonly amount: number;
  readonly note?: string;
}

const columns = [
  { header: 'Nombre', value: (row: Row) => row.name },
  { header: 'Importe', value: (row: Row) => row.amount },
  { header: 'Nota', value: (row: Row) => row.note },
];

/** El CSV se abre en Excel, así que el escapado y el BOM no son opcionales. */
describe('toCsv', () => {
  const parse = (csv: string) => csv.replace('\uFEFF', '').split('\r\n');

  it('empieza con BOM para que Excel respete los acentos', () => {
    expect(toCsv([], columns).startsWith('\uFEFF')).toBe(true);
  });

  it('escribe la cabecera aunque no haya filas', () => {
    expect(parse(toCsv([], columns))).toEqual(['Nombre,Importe,Nota']);
  });

  it('separa las filas con CRLF', () => {
    const rows: Row[] = [
      { name: 'Landing Pro', amount: 300 },
      { name: 'Brand Sprint', amount: 216 },
    ];

    expect(parse(toCsv(rows, columns))).toEqual([
      'Nombre,Importe,Nota',
      'Landing Pro,300,',
      'Brand Sprint,216,',
    ]);
  });

  it('entrecomilla los valores con comas, comillas o saltos de línea', () => {
    const rows: Row[] = [
      { name: 'Norte Digital, S.A.', amount: 1, note: 'Dijo "sí"' },
      { name: 'Con\nsalto', amount: 2 },
    ];

    const lines = parse(toCsv(rows, columns));

    expect(lines[1]).toBe('"Norte Digital, S.A.",1,"Dijo ""sí"""');
    expect(lines[2]).toContain('"Con');
  });

  it('deja vacíos los valores nulos o indefinidos', () => {
    expect(parse(toCsv([{ name: 'X', amount: 0 }], columns))[1]).toBe('X,0,');
  });
});

describe('csvFilename', () => {
  it('compone un nombre con prefijo y fecha', () => {
    expect(csvFilename('links', '2026-08-13')).toBe('relay-links-2026-08-13.csv');
  });
});
