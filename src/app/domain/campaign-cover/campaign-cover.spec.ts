import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CampaignCover } from './campaign-cover';
import { CampaignImage } from '@data/models/campaign';

/**
 * La portada tiene que sostener dos estados durante toda la vida del proyecto:
 * con imagen definitiva y sin ella. Lo que se prueba es justo la frontera entre
 * ambos, porque es donde se rompería el layout o la accesibilidad.
 */
function render(inputs: {
  cover: string;
  image?: CampaignImage;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}) {
  const fixture = TestBed.createComponent(CampaignCover);

  fixture.componentRef.setInput('cover', inputs.cover);
  fixture.componentRef.setInput('categoryId', 'servicios');
  if (inputs.image) fixture.componentRef.setInput('image', inputs.image);
  if (inputs.size) fixture.componentRef.setInput('size', inputs.size);
  if (inputs.priority) fixture.componentRef.setInput('priority', true);

  fixture.detectChanges();

  return fixture;
}

const IMAGE: CampaignImage = {
  src: '/campanas/landing-pro.webp',
  alt: 'Pantalla de una landing terminada junto a su panel de conversiones',
};

describe('CampaignCover', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [CampaignCover] }));

  it('dibuja el placeholder geométrico cuando no hay imagen', () => {
    const element = render({ cover: 'landing-pro' }).nativeElement as HTMLElement;

    expect(element.querySelector('svg')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();
  });

  it('el patrón del placeholder es estable para la misma campaña', () => {
    const first = render({ cover: 'landing-pro' }).nativeElement as HTMLElement;
    const second = render({ cover: 'landing-pro' }).nativeElement as HTMLElement;

    expect(first.querySelector('svg')!.innerHTML).toBe(second.querySelector('svg')!.innerHTML);
  });

  it('muestra la imagen con su texto alternativo cuando existe', () => {
    const element = render({ cover: 'landing-pro', image: IMAGE }).nativeElement as HTMLElement;
    const image = element.querySelector('img')!;

    expect(element.querySelector('svg')).toBeNull();
    expect(image.getAttribute('src')).toBe(IMAGE.src);
    expect(image.getAttribute('alt')).toBe(IMAGE.alt);
  });

  it('difiere la carga salvo en la portada principal de la vista', () => {
    const lazy = render({ cover: 'landing-pro', image: IMAGE }).nativeElement as HTMLElement;
    expect(lazy.querySelector('img')!.getAttribute('loading')).toBe('lazy');

    const eager = render({
      cover: 'landing-pro',
      image: IMAGE,
      priority: true,
    }).nativeElement as HTMLElement;

    expect(eager.querySelector('img')!.getAttribute('loading')).toBeNull();
    expect(eager.querySelector('img')!.getAttribute('fetchpriority')).toBe('high');
  });

  it('reserva la misma proporción con imagen y sin ella', () => {
    const placeholder = render({ cover: 'landing-pro', size: 'lg' }).nativeElement as HTMLElement;
    const picture = render({ cover: 'landing-pro', size: 'lg', image: IMAGE })
      .nativeElement as HTMLElement;

    expect(placeholder.className).toBe(picture.className);
    expect(placeholder.className).toContain('aspect-[21/9]');
  });
});
