import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Affiliate } from '../models/affiliate';
import { Campaign } from '../models/campaign';
import { Page } from '../models/common';
import { Organization } from '../models/organization';
import { QueryRecord, toParams } from './query';

/**
 * Acceso al catálogo.
 *
 * Los componentes no conocen el origen de los datos: hablan con estos métodos
 * y estos hablan REST. La capa mock responde hoy; un backend respondería
 * mañana sin cambiar ni una vista.
 */
@Injectable({ providedIn: 'root' })
export class CatalogRepository {
  private readonly http = inject(HttpClient);

  listCampaigns(query: QueryRecord = {}): Observable<Page<Campaign>> {
    return this.http.get<Page<Campaign>>('/api/campaigns', { params: toParams(query) });
  }

  campaign(slug: string): Observable<Campaign> {
    return this.http.get<Campaign>(`/api/campaigns/${slug}`);
  }

  createCampaign(draft: Partial<Campaign>): Observable<Campaign> {
    return this.http.post<Campaign>('/api/campaigns', draft);
  }

  updateCampaign(id: string, patch: Partial<Campaign>): Observable<Campaign> {
    return this.http.patch<Campaign>(`/api/campaigns/${id}`, patch);
  }

  listOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>('/api/organizations');
  }

  organization(slug: string): Observable<Organization> {
    return this.http.get<Organization>(`/api/organizations/${slug}`);
  }

  updateOrganization(id: string, patch: Partial<Organization>): Observable<Organization> {
    return this.http.patch<Organization>(`/api/organizations/${id}`, patch);
  }

  listAffiliates(query: QueryRecord = {}): Observable<Affiliate[]> {
    return this.http.get<Affiliate[]>('/api/affiliates', { params: toParams(query) });
  }

  affiliate(slug: string): Observable<Affiliate> {
    return this.http.get<Affiliate>(`/api/affiliates/${slug}`);
  }

  updateAffiliate(id: string, patch: Partial<Affiliate>): Observable<Affiliate> {
    return this.http.patch<Affiliate>(`/api/affiliates/${id}`, patch);
  }
}
