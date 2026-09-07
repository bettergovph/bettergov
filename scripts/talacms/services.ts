import { z } from 'zod';
import type { TalaCmsClient } from './client';
import {
  assertReferentialIntegrity,
  type Candidate,
  type ServiceRecordRef,
  type Taxonomy,
} from './categories';

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
  const parsed = RawServicesSchema.safeParse(
    await client<RawServices>(SERVICES_QUERY)
  );
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `${i.path.join('.') || '/'} ${i.message}`)
      .join('; ');
    fail(`TalaCMS returned a malformed service list: ${detail}`);
  }
  const raw = parsed.data!;
  assertStructure(raw);
  return raw;
}

export const SERVICES_SCHEMA_PATH =
  'src/data/services/schema/services.schema.json';

export const servicePathFor = (categorySlug: string) =>
  `src/data/services/${categorySlug}.json`;

/**
 * The committed key order, reproduced exactly. All 194 committed records use
 * it, and `prepare()` is byte-idempotent against every committed file under
 * it — any other order would produce a whole-file no-op diff.
 */
const toRecord = (s: RawService) => ({
  service: s.service,
  url: s.url,
  id: s.sourceId,
  slug: s.slug,
  published: s.published,
  featured: s.featured,
  category: { name: s.category.category, slug: s.category.slug },
  subcategory: { name: s.subcategory.name, slug: s.subcategory.slug },
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

/**
 * Stage 4: pure shaping. One candidate per TAXONOMY category — not per
 * category that has records — so a new CMS category produces a named missing
 * file rather than a silent no-op. `position` is dropped; ordering within a
 * file is produced by sorting on it, never inherited from response order.
 */
export function shapeServices(
  raw: RawServices,
  taxonomyCategorySlugs: string[]
): Candidate[] {
  const byCategory = new Map<string, RawService[]>(
    taxonomyCategorySlugs.map(slug => [slug, []])
  );

  for (const s of raw.allGovernmentServices) {
    const bucket = byCategory.get(s.category.slug);
    // Unreachable after the stage-3 pair check; belt and braces, because
    // dropping a record silently would be far worse than failing.
    if (!bucket) {
      fail(
        `service "${s.slug}" references category "${s.category.slug}", which is not in the taxonomy`
      );
    }
    bucket!.push(s);
  }

  return [...byCategory].map(([slug, records]) => ({
    path: servicePathFor(slug),
    schemaPath: SERVICES_SCHEMA_PATH,
    data: [...records].sort((a, b) => a.position - b.position).map(toRecord),
  }));
}

export interface CrossValidateInput {
  taxonomy: Taxonomy;
  records: ServiceRecordRef[];
  /**
   * §6.5. `null` where no candidate services were fetched: `position` is not
   * emitted into the committed records, so there is no committed source for
   * it, and querying services during a categories-only run would violate the
   * isolation contract.
   */
  ordering: { position: number; categorySlug: string }[] | null;
  /**
   * §6.6. `null` under --only=categories: the gate guards the set of service
   * files THIS RUN would generate, and a categories-only run generates none.
   * Applying it there would fail on a new CMS category that has no service
   * file yet, contradicting the one-directional allowance.
   */
  fileSet: { generated: string[]; committed: string[] } | null;
}

/**
 * §6.4. `category.category` and `subcategory.name` are denormalised onto every
 * record from two independent CMS relations; the taxonomy carries its own
 * copy. If they disagree, fail — do not choose a winner and do not normalize.
 * Subcategory names are keyed by (categorySlug, subcategorySlug) because bare
 * subcategory slugs legitimately repeat across parents.
 */
function assertNameAgreement(
  taxonomy: Taxonomy,
  records: ServiceRecordRef[]
): void {
  const categoryNames = new Map(
    taxonomy.categories.map(c => [c.slug, c.category])
  );
  const subcategoryNames = new Map<string, string>(
    taxonomy.categories.flatMap(c =>
      c.subcategories.map(s => [`${c.slug}/${s.slug}`, s.name])
    )
  );

  for (const r of records) {
    const categoryName = categoryNames.get(r.category.slug);
    // A missing key is §6.3's failure, already raised above; guarding on
    // `undefined` keeps this gate independent of gate ordering.
    if (categoryName !== undefined && categoryName !== r.category.name) {
      fail(
        `category "${r.category.slug}" is named "${r.category.name}" on a service record but "${categoryName}" in the taxonomy. Neither side wins: a rename requires a full sync that regenerates both.`
      );
    }
    const key = `${r.category.slug}/${r.subcategory.slug}`;
    const subcategoryName = subcategoryNames.get(key);
    if (
      subcategoryName !== undefined &&
      subcategoryName !== r.subcategory.name
    ) {
      fail(
        `subcategory "${key}" is named "${r.subcategory.name}" on a service record but "${subcategoryName}" in the taxonomy. Neither side wins: a rename requires a full sync that regenerates both.`
      );
    }
  }
}

/**
 * §6.5. Because `position` is dropped from the output, the frontend recovers
 * global order from codepoint filename concatenation alone. This asserts the
 * two agree.
 *
 * Equivalent to "concatenating the shaped candidates in path-codepoint order
 * equals the records sorted by global position", without needing the shaped
 * candidates: given unique positions, that holds exactly when the
 * position-sorted paths are non-decreasing in codepoint order.
 */
function assertGlobalOrdering(
  ordering: { position: number; categorySlug: string }[]
): void {
  const sorted = [...ordering].sort((a, b) => a.position - b.position);
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = servicePathFor(sorted[i - 1].categorySlug);
    const current = servicePathFor(sorted[i].categorySlug);
    if (current < previous) {
      fail(
        `global \`position\` order does not match codepoint filename order: position ${sorted[i].position} lands in ${current}, after position ${sorted[i - 1].position} in ${previous}. Categories must occupy contiguous position blocks, in filename order. Deciding otherwise changes rendered page order and must be an explicit human decision — see §6.5 of the design spec.`
      );
    }
  }
}

/** §6.6 and §6.8: fail naming every file, and state the next action. */
function assertFileSet(generated: string[], committed: string[]): void {
  const byCodepoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const generatedSet = new Set(generated);
  const committedSet = new Set(committed);
  const added = generated.filter(f => !committedSet.has(f)).sort(byCodepoint);
  const removed = committed.filter(f => !generatedSet.has(f)).sort(byCodepoint);
  if (added.length === 0 && removed.length === 0) return;

  const lines = ['the generated file set does not match the approved one.'];
  for (const f of added) lines.push(`  would add: src/data/services/${f}`);
  for (const f of removed) lines.push(`  would remove: src/data/services/${f}`);
  lines.push('', '  To unblock:');
  if (added.length > 0) {
    lines.push(
      '  1. Create each file listed above containing an empty array: []',
      '  2. Re-run `npm run sync:talacms` (the placeholder need not be committed',
      '     first — this is deliberate, so one reviewed commit can carry the',
      '     placeholder, the taxonomy and the generated data together).',
      '  3. Before committing, decide per curated consumer whether the new',
      '     category belongs there. See "Category churn checklist" in the README.'
    );
  }
  if (removed.length > 0) {
    lines.push(
      '  1. Confirm the category was intentionally retired in TalaCMS.',
      '  2. Delete each file listed above, then re-run `npm run sync:talacms`.',
      '  3. Audit the curated consumers in the README checklist for stale links.',
      '  Deleting data is never automatic in this sync.'
    );
  }
  fail(lines.join('\n'));
}

/**
 * Stage 3. The single cross-dataset validator, run once per invocation over
 * whichever records and taxonomy the run mode selects, before either candidate
 * is shaped. A `null` input means "not applicable in this mode" — never
 * "substitute a weaker check".
 */
export function crossValidate(input: CrossValidateInput): void {
  assertReferentialIntegrity(input.taxonomy, input.records);
  assertNameAgreement(input.taxonomy, input.records);
  if (input.ordering) assertGlobalOrdering(input.ordering);
  if (input.fileSet) {
    assertFileSet(input.fileSet.generated, input.fileSet.committed);
  }
}
