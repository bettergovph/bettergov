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
 * Legislative has exactly TWO chambers. 50 is a deliberately loose ceiling
 * for a collection with no realistic growth path — it exists to fail loudly
 * on a runaway response, not to bound a real dataset.
 */
export const LEGISLATIVE_PAGE_SIZE = 50;

/**
 * Ceilings for the two NESTED relations. These are NOT `first:` arguments —
 * the reverse relations take none, and the CDA does not enforce `first`
 * anyway (`first: 600` returned all 255 records with no error, verified
 * 2026-09-09). They are asserted against the top-level `_all*Meta` counts, so
 * a relation that silently truncates fails on the reconciliation gate and an
 * unexpectedly large dataset fails here with a clearer message.
 *
 * Today: 254 house members (255 in TalaCMS until the duplicate Speaker record
 * is deleted) and 61 party-list representatives. The House has ~316 seats
 * total, so these leave real headroom without being meaningless.
 */
export const HOUSE_MEMBERS_CEILING = 400;
export const PARTY_LIST_CEILING = 150;

/**
 * A FOURTH independent operation. Same isolation rule as the three above: a
 * combined query would make `--only=legislative` fail on invalid Departments
 * data and vice versa.
 *
 * All THREE `_all*Meta` fields are declared before `allLegislativeChambers`.
 * This is not stylistic — the CDA returns `count: 0` for any `_all*Meta`
 * field that follows a collection field anywhere in the same operation (see
 * ./categories.ts). Verified working in exactly this configuration against
 * the live CDA on 2026-09-09: 2 / 255 / 61. Do not reorder.
 *
 * `houseMembers` and `partyListRepresentatives` are REVERSE relations. They
 * accept no `first` and no `orderBy`; the CDA resolved all 255 and all 61 in
 * one round trip, in `position` order. We do not rely on that order — the
 * shaper sorts by `position` itself, which is why `position` is selected on
 * both — but we DO rely on completeness, which is why the response carries
 * the two top-level meta counts to reconcile against.
 *
 * Members cannot be fetched per-chamber: neither HouseMemberModelFilter nor
 * PartyListRepresentativeModelFilter exposes a `chamber` field. The nested
 * relation is the only chamber-scoped access there is.
 */
export const LEGISLATIVE_QUERY = `
query SyncLegislativeChambers {
  _allLegislativeChambersMeta {
    count
  }
  _allHouseMembersMeta {
    count
  }
  _allPartyListRepresentativesMeta {
    count
  }
  allLegislativeChambers(orderBy: [position_ASC], first: ${LEGISLATIVE_PAGE_SIZE}) {
    position
    slug
    branch
    chamber
    address
    trunkline
    website
    officials
    permanentCommittees
    houseLeaders
    houseCommittees
    specialCommittees
    secretariatOfficials
    houseMembers {
      position
      name
      provinceCity
      district
      contact
    }
    partyListRepresentatives {
      position
      name
      partyList
      contact
    }
  }
}
`;

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

/**
 * Chamber order IS consumed — it is the generated file's record order and
 * generate-sitemap.js emits detail URLs in that order — so `position` is
 * required and non-null here, the same rule Constitutional uses and for the
 * same reason. Uniqueness needs the whole collection and is enforced in
 * parseLegislativeResponse.
 */
const LegislativePositionSchema = z.number().int();

/**
 * `.trim().min(1)` on every field the two member pages actually render.
 * `.min(1)` alone would accept "   ", which renders as a blank row, a blank
 * Flag chip, or a blank entry in the province/city facet dropdown while every
 * count still reports healthy. `.trim()` is a zod TRANSFORM, so the trimmed
 * value is what reaches the generated file — a deliberate normalization, and
 * a no-op on today's data (pinned by the round-trip test in Task 3).
 *
 * `contact` is nullable: house-members.tsx and party-list-members.tsx both
 * render it inside `{m.contact && ...}`.
 */
const RawHouseMemberSchema = z.object({
  position: LegislativePositionSchema,
  name: z.string().trim().min(1),
  provinceCity: z.string().trim().min(1),
  district: z.string().trim().min(1),
  contact: z.string().nullable(),
});

const RawPartyListRepresentativeSchema = z.object({
  position: LegislativePositionSchema,
  name: z.string().trim().min(1),
  partyList: z.string().trim().min(1),
  contact: z.string().nullable(),
});

/**
 * The two chambers populate DISJOINT field sets — the Senate carries
 * `officials` and `permanentCommittees` and no house_* fields; the House
 * carries the reverse. Every blob is therefore nullable, and no unconditional
 * "must be present" gate may be added: it would fail on the other chamber.
 * What IS gated, in parseLegislativeResponse, is that each discriminator
 * matches exactly one chamber and that the House carries every member.
 *
 * The two relations are non-null LISTS in the schema (`[HouseMemberRecord!]!`)
 * — an empty array, not null, is how "no members" arrives.
 */
const RawLegislativeSchema = z.object({
  position: LegislativePositionSchema,
  slug: z.string(),
  branch: z.string().nullable(),
  chamber: z.string(),
  address: z.string().nullable(),
  trunkline: z.string().nullable(),
  website: z.string().nullable(),
  officials: z.unknown(),
  permanentCommittees: z.unknown(),
  houseLeaders: z.unknown(),
  houseCommittees: z.unknown(),
  specialCommittees: z.unknown(),
  secretariatOfficials: z.unknown(),
  houseMembers: z.array(RawHouseMemberSchema),
  partyListRepresentatives: z.array(RawPartyListRepresentativeSchema),
});

const RawLegislativesSchema = z.object({
  _allLegislativeChambersMeta: z.object({ count: z.number() }),
  _allHouseMembersMeta: z.object({ count: z.number() }),
  _allPartyListRepresentativesMeta: z.object({ count: z.number() }),
  allLegislativeChambers: z.array(RawLegislativeSchema),
});

export type RawHouseMember = z.infer<typeof RawHouseMemberSchema>;
export type RawPartyListRepresentative = z.infer<
  typeof RawPartyListRepresentativeSchema
>;
export type RawLegislative = z.infer<typeof RawLegislativeSchema>;
export type RawLegislatives = z.infer<typeof RawLegislativesSchema>;

/**
 * The substrings three page components select on:
 *   senate-committees.tsx   -> chamber.includes('Senate')
 *   house-members.tsx       -> chamber.includes('House of Representatives')
 *   party-list-members.tsx  -> chamber.includes('House of Representatives')
 * A CMS rename silently empties those pages with no count changing, which is
 * why this is gated rather than trusted.
 */
const SENATE_DISCRIMINATOR = 'Senate';
const HOUSE_DISCRIMINATOR = 'House of Representatives';

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
 * Members carry no `slug` in the CDA, so identity is the tuple the UI shows.
 * A duplicate is a real defect: house-members.tsx renders one row per record
 * and prints `{results.length} of {members.length}`, so a duplicate is a
 * visible repeated row and an inflated count.
 */
const houseMemberIdentity = (m: RawHouseMember) =>
  `${m.name} ${m.provinceCity} ${m.district}`;

const partyListIdentity = (m: RawPartyListRepresentative) =>
  `${m.name} ${m.partyList}`;

function assertMemberPositionsUnique(
  label: string,
  slug: string,
  members: { position: number }[]
): void {
  const seen = new Set<number>();
  for (const m of members) {
    if (seen.has(m.position)) {
      fail(
        `chamber "${slug}" has two ${label} sharing duplicate position ` +
          `${m.position}. Member order is the generated file's array order, so ` +
          'a tie would be resolved arbitrarily rather than by editorial intent.'
      );
    }
    seen.add(m.position);
  }
}

export function parseLegislativeResponse(value: unknown): RawLegislatives {
  const raw = parseOrFail(RawLegislativesSchema, value, 'legislative chambers');
  const chambers = raw.allLegislativeChambers;

  assertCollection(
    'legislative chambers',
    chambers.map(r => ({ slug: r.slug, name: r.chamber })),
    raw._allLegislativeChambersMeta.count,
    LEGISLATIVE_PAGE_SIZE
  );

  // Chamber position: unique, so record order is editorial rather than a
  // slug-tie-break accident. Gaps are fine.
  const positions = new Map<number, string>();
  for (const r of chambers) {
    const seen = positions.get(r.position);
    if (seen !== undefined) {
      fail(
        `legislative chambers "${seen}" and "${r.slug}" share duplicate ` +
          `position ${r.position}. Record order drives the generated file and ` +
          'the sitemap, so a tie would be resolved by the slug tie-breaker ' +
          'rather than by editorial intent.'
      );
    }
    positions.set(r.position, r.slug);
  }

  // Discriminator gate — see SENATE_DISCRIMINATOR.
  const matching = (needle: string) =>
    chambers.filter(r => r.chamber.includes(needle));
  for (const needle of [SENATE_DISCRIMINATOR, HOUSE_DISCRIMINATOR]) {
    const hits = matching(needle);
    if (hits.length !== 1) {
      fail(
        `expected exactly one chamber whose name contains "${needle}", found ` +
          `${hits.length} (${chambers.map(r => `"${r.chamber}"`).join(', ')}). ` +
          'senate-committees.tsx, house-members.tsx and party-list-members.tsx ' +
          'all select their chamber by that substring, so this would silently ' +
          'empty a page with no count changing.'
      );
    }
  }
  const houseChamber = matching(HOUSE_DISCRIMINATOR)[0];

  // Reconcile the nested relations against the top-level meta counts. The
  // relations take no `first` and the CDA does not enforce one, so this is
  // the ONLY thing standing between a truncated relation and a short file.
  const nestedHouseMembers = chambers.reduce(
    (n, r) => n + r.houseMembers.length,
    0
  );
  const nestedPartyList = chambers.reduce(
    (n, r) => n + r.partyListRepresentatives.length,
    0
  );

  const reconcile = (
    label: string,
    nested: number,
    metaCount: number,
    ceiling: number
  ) => {
    if (metaCount === 0) fail(`TalaCMS returned no ${label}`);
    if (nested !== metaCount) {
      fail(
        `TalaCMS returned an incomplete ${label} list: the chamber relations ` +
          `carry ${nested} nested record(s), meta reported ${metaCount}. The ` +
          'reverse relation is unpaginated and the CDA does not enforce a ' +
          'result cap, so a mismatch means records were lost in transit — ' +
          'never that the dataset shrank.'
      );
    }
    if (nested >= ceiling) {
      fail(
        `${label} count reached the ceiling of ${ceiling}; raise the ceiling ` +
          'for this relation and re-run'
      );
    }
  };

  reconcile(
    'house members',
    nestedHouseMembers,
    raw._allHouseMembersMeta.count,
    HOUSE_MEMBERS_CEILING
  );
  reconcile(
    'party-list representatives',
    nestedPartyList,
    raw._allPartyListRepresentativesMeta.count,
    PARTY_LIST_CEILING
  );

  // Reconciliation alone still passes if members were re-linked to the wrong
  // chamber: the totals match and /house-members renders empty. Pin the
  // chamber the two member pages actually read.
  if (houseChamber.houseMembers.length !== nestedHouseMembers) {
    fail(
      `the "House of Representatives" chamber ("${houseChamber.slug}") ` +
        `carries ${houseChamber.houseMembers.length} of ${nestedHouseMembers} ` +
        'house members. house-members.tsx reads that chamber and no other, so ' +
        'the rest would vanish from the site.'
    );
  }
  if (houseChamber.partyListRepresentatives.length !== nestedPartyList) {
    fail(
      `the "House of Representatives" chamber ("${houseChamber.slug}") ` +
        `carries ${houseChamber.partyListRepresentatives.length} of ` +
        `${nestedPartyList} party-list representatives. ` +
        'party-list-members.tsx reads that chamber and no other, so the rest ' +
        'would vanish from the site.'
    );
  }

  // Duplicate members. Members have no slug, so identity is the tuple the UI
  // renders. NOT de-duplicated here — a duplicate is a CMS data defect and
  // must be fixed there, or it is hidden forever.
  for (const r of chambers) {
    assertMemberPositionsUnique('house members', r.slug, r.houseMembers);
    assertMemberPositionsUnique(
      'party-list representatives',
      r.slug,
      r.partyListRepresentatives
    );

    const seenMembers = new Set<string>();
    for (const m of r.houseMembers) {
      const id = houseMemberIdentity(m);
      if (seenMembers.has(id)) {
        fail(
          `duplicate house member "${m.name}" (${m.provinceCity}, ` +
            `${m.district}) in chamber "${r.slug}". Members carry no slug, so ` +
            'identity is name + province/city + district. house-members.tsx ' +
            'renders one row per record, so this would show a repeated row and ' +
            'an inflated count. Delete the duplicate record in TalaCMS — the ' +
            'sync will not de-duplicate it, because that would hide the defect ' +
            'permanently.'
        );
      }
      seenMembers.add(id);
    }

    const seenReps = new Set<string>();
    for (const m of r.partyListRepresentatives) {
      const id = partyListIdentity(m);
      if (seenReps.has(id)) {
        fail(
          `duplicate party-list representative "${m.name}" (${m.partyList}) ` +
            `in chamber "${r.slug}". Members carry no slug, so identity is ` +
            'name + party-list. Delete the duplicate record in TalaCMS — the ' +
            'sync will not de-duplicate it, because that would hide the defect ' +
            'permanently.'
        );
      }
      seenReps.add(id);
    }
  }

  return raw;
}

export async function fetchLegislative(
  client: TalaCmsClient
): Promise<RawLegislatives> {
  return parseLegislativeResponse(await client<unknown>(LEGISLATIVE_QUERY));
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
    /**
     * Opt-in, Constitutional-only. The CMS carries `""` for three scalars on
     * one SUC record where the committed file simply omits the key; without
     * this the generated file would differ from its own contract for no
     * visible benefit. OFF by default, so Departments and Executive keep
     * preserving falsy-but-present values ([], "", 0, false) exactly as
     * before.
     */
    omitEmptyStrings?: boolean;
  } = {}
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const present = (value: unknown) =>
    value !== null &&
    value !== undefined &&
    !(options.omitEmptyStrings === true && value === '');

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
    if (present(raw[cms])) out[local] = raw[cms];
  }

  // Same null-vs-absent rule as the mapped scalars above: a null or undefined
  // value is OMITTED, never emitted. Applies to hoisted and ordinary detail
  // keys alike. Falsy-but-present values ([], "", 0, false) are preserved
  // unless `omitEmptyStrings` is set, which drops "" as well.
  for (const key of options.hoist ?? []) {
    if (key in details) {
      if (present(details[key])) out[key] = details[key];
      delete details[key];
    }
  }

  for (const [key, value] of Object.entries(details)) {
    if (present(value)) out[key] = value;
  }

  for (const [cms, local] of options.trailing ?? []) {
    if (present(raw[cms])) out[local] = raw[cms];
  }

  return out;
}

/**
 * Order matters: this array IS the emitted key order. Measured against the
 * committed file, `email` after `officials` — not after `phone`, where the
 * CMS lists it — raises exact key-order agreement from 26/229 to 103/229.
 * The committed file's own key order is internally inconsistent (`email`
 * precedes `website` in some records and follows `officials` in others), so
 * exact agreement is unreachable; the residual difference is key order only,
 * proven content-identical by the deep key-sorted round-trip test.
 *
 * `additionalDetails` is spread after these, via applyFieldMap's `details`
 * option — it carries `region` and `satellite_office`.
 */
const CONSTITUTIONAL_FIELDS = [
  ['slug', 'slug'],
  ['officeType', 'office_type'],
  ['name', 'name'],
  ['description', 'description'],
  ['address', 'address'],
  ['phone', 'phone'],
  ['trunklines', 'trunklines'],
  ['website', 'website'],
  ['officials', 'officials'],
  ['email', 'email'],
  ['regionalOffices', 'regional_offices'],
  ['publicAssistance', 'public_assistance'],
] as const;

/**
 * ONE ordered map covering BOTH chambers. Order matters: this array IS the
 * emitted key order. Because applyFieldMap omits absent keys, the Senate
 * (no house_* fields) and the House (no officials/permanent_committees) each
 * fall out of this single order exactly as committed — measured 2/2 exact
 * key-order agreement on 2026-09-09, which is why the Task 3 test asserts
 * hard equality rather than Constitutional's "at or above baseline".
 *
 * `houseMembers` / `partyListRepresentatives` are relations, not scalars;
 * shapeLegislative pre-projects them onto the raw record before this map runs.
 */
const LEGISLATIVE_FIELDS = [
  ['slug', 'slug'],
  ['branch', 'branch'],
  ['chamber', 'chamber'],
  ['address', 'address'],
  ['trunkline', 'trunkline'],
  ['website', 'website'],
  ['officials', 'officials'],
  ['permanentCommittees', 'permanent_committees'],
  ['houseLeaders', 'house_leaders'],
  ['houseMembers', 'house_members'],
  ['partyListRepresentatives', 'party_list_representatives'],
  ['houseCommittees', 'house_committees'],
  ['specialCommittees', 'special_committees'],
  ['secretariatOfficials', 'secretariat_officials'],
] as const;

const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position;

/**
 * Returns NULL for an empty relation, never `[]`.
 *
 * applyFieldMap treats `[]` as a present value and would emit
 * `"house_members": []` onto the Senate record, where the committed file has
 * no such key at all. Returning null routes it through the same
 * omit-when-absent rule as every other field.
 *
 * A null contact is omitted rather than emitted, matching the committed file
 * and the `{m.contact && ...}` render in both member pages.
 *
 * Key order inside each member object is the committed order:
 * province_city, name, district, contact.
 */
export function projectHouseMembers(
  members: RawHouseMember[]
): Record<string, unknown>[] | null {
  if (members.length === 0) return null;
  return [...members].sort(byPosition).map(m => {
    const out: Record<string, unknown> = {
      province_city: m.provinceCity,
      name: m.name,
      district: m.district,
    };
    if (m.contact !== null) out.contact = m.contact;
    return out;
  });
}

/** Committed member key order: party_list, name, contact. */
export function projectPartyList(
  members: RawPartyListRepresentative[]
): Record<string, unknown>[] | null {
  if (members.length === 0) return null;
  return [...members].sort(byPosition).map(m => {
    const out: Record<string, unknown> = {
      party_list: m.partyList,
      name: m.name,
    };
    if (m.contact !== null) out.contact = m.contact;
    return out;
  });
}

export function shapeLegislative(
  records: RawLegislative[]
): Record<string, unknown>[] {
  return sortForOutput(records).map(r =>
    applyFieldMap(
      {
        ...r,
        houseMembers: projectHouseMembers(r.houseMembers),
        partyListRepresentatives: projectPartyList(r.partyListRepresentatives),
      } as unknown as Record<string, unknown>,
      LEGISLATIVE_FIELDS
    )
  );
}

export function buildLegislativeCandidate(raw: RawLegislatives): Candidate {
  return {
    path: 'src/data/directory/legislative.json',
    schemaPath: 'src/data/directory/schema/legislative.schema.json',
    data: shapeLegislative(raw.allLegislativeChambers),
  };
}

/**
 * The CMS `trunklines` JsonField is polymorphic — an array for
 * civil-service-commission-csc, a bare string for commission-on-audit-coa and
 * office-of-the-ombudsman. The tracked JSON Schema declares an array and every
 * consumer reads `trunklines?.[0]`, so a bare string would both fail schema
 * validation and, if it slipped through, render as "(".
 *
 * Accepted consequence: those two offices currently render NO trunkline
 * anywhere (their local keys are `trunk_line`/`trunkline`, which nothing
 * reads) and will start showing one. That is a content improvement, approved
 * as decision B.
 *
 * A blank string is treated as absent rather than emitted as [""].
 */
export function normalizeTrunklines(
  value: string[] | string | null
): string[] | null {
  if (value === null) return null;
  if (Array.isArray(value)) return value;
  return value.trim() === '' ? null : [value];
}

export function shapeConstitutional(
  records: RawConstitutional[]
): Record<string, unknown>[] {
  return sortForOutput(records).map(r => {
    // Re-asserted here, not only in parseConstitutionalResponse: the shaper is
    // exported and called directly by tests and by buildConstitutionalCandidate,
    // and an unreviewed key must not be able to reach the generated file by any
    // path. Runs BEFORE applyFieldMap's own collision check, and is strictly
    // stronger than it.
    assertAllowedDetailKeys(r.slug, r.additionalDetails);
    return applyFieldMap(
      {
        ...r,
        trunklines: normalizeTrunklines(r.trunklines),
      } as unknown as Record<string, unknown>,
      CONSTITUTIONAL_FIELDS,
      { details: r.additionalDetails, omitEmptyStrings: true }
    );
  });
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

export function buildConstitutionalCandidate(
  raw: RawConstitutionals
): Candidate {
  return {
    path: 'src/data/directory/constitutional.json',
    schemaPath: 'src/data/directory/schema/constitutional.schema.json',
    data: shapeConstitutional(raw.allConstitutionalOffices),
  };
}

/**
 * Meilisearch indexes every document into ONE index keyed by `slug`
 * (index_meilisearch.cjs: createIndex(..., { primaryKey: 'slug' })), so a slug
 * shared between two directory sources means one document silently overwrites
 * the other and one office becomes unsearchable.
 *
 * Scope is deliberately limited to the models this repository makes CMS-owned
 * — departments, executive and constitutional. An index-wide gate is NOT
 * applied here: slug collisions already exist between directory/*.json and
 * the derived websites.json, so an index-wide gate would fail on pre-existing
 * data and would require changing Government Websites, which is out of scope.
 *
 * This is the FAST LOCAL gate, not the guarantee. Per sync-talacms.ts's
 * run-mode matrix, "a gate whose inputs a mode does not have is not applied":
 * it compares only the candidates a run actually carries, and an isolated
 * `--only=` run has nothing to compare against. Its value is failing before
 * any file is written.
 *
 * The AUTHORITATIVE gate is assertUniqueDirectorySlugs in
 * scripts/index_meilisearch.cjs, which runs over the complete loaded directory
 * snapshot in preflight and therefore also catches a collision that an
 * isolated run introduced against another model's already-generated file.
 */
export function assertNoCrossModelSlugCollisions(
  candidates: Candidate[]
): void {
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const bSlugs = new Set((b.data as { slug: string }[]).map(r => r.slug));
      const collisions = (a.data as { slug: string }[])
        .map(r => r.slug)
        .filter(slug => bSlugs.has(slug));

      if (collisions.length > 0) {
        fail(
          `${collisions.length} slug(s) appear in BOTH ${a.path} and ${b.path}: ` +
            `${collisions.join(', ')}. Meilisearch keys its single index by slug, so ` +
            'these records would overwrite each other and one office would become ' +
            'unsearchable.'
        );
      }
    }
  }
}
