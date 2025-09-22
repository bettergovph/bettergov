import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string[];
  jsonLd?: object;
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = '/ph-logo.webp',
  ogType = 'website',
  noIndex = false,
  keywords = [],
  jsonLd,
  breadcrumbs,
}: SEOProps) {
  const siteTitle = 'Philippine Government Portal';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const baseUrl = 'https://gov.ph'; // Replace with actual domain
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : undefined;
  const fullOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${baseUrl}${ogImage}`;

  // Generate breadcrumb structured data
  const breadcrumbJsonLd = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((breadcrumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: breadcrumb.name,
          item: `${baseUrl}${breadcrumb.url}`,
        })),
      }
    : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords.length > 0 && (
        <meta name='keywords' content={keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      {fullCanonical && <link rel='canonical' href={fullCanonical} />}

      {/* Robots */}
      {noIndex && <meta name='robots' content='noindex, nofollow' />}

      {/* Open Graph */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:type' content={ogType} />
      <meta property='og:image' content={fullOgImage} />
      <meta property='og:site_name' content={siteTitle} />
      {fullCanonical && <meta property='og:url' content={fullCanonical} />}

      {/* Twitter Card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={fullOgImage} />

      {/* Government Specific Meta Tags */}
      <meta name='geo.country' content='PH' />
      <meta name='geo.region' content='PH' />
      <meta name='DC.language' content='en' />
      <meta name='DC.creator' content='Republic of the Philippines' />
      <meta name='DC.publisher' content='Philippine Government' />
      <meta name='DC.rights' content='© Republic of the Philippines' />

      {/* Structured Data */}
      {jsonLd && (
        <script type='application/ld+json'>{JSON.stringify(jsonLd)}</script>
      )}

      {/* Breadcrumb Structured Data */}
      {breadcrumbJsonLd && (
        <script type='application/ld+json'>
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
