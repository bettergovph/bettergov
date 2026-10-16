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
