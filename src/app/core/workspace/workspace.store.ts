import { computed, Injectable, signal } from '@angular/core';

export type WorkspaceKind = 'affiliate' | 'organization';

export interface Workspace {
  /** `affiliate` para el perfil personal; el slug para cada organización. */
  readonly id: string;
  readonly kind: WorkspaceKind;
  readonly name: string;
  readonly subtitle: string;
  readonly initials: string;
}

/**
 * Contexto activo de la cuenta.
 *
 * Una misma persona opera como afiliada y administra organizaciones. Cambiar
 * de contexto cambia la navegación y las rutas, pero no la identidad de la
 * cuenta ni el estado de la demo.
 *
 * El store solo conoce la lista y cuál está activo; quién la rellena (la
 * sesión demo) y cómo se persiste vive en la capa de datos.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly items = signal<readonly Workspace[]>([]);
  private readonly activeId = signal<string | null>(null);

  readonly workspaces = this.items.asReadonly();

  readonly active = computed(
    () => this.items().find((workspace) => workspace.id === this.activeId()) ?? null,
  );

  readonly organizations = computed(() =>
    this.items().filter((workspace) => workspace.kind === 'organization'),
  );

  readonly affiliate = computed(
    () => this.items().find((workspace) => workspace.kind === 'affiliate') ?? null,
  );

  setWorkspaces(workspaces: readonly Workspace[]): void {
    this.items.set(workspaces);

    if (!workspaces.some((workspace) => workspace.id === this.activeId())) {
      this.activeId.set(workspaces[0]?.id ?? null);
    }
  }

  setActive(id: string): void {
    if (this.items().some((workspace) => workspace.id === id)) {
      this.activeId.set(id);
    }
  }

  /** Ruta de inicio del contexto, usada al cambiar desde el switcher. */
  homeRoute(workspace: Workspace): string {
    return workspace.kind === 'affiliate'
      ? '/app/affiliate/inicio'
      : `/app/organization/${workspace.id}/overview`;
  }

  clear(): void {
    this.items.set([]);
    this.activeId.set(null);
  }
}
