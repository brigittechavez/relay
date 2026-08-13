import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoMetadata {
  readonly title: string;
  readonly description?: string;
  /** Ruta absoluta desde la raíz, sin dominio. */
  readonly path?: string;
  readonly type?: 'website' | 'article' | 'profile';
  /** Datos estructurados, solo donde aporten a un resultado de búsqueda. */
  readonly structuredData?: Record<string, unknown>;
  /** Imagen de compartición propia de la página, si la hay. */
  readonly image?: { readonly src: string; readonly alt: string };
}

/** Dominio canónico del proyecto publicado. */
const ORIGIN = 'https://relay-marketplace.netlify.app';

/**
 * Imagen de compartición por defecto: la tarjeta de marca generada con
 * `npm run og`. Las páginas que tengan una imagen propia la sustituyen.
 */
const DEFAULT_IMAGE = {
  src: '/og-cover.png',
  alt: 'RELAY · marketplace de marketing de afiliados',
};

const DEFAULT_DESCRIPTION =
  'RELAY conecta empresas y profesionales con afiliados que ya tienen la audiencia adecuada. ' +
  'Comisiones explícitas, requisitos claros y resultados medibles.';

/**
 * Metadatos de página.
 *
 * Se aplican durante el render en servidor, así que viajan en el HTML inicial y
 * los ve cualquier rastreador sin ejecutar JavaScript. Las páginas dinámicas
 * —campañas y perfiles— los componen con sus propios datos.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(metadata: SeoMetadata): void {
    const description = metadata.description ?? DEFAULT_DESCRIPTION;
    const url = `${ORIGIN}${metadata.path ?? ''}`;
    const image = metadata.image ?? DEFAULT_IMAGE;
    const imageUrl = image.src.startsWith('http') ? image.src : `${ORIGIN}${image.src}`;

    this.title.setTitle(metadata.title);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: metadata.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: 'RELAY' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_PE' });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:alt', content: image.alt });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:title', content: metadata.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    this.setCanonical(url);
    this.setStructuredData(metadata.structuredData ?? null);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  /**
   * Un único bloque de datos estructurados por página, reemplazado en cada
   * navegación: acumularlos produciría descripciones contradictorias.
   */
  private setStructuredData(data: Record<string, unknown> | null): void {
    const head = this.document.head;
    const existing = head.querySelector('script[data-rly-structured-data]');
    existing?.remove();

    if (!data) return;

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-rly-structured-data', '');
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }
}
