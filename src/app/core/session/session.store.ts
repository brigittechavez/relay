import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Affiliate } from '@data/models/affiliate';
import { Organization } from '@data/models/organization';
import { CatalogRepository } from '@data/repositories/catalog.repository';
import { EngagementRepository } from '@data/repositories/engagement.repository';
import { DemoSession } from '@data/store/demo-database';
import { Workspace, WorkspaceStore } from '../workspace/workspace.store';

/**
 * Sesión demo.
 *
 * No es autenticación: no hay credenciales, tokens ni servidor. Entrar en la
 * demo es elegir un punto de partida, y este store guarda cuál es, qué perfil
 * y qué organizaciones están disponibles, y alimenta el workspace switcher.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly engagement = inject(EngagementRepository);
  private readonly catalog = inject(CatalogRepository);
  private readonly workspaces = inject(WorkspaceStore);

  private readonly current = signal<DemoSession | null>(null);
  private readonly affiliateProfile = signal<Affiliate | null>(null);
  private readonly organizationList = signal<readonly Organization[]>([]);
  private readonly loaded = signal(false);

  readonly session = this.current.asReadonly();
  readonly affiliate = this.affiliateProfile.asReadonly();
  readonly organizations = this.organizationList.asReadonly();
  readonly ready = this.loaded.asReadonly();

  readonly isActive = computed(() => this.current() !== null);

  readonly needsOnboarding = computed(() => {
    const session = this.current();
    return session !== null && !session.onboardingCompleted;
  });

  /** Carga la sesión persistida. Idempotente: los guards pueden llamarla. */
  async restore(): Promise<DemoSession | null> {
    if (this.loaded()) return this.current();

    const session = await firstValueFrom(this.engagement.session());
    await this.hydrate(session);
    this.loaded.set(true);

    return session;
  }

  /** Entra en la demo como afiliada, como organización o como cuenta nueva. */
  async start(as: 'affiliate' | 'organization' | 'new', name?: string, email?: string) {
    const session = await firstValueFrom(this.engagement.startSession({ as, name, email }));
    await this.hydrate(session);
    this.loaded.set(true);

    return session;
  }

  async end(): Promise<void> {
    await firstValueFrom(this.engagement.endSession());
    this.current.set(null);
    this.affiliateProfile.set(null);
    this.organizationList.set([]);
    this.workspaces.clear();
  }

  async completeOnboarding(): Promise<void> {
    await this.patch({ onboardingCompleted: true });
  }

  async setActiveWorkspace(id: string): Promise<void> {
    await this.patch({ activeWorkspaceId: id });
    this.workspaces.setActive(id);
  }

  /** Vuelve a leer el perfil tras editarlo, para refrescar el switcher. */
  async refreshProfile(): Promise<void> {
    const session = this.current();
    if (!session) return;

    await this.hydrate(session);
  }

  async patch(patch: Partial<DemoSession>): Promise<void> {
    if (!this.current()) return;

    const session = await firstValueFrom(this.engagement.patchSession(patch));
    await this.hydrate(session);
  }

  /** Restablece los datos de la demo y vuelve al estado inicial de la sesión. */
  async resetDemo(): Promise<void> {
    await firstValueFrom(this.engagement.resetDemo());
    this.current.set(null);
    this.affiliateProfile.set(null);
    this.organizationList.set([]);
    this.workspaces.clear();
    this.loaded.set(false);
  }

  private async hydrate(session: DemoSession | null): Promise<void> {
    this.current.set(session);

    if (!session) {
      this.affiliateProfile.set(null);
      this.organizationList.set([]);
      this.workspaces.clear();
      return;
    }

    const [affiliate, organizations] = await Promise.all([
      firstValueFrom(this.catalog.affiliate(session.affiliateId)),
      firstValueFrom(this.catalog.listOrganizations()),
    ]);

    const owned = organizations.filter((organization) =>
      session.organizationIds.includes(organization.id),
    );

    this.affiliateProfile.set(affiliate);
    this.organizationList.set(owned);
    this.workspaces.setWorkspaces([toWorkspace(affiliate), ...owned.map(toOrganizationWorkspace)]);
    this.workspaces.setActive(session.activeWorkspaceId);
  }
}

function toWorkspace(affiliate: Affiliate): Workspace {
  return {
    id: affiliate.id,
    kind: 'affiliate',
    name: affiliate.name,
    subtitle: 'Mi perfil de afiliado',
    initials: affiliate.initials,
  };
}

function toOrganizationWorkspace(organization: Organization): Workspace {
  return {
    id: organization.id,
    kind: 'organization',
    name: organization.name,
    subtitle: 'Organización',
    initials: organization.initials,
  };
}
