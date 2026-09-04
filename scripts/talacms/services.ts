import { z } from 'zod';
import type { TalaCmsClient } from './client';

/**
 * Explicit ceiling on how many records we ask TalaCMS for in one request.
 * Today's real count is 194. Reaching the ceiling fails rather than silently
 * serving an undercount — raise this constant if that ever fires.
 */
const SERVICES_PAGE_SIZE = 500;

/**
 * NOTE: `_allGovernmentServicesMeta` is declared before `allGovernmentServices`
 * — see the global resolver-ordering rule documented in ./categories.ts. Do not
 * interleave meta and collection fields, and do not "clean up" this ordering
 * without re-verifying against TalaCMS first.
 *
 * `createdAt`/`updatedAt` are the CONTENT fields. `_createdAt`/`_updatedAt` are
 * 2026 system timestamps and must never be used here.
 */
export const SERVICES_QUERY = `
query SyncGovernmentServices {
  _allGovernmentServicesMeta {
    count
  }
  allGovernmentServices(orderBy: [position_ASC], first: ${SERVICES_PAGE_SIZE}) {
    sourceId
    position
    service
    slug
    url
    published
    featured
    createdAt
    updatedAt
    category { slug category }
    subcategory { slug name category { slug } }
  }
}
`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RawServiceSchema = z.object({
  sourceId: z.string(),
  position: z.number().int(),
  service: z.string(),
  slug: z.string(),
  url: z.string(),
  published: z.boolean(),
  featured: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: z.object({ slug: z.string(), category: z.string() }),
  subcategory: z.object({
    slug: z.string(),
    name: z.string(),
    category: z.object({ slug: z.string() }),
  }),
});
const RawServicesSchema = z.object({
  _allGovernmentServicesMeta: z.object({ count: z.number() }),
  allGovernmentServices: z.array(RawServiceSchema),
});

export type RawService = z.infer<typeof RawServiceSchema>;
export type RawServices = z.infer<typeof RawServicesSchema>;

const fail = (message: string): never => {
  throw new Error(`[sync:services] ${message}`);
};

function assertStructure(raw: RawServices): void {
  const returned = raw.allGovernmentServices.length;
  const meta = raw._allGovernmentServicesMeta.count;

  if (returned !== meta) {
    fail(
      `TalaCMS returned an incomplete service list (returned ${returned}, meta reported ${meta})`
    );
  }
  if (meta === 0) fail('TalaCMS returned no government services');
  if (returned >= SERVICES_PAGE_SIZE) {
    fail(
      `service count reached the page-size ceiling of ${SERVICES_PAGE_SIZE}; raise SERVICES_PAGE_SIZE and re-run`
    );
  }

  const sourceIds = new Set<string>();
  const positions = new Set<number>();
  const slugs = new Set<string>();

  for (const s of raw.allGovernmentServices) {
    // `sourceId` is an unconstrained String upstream and three live records
    // already carry hand-authored, non-hex values. Presence and uniqueness are
    // gated; format deliberately is not.
    if (s.sourceId.trim() === '') fail('a service record has a blank sourceId');
    if (sourceIds.has(s.sourceId)) fail(`duplicate sourceId "${s.sourceId}"`);
    sourceIds.add(s.sourceId);

    if (positions.has(s.position)) {
      fail(
        `duplicate position ${s.position} — output ordering would be non-deterministic`
      );
    }
    positions.add(s.position);

    if (!SLUG_PATTERN.test(s.slug)) {
      fail(`service slug "${s.slug}" does not match the schema slug pattern`);
    }
    if (slugs.has(s.slug)) fail(`duplicate service slug "${s.slug}"`);
    slugs.add(s.slug);

    if (!SLUG_PATTERN.test(s.category.slug)) {
      fail(
        `category slug "${s.category.slug}" on service "${s.slug}" does not match the schema slug pattern`
      );
    }
    if (!SLUG_PATTERN.test(s.subcategory.slug)) {
      fail(
        `subcategory slug "${s.subcategory.slug}" on service "${s.slug}" does not match the schema slug pattern`
      );
    }
    if (s.service.trim() === '') {
      fail(`service "${s.slug}" has a blank service name`);
    }

    // The two relations are independent upstream; a record whose subcategory
    // hangs off a different parent than its own category is internally
    // inconsistent regardless of what any taxonomy says.
    if (s.subcategory.category.slug !== s.category.slug) {
      fail(
        `orphaned subcategory relation on service "${s.slug}": subcategory "${s.subcategory.slug}" belongs to "${s.subcategory.category.slug}", not "${s.category.slug}"`
      );
    }
  }
}

/** Stage 1: query, parse, and apply the structural gates — nothing else. */
export async function fetchServices(
  client: TalaCmsClient
): Promise<RawServices> {
  const raw = RawServicesSchema.parse(
    await client<RawServices>(SERVICES_QUERY)
  );
  assertStructure(raw);
  return raw;
}
