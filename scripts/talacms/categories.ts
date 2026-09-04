import { z } from 'zod';
import type { TalaCmsClient } from './client';

export interface Candidate {
  path: string;
  schemaPath: string;
  data: unknown;
}

export type ServiceRecordRef = {
  category: { name: string; slug: string };
  subcategory: { name: string; slug: string };
};

/**
 * Explicit ceiling on how many records we ask TalaCMS for in one request.
 * Today's real count is 13. Reaching the ceiling fails rather than silently
 * serving an undercount — raise this constant if that ever fires.
 */
const CATEGORIES_PAGE_SIZE = 100;

/**
 * NOTE: every `_all*Meta` field is declared before every collection field in
 * this operation. This is a global ordering rule, not a per-pair one —
 * TalaCMS's CDA resolver returns `count: 0` for a `_all*Meta` field if *any*
 * collection field appears earlier anywhere in the same operation. Confirmed
 * 2026-09-02 against bettergov.talacms.com/cda/v1/graphql across 8 field-order
 * permutations. This is an upstream resolver bug, not a client concern. Do not
 * interleave meta and collection fields, and do not "clean up" this ordering
 * without re-verifying against TalaCMS first.
 */
export const CATEGORIES_QUERY = `
query SyncServiceCategories {
  _allServiceCategoriesMeta {
    count
  }
  allServiceCategories(orderBy: [position_ASC], first: ${CATEGORIES_PAGE_SIZE}) {
    position
    category
    slug
    subcategories { name slug }
  }
}
`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RawSubcategorySchema = z.object({ name: z.string(), slug: z.string() });
const RawCategorySchema = z.object({
  position: z.number().int(),
  category: z.string(),
  slug: z.string(),
  subcategories: z.array(RawSubcategorySchema),
});
const RawResponseSchema = z.object({
  _allServiceCategoriesMeta: z.object({ count: z.number() }),
  allServiceCategories: z.array(RawCategorySchema),
});
type RawResponse = z.infer<typeof RawResponseSchema>;

const fail = (message: string): never => {
  throw new Error(`[sync:categories] ${message}`);
};

function assertStructure(raw: RawResponse): void {
  const returned = raw.allServiceCategories.length;
  const meta = raw._allServiceCategoriesMeta.count;

  if (returned !== meta) {
    fail(
      `TalaCMS returned an incomplete category list (returned ${returned}, meta reported ${meta})`
    );
  }
  if (meta === 0) fail('TalaCMS returned no categories');
  if (returned >= CATEGORIES_PAGE_SIZE) {
    fail(
      `category count reached the page-size ceiling of ${CATEGORIES_PAGE_SIZE}; raise CATEGORIES_PAGE_SIZE and re-run`
    );
  }

  const positions = new Set<number>();
  const categorySlugs = new Set<string>();

  for (const c of raw.allServiceCategories) {
    if (positions.has(c.position)) {
      fail(
        `duplicate position ${c.position} — output ordering would be non-deterministic`
      );
    }
    positions.add(c.position);

    if (!SLUG_PATTERN.test(c.slug)) {
      fail(`category slug "${c.slug}" does not match the schema slug pattern`);
    }
    if (categorySlugs.has(c.slug)) {
      fail(`duplicate category slug "${c.slug}"`);
    }
    categorySlugs.add(c.slug);

    if (c.category.trim() === '') {
      fail(`category "${c.slug}" has a blank display name`);
    }
    if (c.subcategories.length === 0) {
      fail(
        `category "${c.slug}" has no subcategories; the schema requires at least one`
      );
    }

    const subSlugs = new Set<string>();
    for (const s of c.subcategories) {
      if (!SLUG_PATTERN.test(s.slug)) {
        fail(
          `subcategory slug "${s.slug}" under "${c.slug}" does not match the schema slug pattern`
        );
      }
      if (subSlugs.has(s.slug)) {
        fail(`duplicate subcategory slug "${s.slug}" under "${c.slug}"`);
      }
      subSlugs.add(s.slug);
      if (s.name.trim() === '') {
        fail(`subcategory "${c.slug}/${s.slug}" has a blank display name`);
      }
    }
  }
}

/**
 * One-directional contract: every pair a committed service record references
 * must exist in the candidate, under that same parent.
 *
 * The reverse is deliberately NOT checked — a generated category with no
 * records is legitimate new content (an editor adds a category before its
 * services exist) and renders a valid empty filter view. Requiring coverage
 * would make committed records an authority over the CMS taxonomy.
 */
function assertReferentialIntegrity(
  raw: RawResponse,
  serviceRecords: ServiceRecordRef[]
): void {
  const pairs = new Map<string, Set<string>>(
    raw.allServiceCategories.map(c => [
      c.slug,
      new Set(c.subcategories.map(s => s.slug)),
    ])
  );

  for (const record of serviceRecords) {
    const parent = pairs.get(record.category.slug);
    if (!parent) {
      fail(
        `committed service records reference category "${record.category.slug}", which the CMS taxonomy no longer contains`
      );
    }
    if (!parent!.has(record.subcategory.slug)) {
      fail(
        `committed service records reference "${record.category.slug}/${record.subcategory.slug}", which the CMS taxonomy no longer contains under that parent`
      );
    }
  }
}

export async function buildCategories(
  client: TalaCmsClient,
  serviceRecords: ServiceRecordRef[]
): Promise<Candidate> {
  const raw = RawResponseSchema.parse(
    await client<RawResponse>(CATEGORIES_QUERY)
  );

  assertStructure(raw);
  assertReferentialIntegrity(raw, serviceRecords);

  // Ordering is produced, not inherited: `orderBy` is a convenience, and
  // relying on response order would make every future diff depend on server
  // behavior the client cannot verify. `position` is dropped from the output
  // because the schema forbids extra properties.
  const categories = [...raw.allServiceCategories]
    .sort((a, b) => a.position - b.position)
    .map(c => ({
      category: c.category,
      slug: c.slug,
      subcategories: c.subcategories.map(s => ({ name: s.name, slug: s.slug })),
    }));

  return {
    path: 'src/data/service_categories.json',
    schemaPath: 'src/data/schema/service_categories.schema.json',
    data: { categories },
  };
}
