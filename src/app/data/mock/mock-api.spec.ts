import { HttpClient, HttpParams, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { Application } from '../models/application';
import { Campaign } from '../models/campaign';
import { Page } from '../models/common';
import { Partnership, ReferralLink } from '../models/tracking';
import { DemoStore } from '../store/demo-store';
import { mockApiInterceptor } from './mock-api';

/**
 * Pruebas de la capa REST simulada.
 *
 * Se ejercita a través de `HttpClient`, no llamando a los manejadores: lo que
 * importa es que el contrato que ven los componentes —rutas, filtros, códigos
 * de error— se comporte como un backend.
 */
describe('mock API', () => {
  let http: HttpClient;
  let store: DemoStore;

  beforeEach(() => {
    localStorage.clear();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });

    http = TestBed.inject(HttpClient);
    store = TestBed.inject(DemoStore);
    store.reset();
  });

  const get = <T>(url: string) => firstValueFrom(http.get<T>(url));
  const post = <T>(url: string, body: unknown) => firstValueFrom(http.post<T>(url, body));
  const patch = <T>(url: string, body: unknown) => firstValueFrom(http.patch<T>(url, body));

  describe('GET /api/campaigns', () => {
    it('devuelve solo campañas publicadas y pagina', async () => {
      const page = await get<Page<Campaign>>('/api/campaigns?pageSize=4');

      expect(page.items).toHaveLength(4);
      expect(page.total).toBeGreaterThan(4);
      expect(page.items.every((campaign) => campaign.status !== 'draft')).toBe(true);
    });

    it('busca por nombre de campaña y de organización', async () => {
      const byCampaign = await get<Page<Campaign>>('/api/campaigns?q=landing');
      expect(byCampaign.items[0].id).toBe('landing-pro');

      const byOrganization = await get<Page<Campaign>>('/api/campaigns?q=norte digital');
      expect(byOrganization.items.some((campaign) => campaign.id === 'landing-pro')).toBe(true);
    });

    it('filtra por modalidad de acceso', async () => {
      const page = await get<Page<Campaign>>('/api/campaigns?access=premium');

      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe('revenue-systems');
    });

    it('ordena por match cuando hay un afiliado en contexto', async () => {
      const page = await get<Page<Campaign>>('/api/campaigns?sort=match&affiliateId=lucia-vega');

      expect(page.items[0].id).toBe('landing-pro');
    });

    it('excluye las campañas para las que el perfil no califica', async () => {
      const page = await get<Page<Campaign>>('/api/campaigns?eligible=true&affiliateId=lucia-vega');

      expect(page.items.some((campaign) => campaign.id === 'revenue-systems')).toBe(false);
    });

    it('responde 404 ante una campaña inexistente', async () => {
      await expect(get('/api/campaigns/no-existe')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('POST /api/applications', () => {
    it('deja la solicitud pendiente en una campaña selectiva', async () => {
      const application = await post<Application>('/api/applications', {
        campaignId: 'landing-pro',
        affiliateId: 'lucia-vega',
        strategy: 'Newsletter primero.',
        channels: ['newsletter'],
      });

      expect(application.status).toBe('submitted');
      expect(application.matchScore).toBe(93);

      const partnerships = await get<Partnership[]>(
        '/api/partnerships?affiliateId=lucia-vega&campaignId=landing-pro',
      );
      expect(partnerships).toHaveLength(0);
    });

    it('aprueba en el acto una campaña abierta y crea el vínculo', async () => {
      const application = await post<Application>('/api/applications', {
        campaignId: 'plan-doce-semanas',
        affiliateId: 'lucia-vega',
        channels: ['instagram'],
      });

      expect(application.status).toBe('approved');

      const partnerships = await get<Partnership[]>(
        '/api/partnerships?affiliateId=lucia-vega&campaignId=plan-doce-semanas',
      );
      expect(partnerships[0].status).toBe('active');
    });

    it('rechaza la solicitud si falta un requisito obligatorio', async () => {
      await expect(
        post('/api/applications', { campaignId: 'revenue-systems', affiliateId: 'lucia-vega' }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('impide solicitar dos veces la misma campaña', async () => {
      await post('/api/applications', { campaignId: 'landing-pro', affiliateId: 'lucia-vega' });

      await expect(
        post('/api/applications', { campaignId: 'landing-pro', affiliateId: 'lucia-vega' }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('flujo de aprobación', () => {
    it('aprobar crea el vínculo y el código promocional', async () => {
      const application = await post<Application>('/api/applications', {
        campaignId: 'landing-pro',
        affiliateId: 'lucia-vega',
      });

      await patch(`/api/applications/${application.id}`, { status: 'approved' });

      const partnerships = await get<Partnership[]>(
        '/api/partnerships?affiliateId=lucia-vega&campaignId=landing-pro',
      );
      expect(partnerships[0].status).toBe('active');

      const codes = await get<{ code: string }[]>(
        '/api/promo-codes?affiliateId=lucia-vega&campaignId=landing-pro',
      );
      expect(codes[0].code).toBe('LUCIA300');
    });

    it('no permite retirar una solicitud ya resuelta', async () => {
      const application = await post<Application>('/api/applications', {
        campaignId: 'landing-pro',
        affiliateId: 'lucia-vega',
      });
      await patch(`/api/applications/${application.id}`, { status: 'approved' });

      await expect(
        patch(`/api/applications/${application.id}`, { status: 'withdrawn' }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('POST /api/referral-links', () => {
    it('exige estar activo en la campaña', async () => {
      await expect(
        post('/api/referral-links', {
          campaignId: 'landing-pro',
          affiliateId: 'lucia-vega',
          name: 'Reel lanzamiento',
          channel: 'instagram',
        }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('genera el link con actividad simulada respaldada por conversiones', async () => {
      const application = await post<Application>('/api/applications', {
        campaignId: 'landing-pro',
        affiliateId: 'lucia-vega',
      });
      await patch(`/api/applications/${application.id}`, { status: 'approved' });

      const link = await post<ReferralLink>('/api/referral-links', {
        campaignId: 'landing-pro',
        affiliateId: 'lucia-vega',
        name: 'Reel lanzamiento',
        channel: 'instagram',
      });

      expect(link.slug).toBe('reel-lanzamiento');
      expect(link.clicks).toBe(540);
      expect(link.conversions).toBe(9);
      expect(link.commission).toBe(2700);

      const conversions = await get<{ linkId?: string }[]>(
        '/api/conversions?campaignId=landing-pro&affiliateId=lucia-vega',
      );
      expect(conversions.filter((item) => item.linkId === link.id)).toHaveLength(9);
    });
  });

  describe('PATCH /api/conversions/:id', () => {
    it('respeta el ciclo de validación', async () => {
      const conversions = await get<{ id: string; status: string }[]>(
        '/api/conversions?organizationId=norte-digital&status=validating',
      );
      const target = conversions[0];

      await expect(
        patch(`/api/conversions/${target.id}`, { status: 'paid' }),
      ).rejects.toMatchObject({ status: 409 });

      const approved = await patch<{ status: string }>(`/api/conversions/${target.id}`, {
        status: 'approved',
      });
      expect(approved.status).toBe('approved');
    });

    it('anula la comisión al reembolsar', async () => {
      const conversions = await get<{ id: string; commission: number }[]>(
        '/api/conversions?organizationId=norte-digital&status=approved',
      );

      const refunded = await patch<{ commission: number }>(
        `/api/conversions/${conversions[0].id}`,
        { status: 'refunded' },
      );

      expect(refunded.commission).toBe(0);
    });
  });

  describe('guardados y comparación', () => {
    it('alterna el estado de guardado', async () => {
      const first = await post<{ saved: boolean }>('/api/saved', {
        kind: 'campaign',
        id: 'landing-pro',
      });
      expect(first.saved).toBe(true);

      const second = await post<{ saved: boolean }>('/api/saved', {
        kind: 'campaign',
        id: 'landing-pro',
      });
      expect(second.saved).toBe(false);
    });

    it('limita la comparación a tres campañas', async () => {
      for (const id of ['landing-pro', 'workspace-plus', 'brand-sprint']) {
        await post('/api/compare', { campaignId: id });
      }

      await expect(post('/api/compare', { campaignId: 'growth-bootcamp' })).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('reinicio de la demo', () => {
    it('devuelve los datos al estado inicial', async () => {
      await post('/api/applications', { campaignId: 'landing-pro', affiliateId: 'lucia-vega' });
      const before = await get<Application[]>('/api/applications?affiliateId=lucia-vega');

      await post('/api/demo/reset', {});

      const after = await get<Application[]>('/api/applications?affiliateId=lucia-vega');
      expect(after.length).toBe(before.length - 1);
    });
  });

  /**
   * Regresión: HttpClient guarda los parámetros de consulta fuera de la URL y
   * solo los serializa al enviar. Si el transporte simulado lee `url` en lugar
   * de `urlWithParams`, todos los filtros se pierden en silencio y las
   * consultas devuelven registros de más.
   */
  describe('parámetros construidos con HttpParams', () => {
    it('aplica los filtros enviados como HttpParams, no solo los de la URL', async () => {
      const params = new HttpParams()
        .set('affiliateId', 'lucia-vega')
        .set('campaignId', 'revenue-systems');

      const filtered = await firstValueFrom(
        http.get<Application[]>('/api/applications', { params }),
      );

      // Lucía no ha solicitado esta campaña: la única solicitud es de otra persona.
      expect(filtered).toHaveLength(0);
    });

    it('respeta el filtro de acceso enviado como HttpParams', async () => {
      const page = await firstValueFrom(
        http.get<Page<Campaign>>('/api/campaigns', {
          params: new HttpParams().set('access', 'premium'),
        }),
      );

      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe('revenue-systems');
    });
  });

  it('responde 404 en un endpoint no implementado', async () => {
    await expect(get('/api/no-existe')).rejects.toMatchObject({ status: 404 });
  });
});
