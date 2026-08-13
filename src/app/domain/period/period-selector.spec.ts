import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PeriodSelector, periodWindow } from './period-selector';

/**
 * El selector tiene dos representaciones del mismo estado —botones en
 * escritorio y desplegable en móvil— y son justo las que pueden desincronizarse
 * sin que nadie lo note hasta ver una captura.
 */
function render(selected: string) {
  const fixture = TestBed.createComponent(PeriodSelector);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PeriodSelector', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PeriodSelector] }));

  it('marca el periodo activo en el grupo de botones', () => {
    const element = render('90d');
    const pressed = [...element.querySelectorAll('button')].filter(
      (button) => button.getAttribute('aria-pressed') === 'true',
    );

    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent!.trim()).toBe('90 días');
  });

  it('el desplegable móvil abre en el periodo activo, no en el primero', () => {
    const select = render('90d').querySelector('select')!;

    expect(select.value).toBe('90d');
    expect(select.selectedIndex).not.toBe(0);
  });
});

describe('periodWindow', () => {
  it('traduce cada periodo a su ventana de días', () => {
    expect(periodWindow('7d')).toMatchObject({ days: 7, offset: 0 });
    expect(periodWindow('30d')).toMatchObject({ days: 30, offset: 0 });
    expect(periodWindow('90d')).toMatchObject({ days: 90, offset: 0 });
  });

  it('el mes anterior desplaza la ventana treinta días hacia atrás', () => {
    expect(periodWindow('last-month')).toMatchObject({ days: 30, offset: 30 });
  });
});
