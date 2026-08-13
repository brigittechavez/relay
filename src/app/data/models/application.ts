import { IsoDate } from './common';
import { ChannelId } from './taxonomy';

export type ApplicationStatus =
  'draft' | 'submitted' | 'under-review' | 'info-requested' | 'approved' | 'rejected' | 'withdrawn';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  'under-review': 'En revisión',
  'info-requested': 'Información solicitada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

/**
 * Solicitud de un afiliado a una campaña.
 *
 * En campañas abiertas se crea ya aprobada: la modalidad de acceso decide el
 * flujo, pero el registro es el mismo para poder listarlo todo junto.
 */
export interface Application {
  readonly id: string;
  readonly campaignId: string;
  readonly affiliateId: string;
  readonly organizationId: string;
  readonly status: ApplicationStatus;

  /** Respuesta a la pregunta de estrategia, si la campaña la plantea. */
  readonly strategy?: string;
  /** Canales en los que el afiliado planea promocionar. */
  readonly channels: readonly ChannelId[];
  /** Match calculado en el momento de solicitar. */
  readonly matchScore: number;

  /** Motivo breve del rechazo o de la petición de información. */
  readonly decisionNote?: string;
  readonly infoRequest?: string;
  readonly infoResponse?: string;

  readonly submittedAt?: IsoDate;
  readonly decidedAt?: IsoDate;
  readonly createdAt: IsoDate;
}

/** Estados en los que el afiliado puede retirar la solicitud. */
export const WITHDRAWABLE: readonly ApplicationStatus[] = [
  'submitted',
  'under-review',
  'info-requested',
];

/** Estados que la organización todavía tiene que resolver. */
export const PENDING_REVIEW: readonly ApplicationStatus[] = [
  'submitted',
  'under-review',
  'info-requested',
];
