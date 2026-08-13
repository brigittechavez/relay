import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { Badge, BadgeTone } from '@ds/badge/badge';
import { ApplicationStatus, APPLICATION_STATUS_LABELS } from '@data/models/application';
import {
  ACCESS_LABELS,
  Campaign,
  CampaignAccess,
  CampaignStatus,
  STATUS_LABELS,
} from '@data/models/campaign';
import {
  ConversionStatus,
  CONVERSION_STATUS_LABELS,
  PartnershipStatus,
  PARTNERSHIP_STATUS_LABELS,
  PayoutStatus,
  PAYOUT_STATUS_LABELS,
} from '@data/models/tracking';
import { daysUntil } from '@data/seed/demo-clock';
import { commissionLabel } from '@data/logic/commission';

/**
 * Insignias de estado del dominio.
 *
 * Viven juntas porque comparten una regla: el color refuerza, el texto informa.
 * Cada estado tiene un tono asignado en un solo sitio, de modo que «aprobada»
 * se ve igual en la lista del afiliado y en la tabla de la organización.
 */

const APPLICATION_TONES: Record<ApplicationStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'info',
  'under-review': 'warning',
  'info-requested': 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

@Component({
  selector: 'rly-application-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" dot>{{ label() }}</rly-badge>`,
})
export class ApplicationStatusBadge {
  readonly status = input.required<ApplicationStatus>();

  protected readonly tone = computed(() => APPLICATION_TONES[this.status()]);
  protected readonly label = computed(() => APPLICATION_STATUS_LABELS[this.status()]);
}

const CAMPAIGN_TONES: Record<CampaignStatus, BadgeTone> = {
  draft: 'neutral',
  'pending-review': 'warning',
  scheduled: 'info',
  active: 'success',
  paused: 'warning',
  ended: 'neutral',
  archived: 'neutral',
};

@Component({
  selector: 'rly-campaign-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" dot>{{ label() }}</rly-badge>`,
})
export class CampaignStatusBadge {
  readonly status = input.required<CampaignStatus>();

  protected readonly tone = computed(() => CAMPAIGN_TONES[this.status()]);
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}

const CONVERSION_TONES: Record<ConversionStatus, BadgeTone> = {
  registered: 'neutral',
  validating: 'warning',
  approved: 'success',
  scheduled: 'info',
  paid: 'success',
  rejected: 'danger',
  refunded: 'danger',
};

@Component({
  selector: 'rly-conversion-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" [outline]="outline()" dot>{{ label() }}</rly-badge>`,
})
export class ConversionStatusBadge {
  readonly status = input.required<ConversionStatus>();
  readonly outline = input(false, { transform: booleanAttribute });

  protected readonly tone = computed(() => CONVERSION_TONES[this.status()]);
  protected readonly label = computed(() => CONVERSION_STATUS_LABELS[this.status()]);
}

const PAYOUT_TONES: Record<PayoutStatus, BadgeTone> = {
  pending: 'neutral',
  approved: 'success',
  scheduled: 'info',
  paid: 'success',
  rejected: 'danger',
};

@Component({
  selector: 'rly-payout-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" dot>{{ label() }}</rly-badge>`,
})
export class PayoutStatusBadge {
  readonly status = input.required<PayoutStatus>();

  protected readonly tone = computed(() => PAYOUT_TONES[this.status()]);
  protected readonly label = computed(() => PAYOUT_STATUS_LABELS[this.status()]);
}

const PARTNERSHIP_TONES: Record<PartnershipStatus, BadgeTone> = {
  active: 'success',
  paused: 'warning',
  ended: 'neutral',
};

@Component({
  selector: 'rly-partnership-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" dot>{{ label() }}</rly-badge>`,
})
export class PartnershipStatusBadge {
  readonly status = input.required<PartnershipStatus>();

  protected readonly tone = computed(() => PARTNERSHIP_TONES[this.status()]);
  protected readonly label = computed(() => PARTNERSHIP_STATUS_LABELS[this.status()]);
}

/**
 * Insignia pública de acceso.
 *
 * Traduce la modalidad interna a lo que le importa a quien mira la campaña:
 * si puede unirse ya, si hay revisión o si es por invitación.
 */
const ACCESS_PUBLIC_LABELS: Record<CampaignAccess, string> = {
  open: 'Aceptación inmediata',
  selective: 'Requiere aprobación',
  premium: 'Acceso premium',
};

const ACCESS_TONES: Record<CampaignAccess, BadgeTone> = {
  open: 'success',
  selective: 'neutral',
  premium: 'accent',
};

@Component({
  selector: 'rly-access-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge [tone]="tone()" [outline]="outline()">{{ label() }}</rly-badge>`,
})
export class AccessBadge {
  readonly access = input.required<CampaignAccess>();
  readonly outline = input(false, { transform: booleanAttribute });

  /** Muestra la etiqueta interna (Abierta/Selectiva/Premium) en lugar de la pública. */
  readonly internal = input(false, { transform: booleanAttribute });

  protected readonly tone = computed(() => ACCESS_TONES[this.access()]);
  protected readonly label = computed(() =>
    this.internal() ? ACCESS_LABELS[this.access()] : ACCESS_PUBLIC_LABELS[this.access()],
  );
}

/** Comisión resumida. Es el dato que más se compara entre campañas. */
@Component({
  selector: 'rly-commission-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'inline-flex' },
  template: `<rly-badge tone="accent" [size]="size()">{{ label() }}</rly-badge>`,
})
export class CommissionBadge {
  readonly campaign = input.required<Campaign>();
  readonly size = input<'sm' | 'md'>('sm');

  protected readonly label = computed(() => commissionLabel(this.campaign()));
}

/**
 * Aviso de cierre próximo.
 *
 * Solo aparece cuando faltan 30 días o menos: antes de eso no es información,
 * es ruido.
 */
@Component({
  selector: 'rly-ending-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  host: { class: 'contents' },
  template: `
    @if (remaining() !== null) {
      <rly-badge tone="warning" outline>Termina en {{ remaining() }} días</rly-badge>
    }
  `,
})
export class EndingBadge {
  readonly campaign = input.required<Campaign>();

  protected readonly remaining = computed(() => {
    const { duration } = this.campaign();
    if (duration.type !== 'scheduled' || !duration.endsAt) return null;

    const days = daysUntil(duration.endsAt);
    return days > 0 && days <= 30 ? days : null;
  });
}
