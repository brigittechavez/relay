import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Application, ApplicationStatus } from '../models/application';
import { Notification, TimelineEvent } from '../models/notification';
import { ChannelId } from '../models/taxonomy';
import {
  Conversion,
  ConversionStatus,
  Partnership,
  PartnershipStatus,
  Payout,
  PromoCode,
  ReferralLink,
} from '../models/tracking';
import { DemoSession } from '../store/demo-database';
import { QueryRecord, toParams } from './query';

/** Solicitudes, vínculos y todo lo que ocurre después de una aprobación. */
@Injectable({ providedIn: 'root' })
export class EngagementRepository {
  private readonly http = inject(HttpClient);

  // --- Solicitudes ----------------------------------------------------------

  listApplications(query: QueryRecord = {}): Observable<Application[]> {
    return this.http.get<Application[]>('/api/applications', { params: toParams(query) });
  }

  apply(draft: {
    campaignId: string;
    affiliateId: string;
    strategy?: string;
    channels?: readonly ChannelId[];
  }): Observable<Application> {
    return this.http.post<Application>('/api/applications', draft);
  }

  decideApplication(
    id: string,
    patch: {
      status: ApplicationStatus;
      decisionNote?: string;
      infoRequest?: string;
      infoResponse?: string;
    },
  ): Observable<Application> {
    return this.http.patch<Application>(`/api/applications/${id}`, patch);
  }

  // --- Vínculos activos -----------------------------------------------------

  listPartnerships(query: QueryRecord = {}): Observable<Partnership[]> {
    return this.http.get<Partnership[]>('/api/partnerships', { params: toParams(query) });
  }

  updatePartnership(
    id: string,
    patch: { status: PartnershipStatus; statusNote?: string },
  ): Observable<Partnership> {
    return this.http.patch<Partnership>(`/api/partnerships/${id}`, patch);
  }

  // --- Links y códigos ------------------------------------------------------

  listLinks(query: QueryRecord = {}): Observable<ReferralLink[]> {
    return this.http.get<ReferralLink[]>('/api/referral-links', { params: toParams(query) });
  }

  createLink(draft: {
    campaignId: string;
    affiliateId: string;
    name: string;
    channel: ChannelId;
  }): Observable<ReferralLink> {
    return this.http.post<ReferralLink>('/api/referral-links', draft);
  }

  updateLink(id: string, patch: { name?: string; active?: boolean }): Observable<ReferralLink> {
    return this.http.patch<ReferralLink>(`/api/referral-links/${id}`, patch);
  }

  listPromoCodes(query: QueryRecord = {}): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>('/api/promo-codes', { params: toParams(query) });
  }

  // --- Conversiones y pagos -------------------------------------------------

  listConversions(query: QueryRecord = {}): Observable<Conversion[]> {
    return this.http.get<Conversion[]>('/api/conversions', { params: toParams(query) });
  }

  updateConversion(
    id: string,
    patch: { status: ConversionStatus; note?: string },
  ): Observable<Conversion> {
    return this.http.patch<Conversion>(`/api/conversions/${id}`, patch);
  }

  listPayouts(query: QueryRecord = {}): Observable<Payout[]> {
    return this.http.get<Payout[]>('/api/payouts', { params: toParams(query) });
  }

  // --- Cuenta ---------------------------------------------------------------

  session(): Observable<DemoSession | null> {
    return this.http.get<DemoSession | null>('/api/session');
  }

  startSession(request: {
    as: 'affiliate' | 'organization' | 'new';
    name?: string;
    email?: string;
  }): Observable<DemoSession> {
    return this.http.post<DemoSession>('/api/session', request);
  }

  patchSession(patch: Partial<DemoSession>): Observable<DemoSession> {
    return this.http.patch<DemoSession>('/api/session', patch);
  }

  endSession(): Observable<null> {
    return this.http.delete<null>('/api/session');
  }

  // --- Guardados y comparación ---------------------------------------------

  saved(): Observable<{ campaigns: string[]; affiliates: string[]; compared: string[] }> {
    return this.http.get<{ campaigns: string[]; affiliates: string[]; compared: string[] }>(
      '/api/saved',
    );
  }

  toggleSaved(kind: 'campaign' | 'affiliate', id: string): Observable<{ saved: boolean }> {
    return this.http.post<{ saved: boolean }>('/api/saved', { kind, id });
  }

  toggleCompare(campaignId: string): Observable<{ compared: string[] }> {
    return this.http.post<{ compared: string[] }>('/api/compare', { campaignId });
  }

  // --- Notificaciones y actividad ------------------------------------------

  listNotifications(audience: string): Observable<Notification[]> {
    return this.http.get<Notification[]>('/api/notifications', { params: toParams({ audience }) });
  }

  markNotificationRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`/api/notifications/${id}`, {});
  }

  markAllNotificationsRead(audience: string): Observable<Notification[]> {
    return this.http.post<Notification[]>('/api/notifications/read-all', { audience });
  }

  listTimeline(query: QueryRecord = {}): Observable<TimelineEvent[]> {
    return this.http.get<TimelineEvent[]>('/api/timeline', { params: toParams(query) });
  }

  resetDemo(): Observable<{ resetAt: string }> {
    return this.http.post<{ resetAt: string }>('/api/demo/reset', {});
  }
}
