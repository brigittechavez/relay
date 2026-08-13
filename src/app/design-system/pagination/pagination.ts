import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from '../icon/icon';

type PageSlot = number | 'gap';

/**
 * Paginación de tablas y listados.
 *
 * En móvil se reduce a anterior/siguiente más el indicador de posición: la
 * lista de números no cabe sin comprimir los objetivos táctiles.
 */
@Component({
  selector: 'rly-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <nav
      class="flex items-center justify-between gap-4 border-t border-border pt-4"
      [attr.aria-label]="ariaLabel()"
    >
      <p class="text-ui-sm text-text-secondary">
        <span class="tabular-nums">{{ rangeStart() }}–{{ rangeEnd() }}</span>
        de
        <span class="tabular-nums">{{ total() }}</span>
      </p>

      <div class="flex items-center gap-1">
        <button
          type="button"
          [class]="stepClasses"
          [disabled]="page() === 1"
          aria-label="Página anterior"
          (click)="go(page() - 1)"
        >
          <rly-icon name="chevron-left" [size]="16" />
        </button>

        <ul class="hidden items-center gap-1 sm:flex">
          @for (slot of slots(); track $index) {
            <li>
              @if (slot === 'gap') {
                <span class="px-1 text-ui-sm text-text-muted" aria-hidden="true">…</span>
              } @else {
                <button
                  type="button"
                  [class]="slot === page() ? currentClasses : pageClasses"
                  [attr.aria-current]="slot === page() ? 'page' : null"
                  [attr.aria-label]="'Página ' + slot"
                  (click)="go(slot)"
                >
                  {{ slot }}
                </button>
              }
            </li>
          }
        </ul>

        <span class="px-2 text-ui-sm tabular-nums text-text-secondary sm:hidden">
          {{ page() }} / {{ pageCount() }}
        </span>

        <button
          type="button"
          [class]="stepClasses"
          [disabled]="page() === pageCount()"
          aria-label="Página siguiente"
          (click)="go(page() + 1)"
        >
          <rly-icon name="chevron-right" [size]="16" />
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly ariaLabel = input('Paginación');

  readonly pageChange = output<number>();

  protected readonly stepClasses =
    'focus-ring flex size-9 items-center justify-center rounded-sm border border-border ' +
    'bg-surface text-text-secondary transition-colors duration-micro hover:bg-surface-muted ' +
    'hover:text-ink disabled:pointer-events-none disabled:opacity-40';

  protected readonly pageClasses =
    'focus-ring flex size-9 items-center justify-center rounded-sm text-ui-sm tabular-nums ' +
    'text-text-secondary transition-colors duration-micro hover:bg-surface-muted hover:text-ink';

  protected readonly currentClasses =
    'focus-ring flex size-9 items-center justify-center rounded-sm bg-ink text-ui-sm ' +
    'tabular-nums font-medium text-text-inverse';

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.total()),
  );

  /**
   * Ventana de páginas: primera, última, la actual y sus vecinas, con elipsis
   * en los saltos. Con pocas páginas se listan todas.
   */
  protected readonly slots = computed<readonly PageSlot[]>(() => {
    const count = this.pageCount();
    const current = this.page();

    if (count <= 7) {
      return Array.from({ length: count }, (_, index) => index + 1);
    }

    const window = new Set([1, count, current, current - 1, current + 1]);
    if (current <= 3) [2, 3, 4].forEach((page) => window.add(page));
    if (current >= count - 2) [count - 3, count - 2, count - 1].forEach((page) => window.add(page));

    const pages = [...window].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);

    return pages.flatMap((page, index) =>
      index > 0 && page - pages[index - 1] > 1 ? (['gap', page] as PageSlot[]) : [page],
    );
  });

  protected go(page: number): void {
    const clamped = Math.min(Math.max(page, 1), this.pageCount());
    if (clamped !== this.page()) {
      this.pageChange.emit(clamped);
    }
  }
}
