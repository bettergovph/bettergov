import { z } from 'zod';
import type { TalaCmsClient } from './client';

/**
 * Explicit ceiling on how many records we ask TalaCMS for in one request.
 * Today's real counts are 23 and 38. Reaching the ceiling fails rather than
 * silently serving an undercount — raise this constant if that ever fires.
 * The CDA caps `first` at 500; that cap is deliberately not approached here
 * and pagination is out of scope for this branch.
 */
export const DIRECTORY_PAGE_SIZE = 100;

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
  metaCount: number
): void {
  const returned = records.length;
  if (returned !== metaCount) {
    fail(
      `TalaCMS returned an incomplete ${label} list (returned ${returned}, meta reported ${metaCount})`
    );
  }
  if (metaCount === 0) fail(`TalaCMS returned no ${label}`);
  if (returned >= DIRECTORY_PAGE_SIZE) {
    fail(
      `${label} count reached the page-size ceiling of ${DIRECTORY_PAGE_SIZE}; raise DIRECTORY_PAGE_SIZE and re-run`
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
