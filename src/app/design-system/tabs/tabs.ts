import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  /** Contador opcional. Se muestra solo cuando aporta (aplicaciones, avisos). */
  readonly count?: number;
}

export interface TabLink extends Omit<TabItem, 'id'> {
  readonly link: string | readonly unknown[];
}

const TAB_BASE =
  'relative -mb-px shrink-0 border-b-2 px-1 pb-3 text-ui font-medium transition-colors ' +
  'duration-micro ease-standard focus-ring rounded-t-xs';

const TAB_ACTIVE = 'border-ink text-ink';
const TAB_IDLE = 'border-transparent text-text-secondary hover:text-ink';

/**
 * Tabs con estado local, siguiendo el patrón ARIA completo: `tablist`,
 * `tabindex` móvil y navegación con flechas.
 *
 * Para las secciones que además son rutas —el detalle de campaña de la
 * organización— se usa `rly-tab-nav`, que conserva enlaces reales.
 */
@Component({
  selector: 'rly-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div role="tablist" class="scrollbar-none flex gap-6 overflow-x-auto border-b border-border">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          type="button"
          role="tab"
          [id]="idFor(tab.id)"
          [attr.aria-selected]="tab.id === selected()"
          [attr.aria-controls]="panelIdFor(tab.id)"
          [tabindex]="tab.id === selected() ? 0 : -1"
          [class]="tab.id === selected() ? activeClasses : idleClasses"
          (click)="select(tab.id)"
          (keydown)="onKeydown($event)"
        >
          {{ tab.label }}
          @if (tab.count !== undefined) {
            <span class="ml-1.5 text-ui-sm tabular-nums text-text-muted">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class Tabs {
  readonly tabs = input.required<readonly TabItem[]>();
  readonly selected = input.required<string>();

  /** Prefijo de los ids, para enlazar cada tab con su panel. */
  readonly idPrefix = input('rly-tab');

  readonly selectedChange = output<string>();

  protected readonly activeClasses = `${TAB_BASE} ${TAB_ACTIVE}`;
  protected readonly idleClasses = `${TAB_BASE} ${TAB_IDLE}`;

  protected idFor(id: string): string {
    return `${this.idPrefix()}-${id}`;
  }

  protected panelIdFor(id: string): string {
    return `${this.idPrefix()}-${id}-panel`;
  }

  protected select(id: string): void {
    this.selectedChange.emit(id);
  }

  /** Flechas mueven entre tabs; Inicio/Fin saltan a los extremos. */
  protected onKeydown(event: KeyboardEvent): void {
    const ids = this.tabs().map((tab) => tab.id);
    const current = ids.indexOf(this.selected());
    if (current === -1) return;

    const next = {
      ArrowRight: (current + 1) % ids.length,
      ArrowLeft: (current - 1 + ids.length) % ids.length,
      Home: 0,
      End: ids.length - 1,
    }[event.key];

    if (next === undefined) return;

    event.preventDefault();
    this.selectedChange.emit(ids[next]);

    const tablist = (event.currentTarget as HTMLElement).parentElement;
    tablist?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus();
  }
}

/**
 * Navegación por pestañas basada en rutas. Cada pestaña es un enlace real, de
 * modo que se puede abrir en otra ventana y el historial funciona.
 */
@Component({
  selector: 'rly-tab-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'block' },
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <ul class="scrollbar-none flex gap-6 overflow-x-auto border-b border-border">
        @for (tab of tabs(); track tab.label) {
          <li>
            <a
              [routerLink]="tab.link"
              routerLinkActive
              #active="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: false }"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [class]="active.isActive ? activeClasses : idleClasses"
              class="block"
            >
              {{ tab.label }}
              @if (tab.count !== undefined) {
                <span class="ml-1.5 text-ui-sm tabular-nums text-text-muted">{{ tab.count }}</span>
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class TabNav {
  readonly tabs = input.required<readonly TabLink[]>();
  readonly ariaLabel = input('Secciones');

  protected readonly activeClasses = `${TAB_BASE} ${TAB_ACTIVE}`;
  protected readonly idleClasses = `${TAB_BASE} ${TAB_IDLE}`;
}

/** Panel asociado a un tab de `rly-tabs`. */
@Component({
  selector: 'rly-tab-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    tabindex: '0',
    class: 'block focus-ring rounded-sm',
    '[id]': 'panelId()',
    '[attr.aria-labelledby]': 'tabId()',
  },
  template: '<ng-content />',
})
export class TabPanel {
  readonly for = input.required<string>();
  readonly idPrefix = input('rly-tab');

  protected readonly tabId = computed(() => `${this.idPrefix()}-${this.for()}`);
  protected readonly panelId = computed(() => `${this.idPrefix()}-${this.for()}-panel`);
}

/** Estado local reutilizable para vistas con `rly-tabs`. */
export function useTabs(initial: string) {
  const selected = signal(initial);
  return { selected, select: (id: string) => selected.set(id) };
}
