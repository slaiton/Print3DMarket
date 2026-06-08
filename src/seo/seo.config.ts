// ============================================================
// SEO Configuration — market.slaiton.com
// Palabras clave: impresión 3D · regalos · coleccionables · a la medida
// ============================================================

export const SITE = {
  name:        'Print3D Market',
  tagline:     'Impresión 3D personalizada · Regalos únicos · Figuras coleccionables',
  url:         'https://market.slaiton.com',
  locale:      'es_CO',
  twitter:     '@slaiton',        // actualiza con tu handle real
  themeColor:  '#e85d04',
};

// ── Palabras clave principales ────────────────────────────────
// Basadas en volumen de búsqueda Colombia + Latinoamérica
export const KEYWORDS = {
  primary: [
    'impresión 3D Colombia',
    'figuras impresas en 3D',
    'regalos personalizados 3D',
    'impresión 3D a la medida',
    'figuras coleccionables impresas',
  ],
  secondary: [
    'comprar figuras 3D Colombia',
    'regalos originales 3D',
    'impresión 3D Bogotá',
    'miniaturas personalizadas 3D',
    'figuras PLA personalizadas',
    'impresión 3D bajo pedido',
    'regalos únicos impresos en 3D',
    'figuras decorativas impresas 3D',
    'accesorios impresos en 3D',
    'llaveros 3D personalizados',
  ],
  longTail: [
    'donde comprar figuras impresas en 3D Colombia',
    'impresión 3D personalizada regalo cumpleaños',
    'figuras coleccionables videojuegos impresas 3D',
    'cómo pedir impresión 3D personalizada',
    'figuras decorativas resina PLA Colombia',
    'impresión 3D rápida envío Colombia',
    'regalo original personalizado impreso 3D',
  ],
};

// ── Meta por página ───────────────────────────────────────────
export const PAGE_META = {
  home: {
    title:       'Print3D Market — Impresión 3D Personalizada & Regalos Únicos Colombia',
    description: 'Descubre figuras coleccionables, regalos personalizados y piezas impresas en 3D a la medida. Diseños únicos en PLA, PETG y resina. Envíos a todo Colombia.',
    keywords:    [...KEYWORDS.primary, ...KEYWORDS.secondary].join(', '),
  },
  catalog: {
    title:       'Catálogo de Impresión 3D — Figuras, Regalos y Coleccionables | Print3D Market',
    description: 'Explora nuestro catálogo de impresiones 3D: figuras coleccionables, regalos únicos, accesorios personalizados y piezas a la medida. Materiales PLA, PETG, resina.',
    keywords:    [...KEYWORDS.primary, ...KEYWORDS.longTail].join(', '),
  },
  login: {
    title:       'Acceso al Panel de Vendedores | Print3D Market',
    description: 'Ingresa al panel de gestión de Print3D Market para administrar productos, ventas y catálogo.',
    keywords:    'panel vendedor impresión 3D, gestión catálogo 3D',
  },
};

// ── JSON-LD: datos estructurados del negocio ──────────────────
export const JSONLD_ORGANIZATION = {
  '@context':   'https://schema.org',
  '@type':      'LocalBusiness',
  name:         SITE.name,
  description:  SITE.tagline,
  url:          SITE.url,
  logo:         `${SITE.url}/logo.png`,
  image:        `${SITE.url}/og-image.jpg`,
  telephone:    import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
  address: {
    '@type':         'PostalAddress',
    addressCountry:  'CO',
    addressLocality: 'Colombia',
  },
  sameAs: [
    // Agrega tus redes cuando las tengas:
    // 'https://www.instagram.com/tuusuario',
    // 'https://www.facebook.com/tuusuario',
    // 'https://wa.me/' + (import.meta.env.VITE_WHATSAPP_NUMBER ?? ''),
  ],
};

// ── JSON-LD: datos de producto individual ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProductJsonLD(product: any) {
  return {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        product.name,
    description: product.description ?? product.name,
    image:       product.images?.[0] ?? '',
    brand: {
      '@type': 'Brand',
      name:    SITE.name,
    },
    offers: {
      '@type':           'Offer',
      price:             product.price,
      priceCurrency:     'COP',
      availability:      product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url:               SITE.url,
      seller: {
        '@type': 'Organization',
        name:    SITE.name,
      },
    },
    ...(product.material && {
      material: product.material,
    }),
  };
}
