import { Campaign } from '../models/campaign';

/**
 * Campañas de la demo.
 *
 * `audienceTarget` es la audiencia que cada campaña considera relevante y es la
 * pieza que más mueve el match: junto con los nichos y los canales permitidos,
 * produce el abanico de compatibilidad de Lucía Vega que recorre la demo, desde
 * Landing Pro (la más afín) hasta Revenue Systems (la más exigente).
 *
 * Las portadas son identificadores de placeholder; las imágenes definitivas se
 * incorporan cuando la interfaz está cerrada.
 */
export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: 'landing-pro',
    slug: 'landing-pro',
    name: 'Landing Pro',
    organizationId: 'norte-digital',

    categoryId: 'servicios',
    subcategoryId: 'desarrollo-web',
    tags: ['alta-comision', 'peru', 'top-performing', 'selectiva'],

    summary: 'Landing page profesional para negocios y especialistas, entregada en tres semanas.',
    description:
      'Landing Pro es el servicio de entrada de Norte Digital: una página de destino diseñada ' +
      'para convertir visitas en solicitudes de contacto, con copy, diseño, desarrollo y ' +
      'analítica configurada. Está pensada para consultores, clínicas, academias y estudios ' +
      'profesionales que ya tienen clientes pero no una página que sostenga su tarifa.\n\n' +
      'La conversión que paga comisión es el cliente cerrado, no la solicitud de presupuesto: ' +
      'Norte Digital confirma la venta y la comisión entra en validación el mismo día.',
    offer: 'Landing page profesional con copy, diseño, desarrollo y analítica',
    price: 2500,
    priceUnit: 'one-time',

    commission: {
      model: 'fixed',
      amount: 300,
      bonus: { threshold: 5, amount: 500 },
      conversionEvent: 'contract',
      attributionWindow: '30d',
    },
    access: 'selective',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'lp-profile',
        kind: 'profile',
        label: 'Perfil completo al 80%',
        mandatory: true,
        profileCompleteness: 80,
      },
      {
        id: 'lp-level',
        kind: 'level',
        label: 'Nivel Rising o superior',
        mandatory: true,
        level: 'rising',
      },
      {
        id: 'lp-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
      {
        id: 'lp-score',
        kind: 'score',
        label: 'Relay Score de 70 o más',
        mandatory: false,
        score: 70,
      },
      {
        id: 'lp-niche',
        kind: 'niche',
        label: 'Nicho de marketing, negocios o diseño',
        mandatory: false,
        niches: ['marketing', 'negocios', 'diseno'],
      },
      {
        id: 'lp-channel',
        kind: 'channel',
        label: 'Instagram, YouTube o newsletter activos',
        mandatory: false,
        channels: ['instagram', 'youtube', 'newsletter'],
      },
    ],
    channels: ['instagram', 'youtube', 'newsletter'],
    niches: ['marketing', 'negocios', 'diseno'],
    countries: ['PE'],
    audience: 'Profesionales y negocios de servicios que venden por encima de S/ 1,500',
    audienceTarget: 30000,
    restrictions: [
      'No se admite tráfico pagado sobre la marca Norte Digital',
      'No se permite prometer plazos distintos a los tres semanas de entrega',
    ],
    benefits: [
      'Comisión por cliente cerrado, no por solicitud',
      'Bono de S/ 500 al llegar a cinco conversiones aprobadas',
      'Materiales listos y casos reales para citar',
    ],

    landingUrl: 'https://nortedigital.pe/landing-pro',
    resources: [
      {
        id: 'lp-r1',
        kind: 'image',
        title: 'Kit de imágenes',
        description: 'Cuatro piezas para historias y feed, con y sin texto.',
        format: 'ZIP · 4 archivos',
      },
      {
        id: 'lp-r2',
        kind: 'copy',
        title: 'Texto para newsletter',
        description: 'Versión larga, pensada para un envío monográfico.',
        body:
          'Si tu web sigue siendo la que montaste hace tres años, probablemente estés perdiendo ' +
          'clientes antes de la primera llamada. Norte Digital arma una landing en tres semanas ' +
          'con copy, diseño y analítica configurada. Te dejo el enlace por si quieres verla.',
      },
      {
        id: 'lp-r3',
        kind: 'copy',
        title: 'Texto para redes',
        description: 'Versión corta para publicación o historia.',
        body:
          'Una landing que explica bien lo que haces vale más que diez publicaciones. Norte ' +
          'Digital la entrega en tres semanas, con analítica lista.',
      },
      {
        id: 'lp-r4',
        kind: 'guide',
        title: 'Guía de promoción',
        description: 'Qué contar, qué no prometer y en qué orden publicar.',
        format: 'PDF · 6 páginas',
      },
    ],
    promoCodeEnabled: true,
    strategyQuestion:
      '¿Cómo presentarías este servicio a tu audiencia y en qué canal lo promocionarías primero?',

    goal: { label: '5 conversiones aprobadas este mes', target: 5, unit: 'conversions' },
    metrics: { activeAffiliates: 9, conversionRate: 1.62, conversions: 34, clicks: 2100 },

    cover: 'servicios-01',
    createdAt: '2026-02-03',
    publishedAt: '2026-02-10',
  },

  {
    id: 'workspace-plus',
    slug: 'workspace-plus',
    name: 'Workspace Plus',
    organizationId: 'fluxa',

    categoryId: 'tecnologia',
    subcategoryId: 'saas',
    tags: ['recurrente', 'aceptacion-inmediata', 'trending', 'peru'],

    summary: 'Suscripción mensual del espacio de trabajo de Fluxa para equipos pequeños.',
    description:
      'Workspace Plus es el plan de Fluxa para equipos de entre tres y quince personas: ' +
      'tableros, documentos y seguimiento de trabajo en un solo lugar, con una curva de ' +
      'aprendizaje corta.\n\nLa campaña es de adhesión inmediata: al unirte se generan tu link ' +
      'y tu código, sin revisión previa. La comisión es recurrente durante los tres primeros ' +
      'meses de cada suscripción activa.',
    offer: 'Suscripción mensual para equipos de 3 a 15 personas',
    price: 69,
    priceUnit: 'month',

    commission: {
      model: 'recurring',
      percentage: 20,
      recurringMonths: 3,
      conversionEvent: 'subscription',
      attributionWindow: '15d',
    },
    access: 'open',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'wp-profile',
        kind: 'profile',
        label: 'Perfil completo al 50%',
        mandatory: true,
        profileCompleteness: 50,
      },
      {
        id: 'wp-niche',
        kind: 'niche',
        label: 'Nicho de productividad o herramientas',
        mandatory: false,
        niches: ['productividad', 'herramientas', 'tecnologia'],
      },
    ],
    channels: ['instagram', 'youtube', 'tiktok', 'newsletter', 'blog'],
    niches: ['productividad', 'herramientas'],
    countries: ['PE', 'CL', 'CO', 'MX'],
    audience: 'Equipos pequeños y personas que coordinan trabajo de varias personas',
    audienceTarget: 43000,
    restrictions: ['No se permite pujar por la marca Fluxa en buscadores'],
    benefits: [
      'Adhesión inmediata, sin revisión',
      'Comisión recurrente durante tres meses',
      'Prueba gratuita de 30 días para tu audiencia',
    ],

    landingUrl: 'https://fluxa.app/workspace-plus',
    resources: [
      {
        id: 'wp-r1',
        kind: 'image',
        title: 'Capturas del producto',
        description: 'Seis capturas en claro y oscuro.',
        format: 'ZIP · 6 archivos',
      },
      {
        id: 'wp-r2',
        kind: 'copy',
        title: 'Texto para redes',
        description: 'Enfocado en el problema, no en la lista de funciones.',
        body:
          'Llevo un mes coordinando todo desde Fluxa y he dejado de perseguir mensajes. Si tu ' +
          'equipo es pequeño y trabaja en cinco sitios distintos, mira Workspace Plus.',
      },
    ],
    promoCodeEnabled: true,

    goal: { label: '10 suscripciones activas este mes', target: 10, unit: 'conversions' },
    metrics: { activeAffiliates: 48, conversionRate: 2.35, conversions: 186, clicks: 7900 },

    cover: 'tecnologia-01',
    createdAt: '2025-07-01',
    publishedAt: '2025-07-08',
  },

  {
    id: 'growth-bootcamp',
    slug: 'growth-bootcamp',
    name: 'Growth Bootcamp',
    organizationId: 'impulso-academy',

    categoryId: 'educacion',
    subcategoryId: 'cursos',
    tags: ['alta-comision', 'peru', 'selectiva'],

    summary: 'Programa intensivo de adquisición y analítica, en cohortes de veinte personas.',
    description:
      'Ocho semanas con sesiones en directo dos veces por semana, un proyecto aplicado al ' +
      'negocio de cada participante y revisión individual al cierre. Las cohortes son de ' +
      'veinte personas y se abren cada dos meses.\n\nLa comisión se paga por inscripción ' +
      'pagada, con una ventana de atribución de 30 días.',
    offer: 'Programa de 8 semanas en cohorte con proyecto aplicado',
    price: 1290,
    priceUnit: 'one-time',

    commission: {
      model: 'fixed',
      amount: 180,
      conversionEvent: 'enrollment',
      attributionWindow: '30d',
    },
    access: 'selective',
    status: 'active',
    duration: { type: 'scheduled', startsAt: '2026-07-01', endsAt: '2026-09-30' },

    requirements: [
      {
        id: 'gb-level',
        kind: 'level',
        label: 'Nivel Rising o superior',
        mandatory: true,
        level: 'rising',
      },
      {
        id: 'gb-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
      {
        id: 'gb-score',
        kind: 'score',
        label: 'Relay Score de 65 o más',
        mandatory: false,
        score: 65,
      },
      {
        id: 'gb-niche',
        kind: 'niche',
        label: 'Nicho de marketing o negocios',
        mandatory: false,
        niches: ['marketing', 'negocios'],
      },
    ],
    channels: ['instagram', 'youtube', 'newsletter'],
    niches: ['marketing', 'negocios'],
    countries: ['PE'],
    audience: 'Personas con un negocio en marcha que quieren ordenar su adquisición',
    audienceTarget: 70000,
    restrictions: ['No se permite anunciar descuentos que la academia no haya publicado'],
    benefits: [
      'Comisión alta sobre un precio de ticket medio',
      'Cohortes limitadas: la escasez es real y se puede comunicar',
      'Sesión de preguntas abierta para tu audiencia antes de cada cohorte',
    ],

    landingUrl: 'https://impulsoacademy.pe/growth-bootcamp',
    resources: [
      {
        id: 'gb-r1',
        kind: 'image',
        title: 'Piezas de la cohorte',
        description: 'Con fecha de inicio y plazas restantes.',
        format: 'ZIP · 3 archivos',
      },
      {
        id: 'gb-r2',
        kind: 'guide',
        title: 'Programa detallado',
        description: 'Contenido semana a semana, para responder dudas.',
        format: 'PDF · 4 páginas',
      },
    ],
    promoCodeEnabled: true,
    strategyQuestion: '¿Qué parte del programa crees que le interesa más a tu audiencia y por qué?',

    goal: { label: '8 inscripciones esta cohorte', target: 8, unit: 'conversions' },
    metrics: { activeAffiliates: 21, conversionRate: 1.28, conversions: 62, clicks: 4800 },

    cover: 'educacion-01',
    createdAt: '2026-04-18',
    publishedAt: '2026-04-25',
  },

  {
    id: 'brand-sprint',
    slug: 'brand-sprint',
    name: 'Brand Sprint',
    organizationId: 'marea-creative',

    categoryId: 'marketing',
    subcategoryId: 'branding',
    tags: ['peru', 'selectiva', 'nuevo'],

    summary: 'Identidad visual completa en dos semanas, con manual de uso incluido.',
    description:
      'Marea Creative trabaja por sprints cerrados: dos semanas, un entregable y un manual de ' +
      'uso. Brand Sprint incluye logotipo, paleta, tipografía, aplicaciones básicas y las ' +
      'plantillas de redes.\n\nLa comisión es un porcentaje del proyecto y se paga cuando el ' +
      'cliente firma la contratación.',
    offer: 'Identidad visual completa entregada en dos semanas',
    price: 1800,
    priceUnit: 'one-time',

    commission: {
      model: 'percentage',
      percentage: 12,
      conversionEvent: 'contract',
      attributionWindow: '30d',
    },
    access: 'selective',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'bs-profile',
        kind: 'profile',
        label: 'Perfil completo al 70%',
        mandatory: true,
        profileCompleteness: 70,
      },
      {
        id: 'bs-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
      {
        id: 'bs-niche',
        kind: 'niche',
        label: 'Nicho de diseño o marketing',
        mandatory: false,
        niches: ['diseno', 'marketing'],
      },
    ],
    channels: ['instagram', 'youtube', 'tiktok', 'blog'],
    niches: ['diseno', 'marketing'],
    countries: ['PE'],
    audience: 'Negocios que van a relanzar o que nunca tuvieron identidad definida',
    audienceTarget: 45000,
    restrictions: ['No se permite mostrar trabajos del estudio sin citar al cliente original'],
    benefits: [
      'Porcentaje sobre proyecto, no importe fijo',
      'Entregable rápido: el caso se puede contar en un mes',
    ],

    landingUrl: 'https://mareacreative.pe/brand-sprint',
    resources: [
      {
        id: 'bs-r1',
        kind: 'image',
        title: 'Antes y después',
        description: 'Tres casos con permiso de publicación.',
        format: 'ZIP · 3 archivos',
      },
    ],
    promoCodeEnabled: false,
    strategyQuestion: '¿Con qué tipo de cliente de tu audiencia encaja mejor este sprint?',

    goal: { label: '3 contrataciones este trimestre', target: 3, unit: 'conversions' },
    metrics: { activeAffiliates: 7, conversionRate: 1.1, conversions: 14, clicks: 1270 },

    cover: 'marketing-01',
    createdAt: '2026-06-09',
    publishedAt: '2026-06-16',
  },

  {
    id: 'revenue-systems',
    slug: 'revenue-systems',
    name: 'Revenue Systems',
    organizationId: 'orbita-advisory',

    categoryId: 'servicios',
    subcategoryId: 'consultoria',
    tags: ['alta-comision', 'premium', 'peru'],

    summary: 'Consultoría de sistema comercial completo para empresas B2B que ya facturan.',
    description:
      'Órbita Advisory diseña e implanta el proceso comercial de punta a punta: segmentación, ' +
      'oferta, canal y medición. El compromiso es de tres meses y el cliente sale con el ' +
      'sistema funcionando y su equipo formado.\n\nEs una campaña Premium: no por el importe ' +
      'de la comisión, sino porque la organización revisa cada solicitud a fondo y espera una ' +
      'propuesta concreta de cómo se va a presentar el servicio.',
    offer: 'Consultoría de tres meses con implantación y formación del equipo',
    price: 4500,
    priceUnit: 'one-time',

    commission: {
      model: 'fixed',
      amount: 600,
      conversionEvent: 'contract',
      attributionWindow: '60d',
    },
    access: 'premium',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'rs-level',
        kind: 'level',
        label: 'Nivel Pro o superior',
        mandatory: true,
        level: 'pro',
      },
      {
        id: 'rs-score',
        kind: 'score',
        label: 'Relay Score de 82 o más',
        mandatory: true,
        score: 82,
      },
      {
        id: 'rs-profile',
        kind: 'profile',
        label: 'Perfil completo al 90%',
        mandatory: true,
        profileCompleteness: 90,
      },
      {
        id: 'rs-experience',
        kind: 'experience',
        label: 'Experiencia previa con audiencia B2B',
        mandatory: true,
        categories: ['servicios', 'finanzas'],
      },
      {
        id: 'rs-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: false,
        countries: ['PE'],
      },
    ],
    channels: ['linkedin', 'newsletter', 'youtube'],
    niches: ['negocios'],
    countries: ['PE'],
    audience: 'Empresas B2B con equipo comercial y facturación estable',
    audienceTarget: 70000,
    restrictions: [
      'No se permite comunicar cifras de resultados de clientes de Órbita',
      'No se admite promoción en canales de contenido general',
    ],
    benefits: [
      'La comisión más alta del marketplace por conversión',
      'Ventana de atribución de 60 días, acorde al ciclo de venta',
      'Acompañamiento directo del equipo de Órbita en las primeras conversaciones',
    ],

    landingUrl: 'https://orbitaadvisory.com/revenue-systems',
    resources: [
      {
        id: 'rs-r1',
        kind: 'guide',
        title: 'Documento de posicionamiento',
        description: 'Cómo explicar el servicio sin prometer resultados.',
        format: 'PDF · 8 páginas',
      },
    ],
    promoCodeEnabled: false,
    strategyQuestion:
      'Describe en pocas líneas cómo llegarías a responsables de empresas B2B desde tus canales.',

    goal: { label: '2 clientes cerrados este trimestre', target: 2, unit: 'conversions' },
    metrics: { activeAffiliates: 4, conversionRate: 2.9, conversions: 11, clicks: 380 },

    cover: 'servicios-02',
    createdAt: '2025-10-14',
    publishedAt: '2025-10-21',
  },

  {
    id: 'membresia-profesional',
    slug: 'membresia-profesional',
    name: 'Membresía Profesional',
    organizationId: 'circulo-pro',

    categoryId: 'membresias',
    subcategoryId: 'comunidad',
    tags: ['recurrente', 'aceptacion-inmediata', 'peru'],

    summary: 'Membresía mensual con sesiones en directo, plantillas y bolsa de encargos.',
    description:
      'Círculo Pro reúne a profesionales que facturan por su cuenta: diseñadores, consultores, ' +
      'desarrolladores y redactores. Cada mes hay dos sesiones en directo, plantillas nuevas de ' +
      'propuestas y contratos, y un canal donde circulan encargos entre miembros.\n\nLa ' +
      'comisión es recurrente durante los tres primeros meses de cada membresía activa.',
    offer: 'Membresía mensual con sesiones, plantillas y bolsa de encargos',
    price: 89,
    priceUnit: 'month',

    commission: {
      model: 'recurring',
      percentage: 25,
      recurringMonths: 3,
      conversionEvent: 'subscription',
      attributionWindow: '7d',
    },
    access: 'open',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'mp-profile',
        kind: 'profile',
        label: 'Perfil completo al 50%',
        mandatory: true,
        profileCompleteness: 50,
      },
    ],
    channels: ['instagram', 'newsletter', 'comunidad', 'youtube'],
    niches: ['negocios', 'productividad'],
    countries: ['PE', 'CL', 'CO'],
    audience: 'Profesionales independientes que facturan de forma constante',
    audienceTarget: 60000,
    restrictions: ['No se permite compartir el contenido interno de la comunidad'],
    benefits: [
      'Adhesión inmediata',
      'Comisión recurrente del 25% durante tres meses',
      'Primer mes con descuento para tu audiencia',
    ],

    landingUrl: 'https://circulopro.pe/membresia',
    resources: [
      {
        id: 'mp-r1',
        kind: 'copy',
        title: 'Texto para comunidad',
        description: 'Versión conversacional, sin tono publicitario.',
        body:
          'Llevo cuatro meses en Círculo Pro y lo que más uso son las plantillas de propuesta. ' +
          'Si trabajas por tu cuenta y te cuesta cotizar, échale un ojo.',
      },
    ],
    promoCodeEnabled: true,

    goal: { label: '15 membresías activas este mes', target: 15, unit: 'conversions' },
    metrics: { activeAffiliates: 33, conversionRate: 3.1, conversions: 240, clicks: 7740 },

    cover: 'membresias-01',
    createdAt: '2025-08-02',
    publishedAt: '2025-08-11',
  },

  {
    id: 'estrategia-de-marca',
    slug: 'estrategia-de-marca',
    name: 'Estrategia de Marca para Expertos',
    organizationId: 'punto-norte',

    categoryId: 'servicios',
    subcategoryId: 'consultoria',
    tags: ['peru', 'selectiva', 'nuevo'],

    summary: 'Consultoría de cuatro semanas para dejar de competir por precio.',
    description:
      'Un proceso de cuatro semanas para profesionales que ya tienen clientes pero compiten en ' +
      'precio: se revisa el posicionamiento, se reconstruye la oferta y se define el mensaje. ' +
      'Al final hay un documento de marca y tres piezas de comunicación listas.\n\nLa comisión ' +
      'se paga cuando el cliente contrata.',
    offer: 'Consultoría individual de posicionamiento, oferta y mensaje',
    price: 2100,
    priceUnit: 'one-time',

    commission: {
      model: 'fixed',
      amount: 250,
      conversionEvent: 'contract',
      attributionWindow: '30d',
    },
    access: 'selective',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'em-profile',
        kind: 'profile',
        label: 'Perfil completo al 70%',
        mandatory: true,
        profileCompleteness: 70,
      },
      {
        id: 'em-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
      {
        id: 'em-niche',
        kind: 'niche',
        label: 'Nicho de marketing o negocios',
        mandatory: false,
        niches: ['marketing', 'negocios'],
      },
    ],
    channels: ['instagram', 'youtube', 'newsletter', 'linkedin'],
    niches: ['marketing', 'negocios'],
    countries: ['PE'],
    audience: 'Profesionales con clientes que quieren subir tarifa sin perder demanda',
    audienceTarget: 41000,
    restrictions: ['No se permite garantizar aumentos de tarifa concretos'],
    benefits: [
      'Proceso corto y con entregable claro',
      'Comisión fija de S/ 250 por cliente cerrado',
    ],

    landingUrl: 'https://puntonorte.pe/estrategia',
    resources: [
      {
        id: 'em-r1',
        kind: 'copy',
        title: 'Texto para newsletter',
        description: 'Con la pregunta de apertura que mejor funciona.',
        body:
          '¿Cuántas veces te han pedido rebajar el precio este mes? Punto Norte trabaja cuatro ' +
          'semanas contigo para que esa conversación deje de aparecer.',
      },
    ],
    promoCodeEnabled: true,
    strategyQuestion: '¿Qué objeción de tu audiencia crees que resuelve mejor este servicio?',

    goal: { label: '4 clientes cerrados este trimestre', target: 4, unit: 'conversions' },
    metrics: { activeAffiliates: 6, conversionRate: 1.34, conversions: 9, clicks: 670 },

    cover: 'servicios-03',
    createdAt: '2026-03-05',
    publishedAt: '2026-03-12',
  },

  // --- Campañas secundarias: pueblan filtros y categorías ---------------------

  {
    id: 'cierre-mensual',
    slug: 'cierre-mensual',
    name: 'Cierre Mensual',
    organizationId: 'raiz-contable',

    categoryId: 'finanzas',
    subcategoryId: 'inversion',
    tags: ['recurrente', 'aceptacion-inmediata', 'peru', 'nuevo'],

    summary: 'Servicio contable mensual para negocios que facturan online.',
    description:
      'Declaraciones, libros y un informe trimestral escrito para que lo entienda quien no es ' +
      'contador. Pensado para negocios digitales con facturación regular.',
    offer: 'Contabilidad mensual con informe trimestral',
    price: 380,
    priceUnit: 'month',

    commission: {
      model: 'recurring',
      percentage: 15,
      recurringMonths: 6,
      conversionEvent: 'subscription',
      attributionWindow: '30d',
    },
    access: 'open',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'cm-profile',
        kind: 'profile',
        label: 'Perfil completo al 50%',
        mandatory: true,
        profileCompleteness: 50,
      },
      {
        id: 'cm-country',
        kind: 'country',
        label: 'Ubicación en Perú',
        mandatory: true,
        countries: ['PE'],
      },
    ],
    channels: ['newsletter', 'linkedin', 'blog'],
    niches: ['finanzas', 'negocios'],
    countries: ['PE'],
    audience: 'Negocios digitales con facturación mensual estable',
    audienceTarget: 25000,
    restrictions: ['No se permite dar asesoría fiscal en nombre de Raíz Contable'],
    benefits: ['Comisión recurrente durante seis meses', 'Adhesión inmediata'],

    landingUrl: 'https://raizcontable.pe/cierre-mensual',
    resources: [],
    promoCodeEnabled: false,

    goal: { label: '6 altas este mes', target: 6, unit: 'conversions' },
    metrics: { activeAffiliates: 9, conversionRate: 1.8, conversions: 22, clicks: 1220 },

    cover: 'finanzas-01',
    createdAt: '2026-04-02',
    publishedAt: '2026-04-09',
  },

  {
    id: 'plan-doce-semanas',
    slug: 'plan-doce-semanas',
    name: 'Plan de 12 Semanas',
    organizationId: 'vital-lab',

    categoryId: 'salud',
    subcategoryId: 'nutricion',
    tags: ['peru', 'trending'],

    summary: 'Programa de nutrición de doce semanas con nutricionista asignada.',
    description:
      'Doce semanas con plan personalizado, revisiones quincenales y ajustes según resultados. ' +
      'Sin suplementos ni dietas cerradas.',
    offer: 'Programa de doce semanas con seguimiento quincenal',
    price: 890,
    priceUnit: 'one-time',

    commission: {
      model: 'fixed',
      amount: 120,
      conversionEvent: 'enrollment',
      attributionWindow: '15d',
    },
    access: 'open',
    status: 'active',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'pd-profile',
        kind: 'profile',
        label: 'Perfil completo al 60%',
        mandatory: true,
        profileCompleteness: 60,
      },
    ],
    channels: ['instagram', 'tiktok', 'youtube'],
    niches: ['bienestar'],
    countries: ['PE'],
    audience: 'Personas que han intentado varios planes sin acompañamiento',
    audienceTarget: 80000,
    restrictions: ['No se permite prometer pérdidas de peso concretas'],
    benefits: ['Programa con seguimiento real', 'Conversión rápida tras la sesión inicial'],

    landingUrl: 'https://vitallab.pe/plan-12',
    resources: [],
    promoCodeEnabled: true,

    goal: { label: '12 inscripciones este mes', target: 12, unit: 'conversions' },
    metrics: { activeAffiliates: 15, conversionRate: 1.05, conversions: 48, clicks: 4570 },

    cover: 'salud-01',
    createdAt: '2026-01-20',
    publishedAt: '2026-01-27',
  },

  {
    id: 'automatiza-tu-operacion',
    slug: 'automatiza-tu-operacion',
    name: 'Automatiza tu Operación',
    organizationId: 'fluxa',

    categoryId: 'productividad',
    subcategoryId: 'automatizacion',
    tags: ['nuevo', 'aceptacion-inmediata'],

    summary: 'Complemento de automatizaciones de Fluxa, facturado por uso.',
    description:
      'Conecta Fluxa con el resto de herramientas del equipo y automatiza los pasos repetidos. ' +
      'Se factura por número de automatizaciones activas.',
    offer: 'Complemento de automatizaciones sobre cualquier plan de Fluxa',
    price: 39,
    priceUnit: 'month',

    commission: {
      model: 'recurring',
      percentage: 18,
      recurringMonths: 3,
      conversionEvent: 'subscription',
      attributionWindow: '15d',
    },
    access: 'open',
    status: 'paused',
    duration: { type: 'evergreen' },

    requirements: [
      {
        id: 'at-profile',
        kind: 'profile',
        label: 'Perfil completo al 50%',
        mandatory: true,
        profileCompleteness: 50,
      },
    ],
    channels: ['newsletter', 'blog', 'youtube'],
    niches: ['productividad', 'herramientas'],
    countries: ['PE', 'CL', 'CO', 'MX'],
    audience: 'Equipos que ya usan Fluxa y tienen procesos repetitivos',
    audienceTarget: 30000,
    restrictions: [],
    benefits: ['Se suma a una suscripción que el cliente ya tiene'],

    landingUrl: 'https://fluxa.app/automatizaciones',
    resources: [],
    promoCodeEnabled: false,

    goal: { label: '8 activaciones este mes', target: 8, unit: 'conversions' },
    metrics: { activeAffiliates: 5, conversionRate: 1.4, conversions: 12, clicks: 860 },

    cover: 'productividad-01',
    createdAt: '2026-05-11',
    publishedAt: '2026-05-18',
  },

  {
    id: 'kit-de-lanzamiento',
    slug: 'kit-de-lanzamiento',
    name: 'Kit de Lanzamiento',
    organizationId: 'marea-creative',

    categoryId: 'marketing',
    subcategoryId: 'contenido',
    tags: ['peru', 'nuevo'],

    summary: 'Paquete de piezas de lanzamiento para negocios que abren o relanzan.',
    description:
      'Diez piezas de comunicación coordinadas para las dos semanas de un lanzamiento: ' +
      'anuncio, recordatorios, testimonios y cierre.',
    offer: 'Diez piezas coordinadas para un lanzamiento de dos semanas',
    price: 950,
    priceUnit: 'one-time',

    commission: {
      model: 'percentage',
      percentage: 10,
      conversionEvent: 'sale',
      attributionWindow: '15d',
    },
    access: 'open',
    status: 'active',
    duration: { type: 'scheduled', startsAt: '2026-08-01', endsAt: '2026-09-15' },

    requirements: [
      {
        id: 'kl-profile',
        kind: 'profile',
        label: 'Perfil completo al 50%',
        mandatory: true,
        profileCompleteness: 50,
      },
    ],
    channels: ['instagram', 'tiktok'],
    niches: ['diseno', 'marketing'],
    countries: ['PE'],
    audience: 'Negocios pequeños que preparan una apertura o un relanzamiento',
    audienceTarget: 55000,
    restrictions: [],
    benefits: ['Campaña con fecha de cierre: la urgencia es real'],

    landingUrl: 'https://mareacreative.pe/kit-lanzamiento',
    resources: [],
    promoCodeEnabled: false,

    goal: { label: '5 ventas antes del cierre', target: 5, unit: 'conversions' },
    metrics: { activeAffiliates: 3, conversionRate: 0.9, conversions: 4, clicks: 440 },

    cover: 'marketing-02',
    createdAt: '2026-07-14',
    publishedAt: '2026-07-21',
  },
];
