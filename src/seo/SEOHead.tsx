import { Helmet } from 'react-helmet-async';
import { SITE } from './seo.config';

interface SEOHeadProps {
  title:        string;
  description:  string;
  keywords?:    string;
  canonical?:   string;
  ogImage?:     string;
  ogType?:      'website' | 'product' | 'article';
  /** JSON-LD structured data objects */
  jsonLd?:      object | object[];
  noIndex?:     boolean;
}

export function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogImage    = `${SITE.url}/og-image.jpg`,
  ogType     = 'website',
  jsonLd,
  noIndex    = false,
}: SEOHeadProps) {
  const canonicalUrl = canonical ?? SITE.url;
  const jsonLdArray  = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet prioritizeSeoTags>
      {/* ── Básicos ── */}
      <html lang="es" />
      <title>{title}</title>
      <meta name="description"        content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="theme-color"        content={SITE.themeColor} />
      <link rel="canonical"           href={canonicalUrl} />

      {/* ── Robots ── */}
      {noIndex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large" />
      }

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ── */}
      <meta property="og:type"        content={ogType} />
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height"content="630" />
      <meta property="og:site_name"   content={SITE.name} />
      <meta property="og:locale"      content={SITE.locale} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={SITE.twitter} />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />

      {/* ── JSON-LD Structured Data ── */}
      {jsonLdArray.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  );
}
