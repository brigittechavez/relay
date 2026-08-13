import { IsoDate, Money } from './common';
import { ChannelId } from './taxonomy';

/**
 * Link de seguimiento.
 *
 * El seguimiento es simulado: `url` se compone en el cliente y las métricas
 * vienen del seed. No existe redirección ni registro de clics reales.
 */
export interface ReferralLink {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly name: string;
  readonly channel: ChannelId;
  readonly slug: string;
  readonly active: boolean;
  readonly clicks: number;
  readonly conversions: number;
  readonly commission: Money;
  readonly createdAt: IsoDate;
}

export interface PromoCode {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly code: string;
  /** Beneficio para la persona que lo usa, tal y como se comunica. */
  readonly benefit: string;
  readonly active: boolean;
  readonly conversions: number;
}

/**
 * Ciclo de validación de una conversión.
 *
 * `registered → validating → approved → scheduled → paid`, con `rejected` y
 * `refunded` como salidas. Ninguna transición es automática: las provoca la
 * organización desde la interfaz.
 */
export type ConversionStatus =
  'registered' | 'validating' | 'approved' | 'scheduled' | 'paid' | 'rejected' | 'refunded';

export const CONVERSION_STATUS_LABELS: Record<ConversionStatus, string> = {
  registered: 'Registrada',
  validating: 'En validación',
  approved: 'Aprobada',
  scheduled: 'Comisión programada',
  paid: 'Pagada',
  rejected: 'Rechazada',
  refunded: 'Reembolsada',
};

export interface Conversion {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly organizationId: string;
  readonly linkId?: string;
  readonly promoCodeId?: string;
  readonly channel: ChannelId;
  readonly value: Money;
  readonly commission: Money;
  readonly status: ConversionStatus;
  readonly note?: string;
  readonly occurredAt: IsoDate;
}

export type PayoutStatus = 'pending' | 'approved' | 'scheduled' | 'paid' | 'rejected';

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  scheduled: 'Programado',
  paid: 'Pagado',
  rejected: 'Rechazado',
};

export interface Payout {
  readonly id: string;
  readonly affiliateId: string;
  readonly amount: Money;
  readonly status: PayoutStatus;
  readonly conversionIds: readonly string[];
  readonly periodLabel: string;
  readonly expectedAt?: IsoDate;
  readonly paidAt?: IsoDate;
}

/** Vínculo activo entre un afiliado y una campaña, tras la aprobación. */
export type PartnershipStatus = 'active' | 'paused' | 'ended';

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  ended: 'Finalizado',
};

export interface Partnership {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly organizationId: string;
  readonly status: PartnershipStatus;
  readonly statusNote?: string;
  readonly joinedAt: IsoDate;
  readonly endedAt?: IsoDate;
}
