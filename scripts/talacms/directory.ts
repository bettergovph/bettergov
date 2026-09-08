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
