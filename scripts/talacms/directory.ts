import { z } from 'zod';
import type { TalaCmsClient } from './client';
import type { Candidate } from './categories';

/**
 * Explicit ceiling on how many records we ask TalaCMS for in one request.
 * Today's real counts are 23 and 38. Reaching the ceiling fails rather than
 * silently serving an undercount — raise this constant if that ever fires.
 * The CDA caps `first` at 500; that cap is deliberately not approached here
 * and pagination is out of scope for this branch.
 */
export const DIRECTORY_PAGE_SIZE = 100;

/**
 * Constitutional Offices carries 229 records — well past the shared
 * DIRECTORY_PAGE_SIZE of 100, so it gets its own ceiling rather than raising
 * the shared one and weakening the gate for the two small models.
 *
 * 300 leaves ~70 records of headroom and still fails loudly well below the
 * CDA's hard `first` cap of 500. If this ever fires, raise it to at most 500;
 * beyond that the model needs real pagination, which is out of scope here.
 */
export const CONSTITUTIONAL_PAGE_SIZE = 300;

/**
 * TWO independent operations, one per model — NOT one combined query.
 * `sync-talacms.ts` guarantees that an unselected dataset is never queried or
 * validated; a combined query would make `--only=departments` fail on invalid
 * Executive data and vice versa. Each operation declares its own `_all*Meta`
 * field before its own collection field, which is what the per-operation
 * resolver-ordering rule in ./categories.ts requires. Do not merge these two
 * into one operation, and do not "clean up" this ordering without
 * re-verifying against TalaCMS first.
 *
 * `_createdAt`/`_updatedAt` are system timestamps and are deliberately not
 * requested; neither model carries content timestamps.
 */
export const DEPARTMENTS_QUERY = `
query SyncGovernmentDepartments {
  _allGovernmentDepartmentsMeta {
    count
  }
  allGovernmentDepartments(orderBy: [position_ASC], first: ${DIRECTORY_PAGE_SIZE}) {
    position
    slug
    officeName
    address
    trunkline
    email
    website
    secretary
    undersecretaries
    attachedAgencies
    details
  }
}
`;

export const EXECUTIVE_QUERY = `
query SyncExecutiveOffices {
  _allExecutiveOfficesMeta {
    count
  }
  allExecutiveOffices(orderBy: [position_ASC], first: ${DIRECTORY_PAGE_SIZE}) {
    position
    slug
    office
    address
    phone
    trunkline
    email
    website
    officials
    bureaus
    attachedAgencies
  }
}
`;

/**
 * A THIRD independent operation — not merged into either of the two above.
 * Same rule as Departments vs Executive: a combined query would make
 * `--only=constitutional` fail on invalid Departments data and vice versa.
 * Its own `_allConstitutionalOfficesMeta` is declared before its own
 * collection field, per the per-operation resolver-ordering rule in
 * ./categories.ts.
 *
 * `regionalOffices`, `publicAssistance` and `additionalDetails` are JsonField
 * blobs carried through verbatim; `additionalDetails` holds the two local
 * fields with no top-level CMS counterpart (`region`, `satellite_office`).
 */
export const CONSTITUTIONAL_QUERY = `
query SyncConstitutionalOffices {
  _allConstitutionalOfficesMeta {
    count
  }
  allConstitutionalOffices(orderBy: [position_ASC], first: ${CONSTITUTIONAL_PAGE_SIZE}) {
    position
    slug
    name
    officeType
    description
    address
    phone
    trunklines
    website
    email
    officials
    regionalOffices
    publicAssistance
    additionalDetails
  }
}
`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const fail = (message: string): never => {
  throw new Error(`[sync:directory] ${message}`);
};

/**
 * `position` is `IntType` in the CDA — nullable, and NOT schema-enforced
 * unique. Verified 2026-09-08. Nothing downstream consumes it: it is dropped
 * from the generated output, and record order itself is inert because
 * DirectoryResults sorts by name and DepartmentsSidebar sorts by office_name.
 * So a null or a tie is accepted here and resolved deterministically at sort
 * time — unlike services.ts, where page order IS derived from position and a
 * duplicate is therefore fatal.
 */
const PositionSchema = z.number().int().nullable();

const RawDepartmentSchema = z.object({
  position: PositionSchema,
  slug: z.string(),
  officeName: z.string(),
  address: z.string().nullable(),
  trunkline: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  secretary: z.unknown(),
  undersecretaries: z.unknown(),
  attachedAgencies: z.unknown(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

const RawExecutiveSchema = z.object({
  position: PositionSchema,
  slug: z.string(),
  office: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  trunkline: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  officials: z.unknown(),
  bureaus: z.unknown(),
  attachedAgencies: z.unknown(),
});

/**
 * `name` and `role` are REQUIRED and non-blank, unlike every other nested
 * blob in this module, because src/pages/government/constitutional/data.ts
 * parses the generated file with ConstitutionalOfficeSchema at module scope.
 * A missing name or role there throws at import time and takes down the whole
 * /government/constitutional route tree — so it fails the sync instead.
 *
 * `.trim().min(1)`, NOT `.min(1)`: the latter accepts "   ", which renders as
 * a blank cell in OfficialsTable and a blank sidebar row while every
 * count-based gate still reports a healthy 229. `.trim()` is a zod TRANSFORM,
 * so parsed values are trimmed and the trimmed value is what reaches the
 * generated file — a deliberate normalization, and a no-op on today's data
 * (zero of the 287 live rows carry surrounding whitespace; pinned by the
 * round-trip test in Task 3).
 *
 * `.catchall` keeps `office`, `contact` and `email` untouched.
 */
const RawOfficialSchema = z
  .object({
    name: z.string().trim().min(1),
    role: z.string().trim().min(1),
  })
  .catchall(z.unknown());

/**
 * The ONLY keys allowed inside `additionalDetails`. The blob is spread
 * verbatim onto the top level of the generated record, so without an
 * allowlist any key the CMS gains would land in constitutional.json
 * unreviewed. These two are the local fields with no top-level CMS
 * counterpart; the live dataset carries no others (verified 2026-09-08).
 *
 * Strictly stronger than applyFieldMap's collision check, which only catches
 * a detail key shadowing a MAPPED field — it cannot see `position`, which is
 * never a mapped output key but must never appear as content either.
 */
export const CONSTITUTIONAL_DETAIL_KEYS = [
  'region',
  'satellite_office',
] as const;

/**
 * Exported and called from BOTH parseConstitutionalResponse and
 * shapeConstitutional: the parse gate is the one that fails a real sync, and
 * the shaper gate keeps a direct shapeConstitutional() call from producing an
 * unreviewed key. Reports every offending key, not just the first.
 */
export function assertAllowedDetailKeys(
  slug: string,
  details: Record<string, unknown> | null
): void {
  if (!details) return;
  const allowed = new Set<string>(CONSTITUTIONAL_DETAIL_KEYS);
  const disallowed = Object.keys(details).filter(k => !allowed.has(k));
  if (disallowed.length > 0) {
    fail(
      `constitutional offices record "${slug}" has additionalDetails key(s) ` +
        `${disallowed.join(', ')}, which are not in the allowlist ` +
        `(${CONSTITUTIONAL_DETAIL_KEYS.join(', ')}). additionalDetails is spread ` +
        'verbatim onto the generated record, so a new key must be reviewed and ' +
        'added here deliberately, never adopted silently.'
    );
  }
}

/**
 * Constitutional-specific, deliberately NOT the shared PositionSchema.
 *
 * The shared one is nullable and tolerates duplicates because nothing
 * downstream consumes Departments' or Executive's record order. Constitutional
 * order IS consumed: ConstitutionalSidebar.tsx renders the five offices in
 * array order and generate-sitemap.js emits detail URLs in array order, and
 * `position` is the only thing that reproduces it. A null would sink the
 * record to the end of the file via sortForOutput's null-last rule; a
 * duplicate would hand the tie to the slug tie-breaker instead of editorial
 * intent. Either silently reorders the sidebar with no count changing.
 *
 * Uniqueness is enforced in parseConstitutionalResponse, which can see the
 * whole collection. Contiguity is NOT required — a gap is the normal result of
 * retiring a record in the CMS.
 */
const ConstitutionalPositionSchema = z.number().int();

/**
 * `trunklines` is a JsonField and is genuinely POLYMORPHIC in the live data:
 * an array of strings for civil-service-commission-csc, a bare string for
 * commission-on-audit-coa and office-of-the-ombudsman. Verified 2026-09-08.
 * The union is declared here so a third shape (an object, a number) fails
 * closed instead of reaching the shaper; normalization happens in
 * shapeConstitutional, not here.
 */
const RawConstitutionalSchema = z.object({
  position: ConstitutionalPositionSchema,
  slug: z.string(),
  name: z.string(),
  officeType: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  trunklines: z.union([z.array(z.string()), z.string()]).nullable(),
  website: z.string().nullable(),
  email: z.string().nullable(),
  officials: z.array(RawOfficialSchema),
  regionalOffices: z.unknown(),
  publicAssistance: z.unknown(),
  additionalDetails: z.record(z.string(), z.unknown()).nullable(),
});

const RawConstitutionalsSchema = z.object({
  _allConstitutionalOfficesMeta: z.object({ count: z.number() }),
  allConstitutionalOffices: z.array(RawConstitutionalSchema),
});

export type RawConstitutional = z.infer<typeof RawConstitutionalSchema>;
export type RawConstitutionals = z.infer<typeof RawConstitutionalsSchema>;

const RawDepartmentsSchema = z.object({
  _allGovernmentDepartmentsMeta: z.object({ count: z.number() }),
  allGovernmentDepartments: z.array(RawDepartmentSchema),
});

const RawExecutivesSchema = z.object({
  _allExecutiveOfficesMeta: z.object({ count: z.number() }),
  allExecutiveOffices: z.array(RawExecutiveSchema),
});

export type RawDepartment = z.infer<typeof RawDepartmentSchema>;
export type RawExecutive = z.infer<typeof RawExecutiveSchema>;
export type RawDepartments = z.infer<typeof RawDepartmentsSchema>;
export type RawExecutives = z.infer<typeof RawExecutivesSchema>;

/**
 * Every gate below fails the WHOLE sync. A record is never dropped: a
 * silently short directory file, once committed, is indistinguishable from a
 * correct one forever after.
 *
 * Deliberately NOT gated: duplicate or null `position`. See PositionSchema.
 */
function assertCollection(
  label: string,
  records: { slug: string; name: string }[],
  metaCount: number,
  pageSize: number = DIRECTORY_PAGE_SIZE
): void {
  const returned = records.length;
  if (returned !== metaCount) {
    fail(
      `TalaCMS returned an incomplete ${label} list (returned ${returned}, meta reported ${metaCount})`
    );
  }
  if (metaCount === 0) fail(`TalaCMS returned no ${label}`);
  if (returned >= pageSize) {
    fail(
      `${label} count reached the page-size ceiling of ${pageSize}; raise the ceiling for this model and re-run`
    );
  }

  const slugs = new Set<string>();
  for (const r of records) {
    if (slugs.has(r.slug)) {
      fail(
        `duplicate slug "${r.slug}" in ${label} — slugs address detail routes and sidebar links and must be unique`
      );
    }
    slugs.add(r.slug);
    if (!SLUG_PATTERN.test(r.slug)) {
      fail(`${label} record has slug "${r.slug}", which is not a valid slug`);
    }
    if (r.name.trim() === '') {
      fail(`${label} record "${r.slug}" has a blank display name`);
    }
  }
}

function parseOrFail<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `${i.path.join('.') || '/'} ${i.message}`)
      .join('; ');
    fail(`TalaCMS returned an unexpected ${label} shape: ${detail}`);
  }
  return parsed.data!;
}

export function parseDepartmentsResponse(value: unknown): RawDepartments {
  const raw = parseOrFail(
    RawDepartmentsSchema,
    value,
    'government departments'
  );
  assertCollection(
    'government departments',
    raw.allGovernmentDepartments.map(r => ({
      slug: r.slug,
      name: r.officeName,
    })),
    raw._allGovernmentDepartmentsMeta.count
  );
  return raw;
}

export function parseExecutiveResponse(value: unknown): RawExecutives {
  const raw = parseOrFail(RawExecutivesSchema, value, 'executive offices');
  assertCollection(
    'executive offices',
    raw.allExecutiveOffices.map(r => ({ slug: r.slug, name: r.office })),
    raw._allExecutiveOfficesMeta.count
  );
  return raw;
}

export function parseConstitutionalResponse(
  value: unknown
): RawConstitutionals {
  const raw = parseOrFail(
    RawConstitutionalsSchema,
    value,
    'constitutional offices'
  );
  assertCollection(
    'constitutional offices',
    raw.allConstitutionalOffices.map(r => ({ slug: r.slug, name: r.name })),
    raw._allConstitutionalOfficesMeta.count,
    CONSTITUTIONAL_PAGE_SIZE
  );
  // None of the three below are folded into assertCollection: all are
  // Constitutional-specific, and the shared helper is used unchanged by
  // Departments and Executive, whose rules are deliberately looser.
  const positions = new Map<number, string>();
  for (const r of raw.allConstitutionalOffices) {
    // /government/constitutional/goccs and /sucs both select on office_type,
    // so a blank value silently drops the record from BOTH pages while every
    // count still looks healthy.
    if (r.officeType.trim() === '') {
      fail(
        `constitutional offices record "${r.slug}" has a blank office_type — ` +
          'the GOCC and SUC pages filter on it, so a blank value would silently ' +
          'drop the record from both'
      );
    }

    // Uniqueness needs the whole collection, so it cannot live in the schema.
    // Contiguity is deliberately NOT checked — gaps are normal.
    const seen = positions.get(r.position);
    if (seen !== undefined) {
      fail(
        `constitutional offices records "${seen}" and "${r.slug}" share ` +
          `duplicate position ${r.position}. Record order drives the sidebar ` +
          'and the sitemap, so a tie would be resolved by the slug tie-breaker ' +
          'rather than by editorial intent.'
      );
    }
    positions.set(r.position, r.slug);

    assertAllowedDetailKeys(r.slug, r.additionalDetails);
  }
  return raw;
}

export async function fetchDepartments(
  client: TalaCmsClient
): Promise<RawDepartments> {
  return parseDepartmentsResponse(await client<unknown>(DEPARTMENTS_QUERY));
}

export async function fetchExecutive(
  client: TalaCmsClient
): Promise<RawExecutives> {
  return parseExecutiveResponse(await client<unknown>(EXECUTIVE_QUERY));
}

export async function fetchConstitutional(
  client: TalaCmsClient
): Promise<RawConstitutionals> {
  return parseConstitutionalResponse(
    await client<unknown>(CONSTITUTIONAL_QUERY)
  );
}

/**
 * Explicit per-model field maps. NOT a generic camelCase→snake_case rule:
 * `attachedAgencies` maps to `attached_agencies` on departments and to
 * `attached_agency` (singular) on executive. Verified against the committed
 * files. A generic rule would silently emit the wrong key, and
 * [department].tsx renders leftover top-level keys as visible <h2> sections,
 * so a wrong key is a visible defect, not a cosmetic one.
 *
 * Order matters: each array IS the emitted key order for its known fields.
 */
const DEPARTMENT_FIELDS = [
  ['slug', 'slug'],
  ['officeName', 'office_name'],
  ['address', 'address'],
  ['trunkline', 'trunkline'],
  ['email', 'email'],
  ['website', 'website'],
  ['secretary', 'secretary'],
  ['undersecretaries', 'undersecretaries'],
] as const;

/**
 * Lifted out of `details` and emitted immediately after `undersecretaries`.
 * Measured against the committed file: hoisting this one key raises exact
 * key-order agreement from 1/23 to 14/23. See "Decisions taken" — Option 1.
 */
const DEPARTMENT_HOISTED_DETAILS = ['assistant_secretaries'] as const;

/** Emitted after the `details` spread — all 13 committed records end with it. */
const DEPARTMENT_TRAILING = [
  ['attachedAgencies', 'attached_agencies'],
] as const;

const EXECUTIVE_FIELDS = [
  ['slug', 'slug'],
  ['office', 'office'],
  ['address', 'address'],
  ['phone', 'phone'],
  ['trunkline', 'trunkline'],
  ['email', 'email'],
  ['website', 'website'],
  ['officials', 'officials'],
  ['bureaus', 'bureaus'],
  ['attachedAgencies', 'attached_agency'],
] as const;

/**
 * Deterministic output order: non-null `position` ascending, null `position`
 * last, `slug` ascending as the tie-breaker. `position` is nullable and not
 * unique in the CDA, and nothing downstream reads record order — this exists
 * to keep the generated file stable and diff-clean, not to drive any UI.
 *
 * Pure: returns a new array, never mutates its input.
 */
export function sortForOutput<
  T extends { position: number | null; slug: string },
>(records: T[]): T[] {
  return [...records].sort((a, b) => {
    if (a.position === null && b.position === null) {
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    }
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    if (a.position !== b.position) return a.position - b.position;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
}

type FieldMap = readonly (readonly [string, string])[];

/**
 * Builds one output record. `position` is deliberately never emitted — it is
 * a CMS ordering handle, not content, and no committed record carries it.
 * A null CMS scalar is OMITTED rather than emitted as null: the committed
 * files express "no value" by absence, and [department].tsx keys its
 * leftover-section rendering off key presence.
 */
function applyFieldMap(
  raw: Record<string, unknown>,
  fields: FieldMap,
  options: {
    hoist?: readonly string[];
    details?: Record<string, unknown> | null;
    trailing?: FieldMap;
  } = {}
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const mapped = new Set<string>([
    ...fields.map(([, local]) => local),
    ...(options.trailing ?? []).map(([, local]) => local),
  ]);

  const details = { ...(options.details ?? {}) };
  for (const key of Object.keys(details)) {
    if (mapped.has(key)) {
      fail(
        `record "${String(raw.slug)}" has a details key "${key}" that collides with a mapped top-level field`
      );
    }
  }

  for (const [cms, local] of fields) {
    if (raw[cms] !== null && raw[cms] !== undefined) out[local] = raw[cms];
  }

  // Same null-vs-absent rule as the mapped scalars above: a null or undefined
  // value is OMITTED, never emitted. Applies to hoisted and ordinary detail
  // keys alike. Falsy-but-present values ([], "", 0, false) are preserved.
  for (const key of options.hoist ?? []) {
    if (key in details) {
      if (details[key] !== null && details[key] !== undefined)
        out[key] = details[key];
      delete details[key];
    }
  }

  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined) out[key] = value;
  }

  for (const [cms, local] of options.trailing ?? []) {
    if (raw[cms] !== null && raw[cms] !== undefined) out[local] = raw[cms];
  }

  return out;
}

export function shapeDepartments(
  records: RawDepartment[]
): Record<string, unknown>[] {
  return sortForOutput(records).map(r =>
    applyFieldMap(r as unknown as Record<string, unknown>, DEPARTMENT_FIELDS, {
      hoist: DEPARTMENT_HOISTED_DETAILS,
      details: r.details,
      trailing: DEPARTMENT_TRAILING,
    })
  );
}

export function shapeExecutive(
  records: RawExecutive[]
): Record<string, unknown>[] {
  return sortForOutput(records).map(r =>
    applyFieldMap(r as unknown as Record<string, unknown>, EXECUTIVE_FIELDS)
  );
}

export function buildDepartmentsCandidate(raw: RawDepartments): Candidate {
  return {
    path: 'src/data/directory/departments.json',
    schemaPath: 'src/data/directory/schema/departments.schema.json',
    data: shapeDepartments(raw.allGovernmentDepartments),
  };
}

export function buildExecutiveCandidate(raw: RawExecutives): Candidate {
  return {
    path: 'src/data/directory/executive.json',
    schemaPath: 'src/data/directory/schema/executive.schema.json',
    data: shapeExecutive(raw.allExecutiveOffices),
  };
}

/**
 * Meilisearch indexes every document into ONE index keyed by `slug`
 * (index_meilisearch.cjs: createIndex(..., { primaryKey: 'slug' })), so a slug
 * shared between a department and an executive office means one document
 * silently overwrites the other and one office becomes unsearchable.
 *
 * Scope is deliberately limited to these two models — the ONLY two this branch
 * makes CMS-owned. An index-wide gate is NOT applied here: 289 slug collisions
 * already exist in that index (directory/*.json vs the derived websites.json),
 * so an index-wide gate would fail on pre-existing data and would require
 * changing Government Websites, which is out of scope. See Risks.
 *
 * This is the FAST LOCAL gate, not the guarantee. It is applied only when BOTH
 * datasets are selected — per sync-talacms.ts's run-mode matrix, "a gate whose
 * inputs a mode does not have is not applied", and an isolated `--only=` run
 * cannot see the other side without breaking query isolation. Its value is
 * failing before any file is written.
 *
 * The AUTHORITATIVE gate is assertUniqueDirectorySlugs in
 * scripts/index_meilisearch.cjs, which runs over the complete loaded directory
 * snapshot in preflight and therefore also catches a collision that
 * `--only=departments` introduced against the committed executive.json.
 */
export function assertNoCrossModelSlugCollision(
  departments: Candidate,
  executive: Candidate
): void {
  const executiveSlugs = new Set(
    (executive.data as { slug: string }[]).map(r => r.slug)
  );
  const collisions = (departments.data as { slug: string }[])
    .map(r => r.slug)
    .filter(slug => executiveSlugs.has(slug));

  if (collisions.length > 0) {
    fail(
      `${collisions.length} slug(s) appear in BOTH government departments and executive offices: ` +
        `${collisions.join(', ')}. Meilisearch keys its single index by slug, so these records ` +
        'would overwrite each other and one office would become unsearchable.'
    );
  }
}
