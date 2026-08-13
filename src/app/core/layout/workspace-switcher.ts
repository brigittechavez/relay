import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Icon } from '@ds/icon/icon';
import { Workspace, WorkspaceStore } from '../workspace/workspace.store';

/**
 * Cambio entre el perfil de afiliado y las organizaciones de la cuenta.
 *
 * Usa el menú del CDK, que aporta el rol `menu`, la navegación con flechas, el
 * cierre con Escape y la devolución del foco al disparador.
 */
@Component({
  selector: 'rly-workspace-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, Icon],
  host: { class: 'block' },
  template: `
    @if (store.active(); as active) {
      <button
        type="button"
        [cdkMenuTriggerFor]="menu"
        class="focus-ring flex w-full items-center gap-2.5 rounded-md border border-border
               bg-surface p-2 text-left transition-colors duration-micro hover:bg-surface-muted"
      >
        <span [class]="avatarClasses(active)">{{ active.initials }}</span>

        <span class="min-w-0 flex-1">
          <span class="block truncate text-ui font-medium text-ink">{{ active.name }}</span>
          <span class="block truncate text-ui-sm text-text-muted">{{ active.subtitle }}</span>
        </span>

        <rly-icon name="chevrons-up-down" [size]="16" class="text-text-muted" />
      </button>
    }

    <ng-template #menu>
      <div
        cdkMenu
        class="w-64 rounded-md border border-border bg-surface p-1.5 shadow-lg"
        style="z-index: var(--rly-z-overlay)"
      >
        <p class="px-2.5 py-1.5 text-label uppercase text-text-muted">Cuenta</p>

        @if (store.affiliate(); as affiliate) {
          <button cdkMenuItem [class]="itemClasses" (cdkMenuItemTriggered)="go(affiliate)">
            <span [class]="avatarClasses(affiliate)">{{ affiliate.initials }}</span>
            <span class="min-w-0 flex-1 truncate">{{ affiliate.name }}</span>
            @if (affiliate.id === store.active()?.id) {
              <rly-icon name="check" [size]="16" />
            }
          </button>
        }

        @if (store.organizations().length) {
          <p class="mt-1 px-2.5 py-1.5 text-label uppercase text-text-muted">Organizaciones</p>

          @for (organization of store.organizations(); track organization.id) {
            <button cdkMenuItem [class]="itemClasses" (cdkMenuItemTriggered)="go(organization)">
              <span [class]="avatarClasses(organization)">{{ organization.initials }}</span>
              <span class="min-w-0 flex-1 truncate">{{ organization.name }}</span>
              @if (organization.id === store.active()?.id) {
                <rly-icon name="check" [size]="16" />
              }
            </button>
          }
        }
      </div>
    </ng-template>
  `,
})
export class WorkspaceSwitcher {
  private readonly router = inject(Router);

  protected readonly store = inject(WorkspaceStore);

  protected readonly itemClasses =
    'focus-ring flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-ui ' +
    'text-ink transition-colors duration-micro hover:bg-surface-muted';

  /** El perfil personal se distingue del resto por el color del avatar. */
  protected avatarClasses(workspace: Workspace): string {
    const base =
      'flex size-8 shrink-0 items-center justify-center rounded-sm text-ui-sm font-semibold';

    return workspace.kind === 'affiliate'
      ? `${base} bg-accent text-accent-contrast`
      : `${base} bg-ink text-text-inverse`;
  }

  protected go(workspace: Workspace): void {
    this.store.setActive(workspace.id);
    void this.router.navigateByUrl(this.store.homeRoute(workspace));
  }
}
