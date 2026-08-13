import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Pagination } from './pagination';

/**
 * La ventana de páginas es la única lógica no trivial del componente, y la que
 * decide si la barra cabe en una fila. Se prueba a través del DOM renderizado
 * porque es ahí donde importa.
 */
function renderPages(page: number, total: number, pageSize = 10): string[] {
  const fixture = TestBed.createComponent(Pagination);
  fixture.componentRef.setInput('page', page);
  fixture.componentRef.setInput('pageSize', pageSize);
  fixture.componentRef.setInput('total', total);
  fixture.detectChanges();

  return [...fixture.nativeElement.querySelectorAll('ul li')].map((item) =>
    (item as HTMLElement).textContent!.trim(),
  );
}

describe('Pagination', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Pagination] }));

  it('lista todas las páginas cuando son pocas', () => {
    expect(renderPages(1, 50)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('inserta elipsis al final cuando la página actual está al principio', () => {
    expect(renderPages(2, 200)).toEqual(['1', '2', '3', '4', '…', '20']);
  });

  it('inserta elipsis a ambos lados en el centro del rango', () => {
    expect(renderPages(10, 200)).toEqual(['1', '…', '9', '10', '11', '…', '20']);
  });

  it('inserta elipsis al principio cuando la página actual está al final', () => {
    expect(renderPages(19, 200)).toEqual(['1', '…', '17', '18', '19', '20']);
  });

  it('muestra el rango de resultados de la página actual', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('total', 24);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('p').textContent.replace(/\s+/g, ' ').trim()).toBe(
      '21–24 de 24',
    );
  });

  it('no emite cuando ya se está en la página solicitada', () => {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('total', 50);
    fixture.detectChanges();

    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));

    fixture.nativeElement.querySelectorAll('ul li button')[0].click();
    expect(emitted).toEqual([]);

    fixture.nativeElement.querySelectorAll('ul li button')[2].click();
    expect(emitted).toEqual([3]);
  });
});
