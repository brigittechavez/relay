import { IconName } from '@ds/icon/icon-registry.generated';

import { IsoDate } from './common';

export type NotificationKind =
  | 'application-approved'
  | 'application-rejected'
  | 'application-received'
  | 'invitation'
  | 'conversion'
  | 'conversion-review'
  | 'commission-approved'
  | 'payout'
  | 'campaign-ending'
  | 'campaign-updated'
  | 'goal'
  | 'level';

export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  /** `affiliate` o el id de la organización que la recibe. */
  readonly audience: string;
  readonly title: string;
  readonly body: string;
  readonly link?: string;
  readonly read: boolean;
  readonly createdAt: IsoDate;
}

export const NOTIFICATION_ICONS: Record<NotificationKind, IconName> = {
  'application-approved': 'check-circle',
  'application-rejected': 'x-circle',
  'application-received': 'applications',
  invitation: 'mail',
  conversion: 'trending-up',
  'conversion-review': 'hourglass',
  'commission-approved': 'commissions',
  payout: 'earnings',
  'campaign-ending': 'clock',
  'campaign-updated': 'info',
  goal: 'target',
  level: 'star',
};

/** Entrada del historial de una campaña. */
export interface TimelineEvent {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId?: string;
  readonly label: string;
  readonly detail?: string;
  readonly tone: 'neutral' | 'success' | 'warning' | 'danger';
  readonly occurredAt: IsoDate;
}
