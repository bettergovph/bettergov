/**
 * Display names for the search index's `type` values. The sidebar uses
 * the facet names editors asked for ("Guides" for the section); each
 * result's badge uses the singular.
 */
const TYPE_FACET_LABELS: Record<string, string> = {
  website: 'Website',
  directory_item: 'Directory',
  service: 'Service',
  guide: 'Guides',
  page: 'Page',
};

const TYPE_FLAG_LABELS: Record<string, string> = {
  ...TYPE_FACET_LABELS,
  guide: 'Guide',
};

/** "some_new_type" → "Some new type", so an unmapped value still reads. */
const humanize = (value: string) =>
  value.replace(/[_-]+/g, ' ').replace(/^\w/, c => c.toUpperCase());

export const typeFacetLabel = (value: string) =>
  TYPE_FACET_LABELS[value] ?? humanize(value);

export const typeFlagLabel = (value: string) =>
  TYPE_FLAG_LABELS[value] ?? humanize(value);

export type HitLink = { href: string; external: boolean };

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const inPlace = (href: string): HitLink => ({ href, external: false });

/** "ABANTE, BIENVENIDO M., JR." → "Abante", to filter a members list. */
const surname = (name: string) =>
  name
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase());

/**
 * GOV.PH's page for an index directory entry, from what the entry holds:
 * legislators filter their chamber's members list, chambers and office
 * types have pages of their own.
 */
function directoryPage(hit: Record<string, unknown>): string | undefined {
  const name = text(hit.name);
  if (hit.district !== undefined && name) {
    return `/government/legislative/house-members?q=${encodeURIComponent(surname(name))}`;
  }
  if (hit.party_list !== undefined && name) {
    return `/government/legislative/party-list-members?q=${encodeURIComponent(surname(name))}`;
  }
  if (hit.chamber !== undefined && text(hit.slug)) {
    return `/government/legislative/${hit.slug}`;
  }
  const officeType = text(hit.office_type) ?? '';
  if (officeType.includes('GOCC')) return '/government/constitutional/goccs';
  if (officeType.includes('SUC')) return '/government/constitutional/sucs';
  if (hit.slug === 'diplomatic') return '/government/diplomatic';
  return undefined;
}

/**
 * Where a result goes. Pages on GOV.PH open in place; services and agency
 * websites open the agency's own site in a new tab. Index entries with no
 * URL of their own go to their GOV.PH directory page — `siteUrl`, set by
 * withSitePages when it knows the entry — and never to a dead link.
 */
export function resolveHitLink(hit: Record<string, unknown>): HitLink {
  const url = text(hit.url);
  if (url?.startsWith('/')) return inPlace(url);
  if (url) return { href: url, external: true };

  const website = text(hit.website);
  if (hit.type === 'website' && website) {
    return {
      href: /^https?:\/\//i.test(website) ? website : `https://${website}`,
      external: true,
    };
  }

  return inPlace(
    text(hit.siteUrl) ??
      (hit.type === 'directory_item' ? directoryPage(hit) : undefined) ??
      '/government'
  );
}
