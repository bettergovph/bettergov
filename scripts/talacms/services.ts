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

/** ASCII whitespace and control characters, anywhere in the raw string. */
// eslint-disable-next-line no-control-regex -- deliberately matches control chars
const URL_FORBIDDEN_CHARS = /[\u0000-\u0020\u007F]/;
/** A `%` not followed by exactly two hexadecimal digits. */
const URL_BAD_ESCAPE = /%(?![0-9A-Fa-f]{2})/;

/**
 * Conjunctive over the RAW string, not only the parsed result. Measured:
 * `new URL()` silently strips a tab, tolerates a raw space, strips a leading
 * space, and round-trips every malformed escape byte-for-byte — so parsing
 * alone accepts values the committed schema pattern would later reject, and
 * the failure would then name the file instead of the record.
 */
function urlProblem(raw: string): string | null {
  if (URL_FORBIDDEN_CHARS.test(raw)) {
    return 'it contains whitespace or a control character';
  }
  if (!/^https?:\/\//.test(raw)) {
    return 'it does not start with a lowercase "http://" or "https://"';
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return 'it is not a parseable URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `its scheme is "${parsed.protocol}"`;
  }
  if (parsed.hostname === '') return 'it has no hostname';
  if (URL_BAD_ESCAPE.test(raw)) {
    return 'it contains a "%" that does not begin a valid two-hex-digit escape';
  }
  return null;
}

/**
 * Deliberately narrower than RFC 3339: uppercase `T`, UTC `Z`, and either
 * exactly three fractional digits or none. Measured across all 388 committed
 * values: 382 carry `.NNN`, 6 carry none, none use an offset or lowercase
 * form. A narrower canonical form keeps generated diffs stable; anything
 * outside it fails closed rather than being reformatted.
 */
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function timestampProblem(raw: string): string | null {
  if (!TIMESTAMP_PATTERN.test(raw)) {
    return 'it is not `YYYY-MM-DDTHH:MM:SS[.mmm]Z`';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'it is not a real instant';
  // Canonical re-serialization, not string equality with the raw input:
  // "2025-02-30T00:00:00.000Z" matches the pattern and `Date` accepts it,
  // rolling silently over to March 2. `toISOString()` always emits
  // milliseconds, so the no-fraction shape is filled in before comparing —
  // otherwise the 6 legitimately fraction-free committed values would fail.
  const canonical = raw.includes('.') ? raw : raw.replace(/Z$/, '.000Z');
  if (date.toISOString() !== canonical) {
    return 'it is not a real calendar date/time (it rolls over)';
  }
  return null;
}

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

    const urlIssue = urlProblem(s.url);
    if (urlIssue) {
      fail(`service "${s.slug}" has an invalid url "${s.url}": ${urlIssue}`);
    }
    for (const field of ['createdAt', 'updatedAt'] as const) {
      const issue = timestampProblem(s[field]);
      if (issue) {
        fail(
          `service "${s.slug}" has an invalid ${field} "${s[field]}": ${issue}`
        );
      }
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
