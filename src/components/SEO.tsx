import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import routeMeta from '../data/seo-metadata.json';
import {
  formatStandardDescription,
  formatStandardTitle,
} from '@/lib/seoTemplates';

interface SEOProps {
  title?: string;
  description?: string;
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
  ogImage = '/logos/jpg/BetterGov_Vertical-White.jpg',
  ogType = 'website',
  noIndex = false,
  keywords = [],
  jsonLd,
  breadcrumbs,
}: SEOProps = {}) {
  const location = useLocation();
  const [, forceUpdate] = useState({});

  const routeMetaMap = routeMeta as Record<string, unknown>;

  // Support query-string specific metadata by normalising the search params
  const normalizeQuery = (search: string): string | null => {
    if (!search || search === '?') return null;

    const params = Array.from(new URLSearchParams(search).entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort();

    return params.length > 0 ? params.join('&') : null;
  };

  const readMeta = (
    source: unknown
  ): { title?: string; description?: string; subject?: string } => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return {};
    }

    const data = source as Record<string, unknown>;

    return {
      title: typeof data.title === 'string' ? data.title : undefined,
      description:
        typeof data.description === 'string' ? data.description : undefined,
      subject: typeof data.subject === 'string' ? data.subject : undefined,
    };
  };

  const normalizedQuery = normalizeQuery(location.search);
  // Pull static metadata for the current pathname, then layer query overrides or defaults
  const routeEntry = routeMetaMap[location.pathname] ?? null;

  const baseMeta = readMeta(routeEntry);
  let routeTitle = baseMeta.title;
  let routeDescription = baseMeta.description;
  let routeSubject = baseMeta.subject;

  if (
    routeEntry &&
    typeof routeEntry === 'object' &&
    !Array.isArray(routeEntry)
  ) {
    const entryObj = routeEntry as Record<string, unknown>;

    const queryMeta =
      normalizedQuery && entryObj[normalizedQuery]
        ? readMeta(entryObj[normalizedQuery])
        : {};
    const defaultMeta = readMeta(entryObj['_default']);

    if (queryMeta.title !== undefined) {
      routeTitle = queryMeta.title;
    } else if (routeTitle === undefined && defaultMeta.title !== undefined) {
      routeTitle = defaultMeta.title;
    }
    if (queryMeta.subject !== undefined) {
      routeSubject = queryMeta.subject;
    }

    if (queryMeta.description !== undefined) {
      routeDescription = queryMeta.description;
    } else if (
      routeDescription === undefined &&
      defaultMeta.description !== undefined
    ) {
      routeDescription = defaultMeta.description;
    }
    if (routeSubject === undefined && defaultMeta.subject !== undefined) {
      routeSubject = defaultMeta.subject;
    }
  }

  if (routeTitle === undefined && routeSubject) {
    routeTitle = formatStandardTitle(routeSubject);
  }
  if (routeDescription === undefined && routeSubject) {
    routeDescription = formatStandardDescription(routeSubject);
  }

  // Default values
  const defaultTitle =
    'BetterGov.ph Philippines | Community Powered Government Portal';
  const defaultDescription =
    'Community-powered portal of the Philippines. Access government services, stay updated with the latest news, and find information about the Philippines.';
  const defaultCanonical = location.pathname + location.search;

  useEffect(() => {
    // Force a re-render of this component on route or query-string changes
    // This ensures the Helmet instance is refreshed
    forceUpdate({});
  }, [location.pathname, location.search]);
  // Use provided values or defaults
  const finalTitle = title || routeTitle || defaultTitle;
  const finalDescription =
    description || routeDescription || defaultDescription;

  const siteTitle = 'BetterGov.ph';
  const fullTitle = title ? `${title} | ${siteTitle}` : finalTitle;
  const baseUrl = 'https://bettergov.ph';
  const fullCanonical = defaultCanonical
    ? `${baseUrl}${defaultCanonical}`
    : undefined;
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
    <Helmet key={`${location.pathname}${location.search}`}>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={finalDescription} />
      {keywords.length > 0 && (
        <meta name='keywords' content={keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      {fullCanonical && <link rel='canonical' href={fullCanonical} />}

      {/* Robots */}
      {noIndex && <meta name='robots' content='noindex, nofollow' />}

      {/* Open Graph */}
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={finalDescription} />
      <meta property='og:type' content={ogType} />
      <meta property='og:image' content={fullOgImage} />
      <meta property='og:site_name' content={siteTitle} />
      {fullCanonical && <meta property='og:url' content={fullCanonical} />}

      {/* Twitter Card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={finalDescription} />
      <meta name='twitter:image' content={fullOgImage} />

      {/* Government Specific Meta Tags */}
      <meta name='geo.country' content='PH' />
      <meta name='geo.region' content='PH' />
      <meta name='DC.language' content='en' />
      <meta name='DC.creator' content='BetterGov.ph' />
      <meta name='DC.publisher' content='BetterGov.ph' />

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
