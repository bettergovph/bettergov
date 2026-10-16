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

/**
 * Where a result goes. Site pages carry a path on GOV.PH and open in place;
 * services carry the agency's own URL and open in a new tab.
 */
export function resolveHitLink(hit: Record<string, unknown>): HitLink {
  const url = typeof hit.url === 'string' ? hit.url : undefined;
  if (url?.startsWith('/')) return { href: url, external: false };
  if (url) return { href: url, external: true };
  return { href: hit.slug ? `/directory/${hit.slug}` : '#', external: true };
}
