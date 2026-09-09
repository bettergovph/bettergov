import { describe, it, expect } from 'vitest';
import {
  DEPARTMENTS_QUERY,
  EXECUTIVE_QUERY,
  parseDepartmentsResponse,
  parseExecutiveResponse,
} from '../directory';
import { shapeDepartments, shapeExecutive, sortForOutput } from '../directory';
import {
  buildDepartmentsCandidate,
  buildExecutiveCandidate,
  assertNoCrossModelSlugCollisions,
} from '../directory';
import {
  CONSTITUTIONAL_QUERY,
  CONSTITUTIONAL_PAGE_SIZE,
  CONSTITUTIONAL_DETAIL_KEYS,
  assertAllowedDetailKeys,
  parseConstitutionalResponse,
  normalizeTrunklines,
  shapeConstitutional,
  buildConstitutionalCandidate,
} from '../directory';
import {
  LEGISLATIVE_QUERY,
  LEGISLATIVE_PAGE_SIZE,
  HOUSE_MEMBERS_CEILING,
  PARTY_LIST_CEILING,
  parseLegislativeResponse,
  shapeLegislative,
  buildLegislativeCandidate,
  projectHouseMembers,
  projectPartyList,
} from '../directory';
import {
  DIPLOMATIC_QUERY,
  DIPLOMATIC_PAGE_SIZE,
  parseDiplomaticResponse,
  shapeDiplomatic,
  buildDiplomaticCandidate,
  candidateSlugs,
} from '../directory';
import departmentsResponse from './fixtures/departments-response.json';
import executiveResponse from './fixtures/executive-response.json';
import constitutionalResponse from './fixtures/constitutional-response.json';
import legislativeResponse from './fixtures/legislative-response.json';
import diplomaticResponse from './fixtures/diplomatic-response.json';
import expectedDepartments from '../../../src/data/directory/__fixtures__/departments.expected.json';
import expectedExecutive from '../../../src/data/directory/__fixtures__/executive.expected.json';
import expectedConstitutional from '../../../src/data/directory/__fixtures__/constitutional.expected.json';
import expectedLegislative from '../../../src/data/directory/__fixtures__/legislative.expected.json';
import expectedDiplomatic from '../../../src/data/directory/__fixtures__/diplomatic.expected.json';
import type {
  RawDepartment,
  RawExecutive,
  RawConstitutional,
  RawDiplomatic,
} from '../directory';

const rawDepartments =
  departmentsResponse.allGovernmentDepartments as unknown as RawDepartment[];
const rawExecutive =
  executiveResponse.allExecutiveOffices as unknown as RawExecutive[];
const rawConstitutional =
  constitutionalResponse.allConstitutionalOffices as unknown as RawConstitutional[];
const rawDiplomatic =
  diplomaticResponse.allDiplomaticEntities as unknown as RawDiplomatic[];

/** Deep key-sort, so equality compares content without regard to key order. */
const sortDeep = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortDeep)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .map(k => [k, sortDeep((v as Record<string, unknown>)[k])])
        )
      : v;

const dept = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'a',
  officeName: 'A',
  address: null,
  trunkline: null,
  email: null,
  website: null,
  secretary: null,
  undersecretaries: null,
  attachedAgencies: null,
  details: null,
  ...over,
});

const exec = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'b',
  office: 'B',
  address: null,
  phone: null,
  trunkline: null,
  email: null,
  website: null,
  officials: null,
  bureaus: null,
  attachedAgencies: null,
  ...over,
});

const okDepts = (depts = [dept()]) => ({
  _allGovernmentDepartmentsMeta: { count: depts.length },
  allGovernmentDepartments: depts,
});

const okExecs = (execs = [exec()]) => ({
  _allExecutiveOfficesMeta: { count: execs.length },
  allExecutiveOffices: execs,
});

describe.each([
  ['DEPARTMENTS_QUERY', DEPARTMENTS_QUERY, 'allGovernmentDepartments('],
  ['EXECUTIVE_QUERY', EXECUTIVE_QUERY, 'allExecutiveOffices('],
])('%s', (_name, query, collectionField) => {
  it('declares its _all*Meta field before its collection field', () => {
    const metaIndex = query.indexOf('Meta');
    expect(metaIndex).toBeGreaterThan(-1);
    expect(metaIndex).toBeLessThan(query.indexOf(collectionField));
  });

  it('orders by position_ASC', () => {
    expect(query.match(/orderBy: \[position_ASC\]/g)).toHaveLength(1);
  });

  it('never requests the system timestamps', () => {
    expect(query).not.toContain('_createdAt');
    expect(query).not.toContain('_updatedAt');
  });
});

/**
 * REVISION — Sol finding 1. Each query names exactly one collection, so an
 * `--only=` run cannot be made to fail by the other model's data.
 */
describe('query isolation', () => {
  it('DEPARTMENTS_QUERY never mentions the executive collection', () => {
    expect(DEPARTMENTS_QUERY).not.toContain('allExecutiveOffices');
    expect(DEPARTMENTS_QUERY).not.toContain('_allExecutiveOfficesMeta');
  });

  it('EXECUTIVE_QUERY never mentions the departments collection', () => {
    expect(EXECUTIVE_QUERY).not.toContain('allGovernmentDepartments');
    expect(EXECUTIVE_QUERY).not.toContain('_allGovernmentDepartmentsMeta');
  });
});

describe('parseDepartmentsResponse', () => {
  it('accepts a well-formed response', () => {
    expect(
      parseDepartmentsResponse(okDepts()).allGovernmentDepartments
    ).toHaveLength(1);
  });

  it('ignores an absent executive collection entirely', () => {
    expect(() => parseDepartmentsResponse(okDepts())).not.toThrow();
  });

  it('accepts a null position — the schema declares it nullable', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ position: null })]))
    ).not.toThrow();
  });

  it('accepts duplicate positions — nothing downstream consumes record order', () => {
    const depts = [
      dept({ slug: 'a', position: 3 }),
      dept({ slug: 'b', position: 3 }),
    ];
    expect(() => parseDepartmentsResponse(okDepts(depts))).not.toThrow();
  });

  it('fails closed when the collection is short of its meta count', () => {
    const short = { ...okDepts(), _allGovernmentDepartmentsMeta: { count: 2 } };
    expect(() => parseDepartmentsResponse(short)).toThrow(/incomplete/i);
  });

  it('fails closed on zero departments', () => {
    expect(() => parseDepartmentsResponse(okDepts([]))).toThrow(
      /no government departments/i
    );
  });

  it('fails closed on a duplicate slug', () => {
    const depts = [
      dept({ slug: 'a', position: 0 }),
      dept({ slug: 'a', position: 1 }),
    ];
    expect(() => parseDepartmentsResponse(okDepts(depts))).toThrow(
      /duplicate slug/i
    );
  });

  it('fails closed on a blank display name', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ officeName: '   ' })]))
    ).toThrow(/blank/i);
  });

  it('fails closed on a slug that violates the slug pattern', () => {
    expect(() =>
      parseDepartmentsResponse(okDepts([dept({ slug: 'Not A Slug' })]))
    ).toThrow(/slug/i);
  });

  it('fails closed when the collection reaches the page-size ceiling', () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      dept({ slug: `s${i}`, position: i })
    );
    expect(() => parseDepartmentsResponse(okDepts(many))).toThrow(/ceiling/i);
  });
});

describe('parseExecutiveResponse', () => {
  it('accepts a well-formed response', () => {
    expect(parseExecutiveResponse(okExecs()).allExecutiveOffices).toHaveLength(
      1
    );
  });

  it('ignores an absent departments collection entirely', () => {
    expect(() => parseExecutiveResponse(okExecs())).not.toThrow();
  });

  it('fails closed on zero executive offices', () => {
    expect(() => parseExecutiveResponse(okExecs([]))).toThrow(
      /no executive offices/i
    );
  });

  it('fails closed on a duplicate slug', () => {
    const execs = [
      exec({ slug: 'a', position: 0 }),
      exec({ slug: 'a', position: 1 }),
    ];
    expect(() => parseExecutiveResponse(okExecs(execs))).toThrow(
      /duplicate slug/i
    );
  });

  it('fails closed on a blank display name', () => {
    expect(() =>
      parseExecutiveResponse(okExecs([exec({ office: '' })]))
    ).toThrow(/blank/i);
  });

  it('fails closed when the collection is short of its meta count', () => {
    const short = { ...okExecs(), _allExecutiveOfficesMeta: { count: 2 } };
    expect(() => parseExecutiveResponse(short)).toThrow(/incomplete/i);
  });
});

describe('sortForOutput', () => {
  it('sorts by position ascending', () => {
    const out = sortForOutput([
      { position: 2, slug: 'c' },
      { position: 0, slug: 'a' },
      { position: 1, slug: 'b' },
    ]);
    expect(out.map(r => r.slug)).toEqual(['a', 'b', 'c']);
  });

  it('breaks position ties by slug ascending', () => {
    const out = sortForOutput([
      { position: 3, slug: 'zeta' },
      { position: 3, slug: 'alpha' },
      { position: 3, slug: 'mu' },
    ]);
    expect(out.map(r => r.slug)).toEqual(['alpha', 'mu', 'zeta']);
  });

  it('places null positions last, themselves ordered by slug', () => {
    const out = sortForOutput([
      { position: null, slug: 'zulu' },
      { position: 5, slug: 'mid' },
      { position: null, slug: 'alpha' },
      { position: 0, slug: 'first' },
    ]);
    expect(out.map(r => r.slug)).toEqual(['first', 'mid', 'alpha', 'zulu']);
  });

  it('is a pure function — it does not mutate its input', () => {
    const input = [
      { position: 1, slug: 'b' },
      { position: 0, slug: 'a' },
    ];
    sortForOutput(input);
    expect(input.map(r => r.slug)).toEqual(['b', 'a']);
  });

  it('is deterministic across repeated calls on ties and nulls', () => {
    const input = [
      { position: null, slug: 'b' },
      { position: 1, slug: 'x' },
      { position: 1, slug: 'a' },
      { position: null, slug: 'a' },
    ];
    expect(sortForOutput(input).map(r => r.slug)).toEqual(
      sortForOutput([...input].reverse()).map(r => r.slug)
    );
  });
});

describe('null-vs-absent normalization', () => {
  it('omits a key whose CMS value is null rather than emitting null', () => {
    const [rec] = shapeExecutive([
      exec({ slug: 'x', office: 'X', address: 'A' }),
    ]);
    expect(Object.keys(rec)).toEqual(['slug', 'office', 'address']);
    expect('phone' in rec).toBe(false);
    expect('trunkline' in rec).toBe(false);
  });

  it('never emits a position key in the output', () => {
    const [d] = shapeDepartments([dept({ position: 7 })]);
    const [e] = shapeExecutive([exec({ position: 7 })]);
    expect(d).not.toHaveProperty('position');
    expect(e).not.toHaveProperty('position');
  });
});

describe('per-model field maps', () => {
  it('maps attachedAgencies to attached_agencies for departments', () => {
    const [rec] = shapeDepartments([
      dept({ attachedAgencies: [{ name: 'A' }] }),
    ]);
    expect(rec).toHaveProperty('attached_agencies');
    expect(rec).not.toHaveProperty('attached_agency');
  });

  it('maps attachedAgencies to attached_agency (singular) for executive', () => {
    const [rec] = shapeExecutive([exec({ attachedAgencies: [{ name: 'A' }] })]);
    expect(rec).toHaveProperty('attached_agency');
    expect(rec).not.toHaveProperty('attached_agencies');
  });

  it('maps officeName to office_name for departments', () => {
    const [rec] = shapeDepartments([dept({ officeName: 'DEPARTMENT OF X' })]);
    expect(rec.office_name).toBe('DEPARTMENT OF X');
    expect(rec).not.toHaveProperty('officeName');
  });
});

describe('details spreading', () => {
  it('spreads details to top level and never emits a "details" key', () => {
    const [rec] = shapeDepartments([
      dept({ details: { bureaus: [{ name: 'B' }], regional_offices: [] } }),
    ]);
    expect(rec).not.toHaveProperty('details');
    expect(rec.bureaus).toEqual([{ name: 'B' }]);
    expect(rec.regional_offices).toEqual([]);
  });

  it('hoists assistant_secretaries to directly after undersecretaries', () => {
    const [rec] = shapeDepartments([
      dept({
        undersecretaries: [{ name: 'U', role: 'R' }],
        details: {
          bureaus: [],
          assistant_secretaries: [{ name: 'A', role: 'R' }],
        },
      }),
    ]);
    expect(Object.keys(rec)).toEqual([
      'slug',
      'office_name',
      'undersecretaries',
      'assistant_secretaries',
      'bureaus',
    ]);
  });

  it('emits attached_agencies after the details spread', () => {
    const [rec] = shapeDepartments([
      dept({ attachedAgencies: [{ name: 'A' }], details: { bureaus: [] } }),
    ]);
    expect(Object.keys(rec)).toEqual([
      'slug',
      'office_name',
      'bureaus',
      'attached_agencies',
    ]);
  });

  it('passes through near-duplicate attached* keys inside details unchanged', () => {
    const [rec] = shapeDepartments([
      dept({
        details: {
          attached_agency: [{ name: 'A' }],
          attached_agenices: [{ name: 'B' }],
        },
      }),
    ]);
    expect(rec).toHaveProperty('attached_agency');
    expect(rec).toHaveProperty('attached_agenices');
  });

  it('fails closed if a details key collides with a mapped top-level key', () => {
    expect(() =>
      shapeDepartments([dept({ details: { office_name: 'shadow' } })])
    ).toThrow(/collides/i);
  });

  /**
   * REVISION — Sol finding 6. Measured today: zero null values inside details
   * across all 23 records and zero explicit nulls in either committed file, so
   * this is hardening rather than a live bug fix. It keeps one rule for the
   * whole record: the committed files express "no value" by ABSENCE, and
   * [department].tsx keys its leftover-section rendering off key presence — an
   * emitted null would render an empty section that does not exist today.
   */
  it('omits an ordinary details key whose value is null', () => {
    const [rec] = shapeDepartments([
      dept({ details: { bureaus: [{ name: 'B' }], regional_offices: null } }),
    ]);
    expect(rec).toHaveProperty('bureaus');
    expect(rec).not.toHaveProperty('regional_offices');
  });

  it('omits a hoisted details key whose value is null', () => {
    const [rec] = shapeDepartments([
      dept({
        undersecretaries: [{ name: 'U', role: 'R' }],
        details: { assistant_secretaries: null, bureaus: [] },
      }),
    ]);
    expect(rec).not.toHaveProperty('assistant_secretaries');
    expect(Object.keys(rec)).toEqual([
      'slug',
      'office_name',
      'undersecretaries',
      'bureaus',
    ]);
  });

  it('omits an ordinary details key whose value is undefined', () => {
    const [rec] = shapeDepartments([
      dept({ details: { bureaus: [], regional_offices: undefined } }),
    ]);
    expect(rec).not.toHaveProperty('regional_offices');
  });

  it('still emits falsy-but-present values such as empty arrays and empty strings', () => {
    const [rec] = shapeDepartments([
      dept({ details: { bureaus: [], public_assistance_desk: '' } }),
    ]);
    expect(rec.bureaus).toEqual([]);
    expect(rec.public_assistance_desk).toBe('');
  });
});

describe('record ordering in shaped output', () => {
  it('emits records in deterministic sort order regardless of response order', () => {
    const out = shapeExecutive([
      exec({ position: 1, slug: 'b', office: 'B' }),
      exec({ position: 0, slug: 'a', office: 'A' }),
    ]);
    expect(out.map(r => r.slug)).toEqual(['a', 'b']);
  });

  it('resolves a position tie by slug in shaped output too', () => {
    const out = shapeDepartments([
      dept({ position: 4, slug: 'zeta', officeName: 'Z' }),
      dept({ position: 4, slug: 'alpha', officeName: 'A' }),
    ]);
    expect(out.map(r => r.slug)).toEqual(['alpha', 'zeta']);
  });
});

describe('round-trip equivalence against the pre-migration files', () => {
  it('reproduces every committed department record content-for-content', () => {
    expect(sortDeep(shapeDepartments(rawDepartments))).toEqual(
      sortDeep(expectedDepartments)
    );
  });

  it('reproduces every committed executive record content-for-content', () => {
    expect(sortDeep(shapeExecutive(rawExecutive))).toEqual(
      sortDeep(expectedExecutive)
    );
  });

  /**
   * Kept because live data still reproduces today's file order exactly:
   * position order equals committed file order for both models as of
   * 2026-09-08, and the (position, nulls-last, slug) sort preserves that.
   */
  it('preserves the exact record order of the committed files', () => {
    expect(shapeDepartments(rawDepartments).map(r => r.slug)).toEqual(
      expectedDepartments.map(r => r.slug)
    );
    expect(shapeExecutive(rawExecutive).map(r => r.slug)).toEqual(
      expectedExecutive.map(r => r.slug)
    );
  });

  /**
   * Executive is byte-exact for 35/38. The 3 exceptions differ only in nested
   * key order inside `officials` entries ({personnel, office_division} from the
   * CMS vs {office_division, personnel} locally). _ExecutiveOfficePage reads
   * those by name (`'office_division' in e`, `d.personnel`), so the flip is
   * not user-visible.
   */
  it('is byte-exact for every executive record without nested officials divisions', () => {
    const NESTED = new Set([
      'office-of-the-president',
      'office-of-the-vice-president',
      'presidential-communications-office',
    ]);
    const out = shapeExecutive(rawExecutive);
    const byteExact = out.filter(
      (r, i) => JSON.stringify(r) === JSON.stringify(expectedExecutive[i])
    );
    expect(byteExact).toHaveLength(expectedExecutive.length - NESTED.size);
  });

  /**
   * Guards the ACCEPTED key-order delta (Option 1) so it can only shrink,
   * never silently grow. 14/23 is the measured baseline with
   * assistant_secretaries hoisted.
   */
  it('holds departments key-order agreement at or above the measured baseline', () => {
    const out = shapeDepartments(rawDepartments);
    const agree = out.filter(
      (r, i) =>
        Object.keys(r).join() === Object.keys(expectedDepartments[i]).join()
    ).length;
    expect(agree).toBeGreaterThanOrEqual(14);
  });

  /** Option 1's hard condition: no content may be lost or added. */
  it('emits exactly the same top-level key SET per record as the committed file', () => {
    for (const [i, rec] of shapeDepartments(rawDepartments).entries()) {
      expect(Object.keys(rec).sort()).toEqual(
        Object.keys(expectedDepartments[i]).sort()
      );
    }
    for (const [i, rec] of shapeExecutive(rawExecutive).entries()) {
      expect(Object.keys(rec).sort()).toEqual(
        Object.keys(expectedExecutive[i]).sort()
      );
    }
  });
});

describe('candidate emission', () => {
  it('emits the departments candidate against the tracked departments schema', () => {
    const c = buildDepartmentsCandidate({
      _allGovernmentDepartmentsMeta: { count: rawDepartments.length },
      allGovernmentDepartments: rawDepartments,
    });
    expect(c.path).toBe('src/data/directory/departments.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/departments.schema.json'
    );
  });

  it('emits the executive candidate against the tracked executive schema', () => {
    const c = buildExecutiveCandidate({
      _allExecutiveOfficesMeta: { count: rawExecutive.length },
      allExecutiveOffices: rawExecutive,
    });
    expect(c.path).toBe('src/data/directory/executive.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/executive.schema.json'
    );
  });

  it('builds each candidate without reference to the other model', () => {
    // Neither builder takes the other's data — isolation is structural.
    expect(buildDepartmentsCandidate.length).toBe(1);
    expect(buildExecutiveCandidate.length).toBe(1);
  });
});

describe('assertNoCrossModelSlugCollisions', () => {
  const candidate = (path: string, slugs: string[]) => ({
    path,
    schemaPath: 'unused',
    data: slugs.map(slug => ({ slug })),
  });

  it('passes when no two models share a slug', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('d', ['department-of-x']),
        candidate('e', ['office-of-y']),
        candidate('c', ['commission-on-z']),
      ])
    ).not.toThrow();
  });

  it('is not vacuous on a single candidate', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([candidate('d', ['a', 'b'])])
    ).not.toThrow();
  });

  it.each([
    ['departments and executive', 0, 1],
    ['departments and constitutional', 0, 2],
    ['executive and constitutional', 1, 2],
  ])('fails closed when %s share a slug', (_label, i, j) => {
    const paths = ['d', 'e', 'c'];
    const slugs = [['a'], ['b'], ['c']];
    slugs[i] = ['shared-slug'];
    slugs[j] = ['shared-slug'];
    expect(() =>
      assertNoCrossModelSlugCollisions(
        paths.map((p, k) => candidate(p, slugs[k]))
      )
    ).toThrow(/shared-slug/);
  });

  it('names both colliding candidate paths', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('src/data/directory/departments.json', ['shared-slug']),
        candidate('src/data/directory/constitutional.json', ['shared-slug']),
      ])
    ).toThrow(/departments\.json.*constitutional\.json/s);
  });

  it('names every colliding slug, not just the first', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('d', ['a', 'b', 'c']),
        candidate('e', ['a', 'c']),
      ])
    ).toThrow(/a.*c/s);
  });

  it('catches a legislative slug that collides with departments', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('src/data/directory/departments.json', ['shared-slug']),
        candidate('src/data/directory/legislative.json', ['shared-slug']),
      ])
    ).toThrow(/departments\.json.*legislative\.json/s);
  });

  it('passes against the real generated candidates for all four models', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        buildDepartmentsCandidate({
          _allGovernmentDepartmentsMeta: { count: rawDepartments.length },
          allGovernmentDepartments: rawDepartments,
        }),
        buildExecutiveCandidate({
          _allExecutiveOfficesMeta: { count: rawExecutive.length },
          allExecutiveOffices: rawExecutive,
        }),
        buildConstitutionalCandidate({
          _allConstitutionalOfficesMeta: { count: rawConstitutional.length },
          allConstitutionalOffices: rawConstitutional,
        }),
        buildLegislativeCandidate(
          parseLegislativeResponse(legislativeResponse)
        ),
      ])
    ).not.toThrow();
  });
});

describe('schema validation against tracked schemas', () => {
  it('rejects a generated record missing a schema-required field', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/departments.json',
        schemaPath: 'src/data/directory/schema/departments.schema.json',
        data: [{ slug: 'x' }], // office_name is required
      })
    ).rejects.toThrow(/does not satisfy/);
  });
});

const con = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'commission-on-x',
  name: 'COMMISSION ON X',
  officeType: 'Constitutional Office',
  description: null,
  address: null,
  phone: null,
  trunklines: null,
  website: null,
  email: null,
  officials: [{ name: 'A PERSON', role: 'Chairperson' }],
  regionalOffices: null,
  publicAssistance: null,
  additionalDetails: null,
  ...over,
});

const okCons = (cons = [con()]) => ({
  _allConstitutionalOfficesMeta: { count: cons.length },
  allConstitutionalOffices: cons,
});

describe('CONSTITUTIONAL_QUERY', () => {
  it('declares its _all*Meta field before its collection field', () => {
    const metaIndex = CONSTITUTIONAL_QUERY.indexOf('Meta');
    expect(metaIndex).toBeGreaterThan(-1);
    expect(metaIndex).toBeLessThan(
      CONSTITUTIONAL_QUERY.indexOf('allConstitutionalOffices(')
    );
  });

  it('orders by position_ASC', () => {
    expect(
      CONSTITUTIONAL_QUERY.match(/orderBy: \[position_ASC\]/g)
    ).toHaveLength(1);
  });

  it('never requests the system timestamps', () => {
    expect(CONSTITUTIONAL_QUERY).not.toContain('_createdAt');
    expect(CONSTITUTIONAL_QUERY).not.toContain('_updatedAt');
  });

  it('requests its own page-size ceiling, not the shared one', () => {
    expect(CONSTITUTIONAL_QUERY).toContain(
      `first: ${CONSTITUTIONAL_PAGE_SIZE}`
    );
    expect(CONSTITUTIONAL_PAGE_SIZE).toBeGreaterThan(229);
    // The CDA hard-caps `first` at 500; staying under it keeps the ceiling
    // gate meaningful rather than aliasing the server's own limit.
    expect(CONSTITUTIONAL_PAGE_SIZE).toBeLessThan(500);
  });

  it('never mentions the departments or executive collections', () => {
    expect(CONSTITUTIONAL_QUERY).not.toContain('allGovernmentDepartments');
    expect(CONSTITUTIONAL_QUERY).not.toContain('allExecutiveOffices');
  });
});

describe('query isolation — constitutional', () => {
  it('DEPARTMENTS_QUERY never mentions the constitutional collection', () => {
    expect(DEPARTMENTS_QUERY).not.toContain('allConstitutionalOffices');
    expect(DEPARTMENTS_QUERY).not.toContain('_allConstitutionalOfficesMeta');
  });

  it('EXECUTIVE_QUERY never mentions the constitutional collection', () => {
    expect(EXECUTIVE_QUERY).not.toContain('allConstitutionalOffices');
    expect(EXECUTIVE_QUERY).not.toContain('_allConstitutionalOfficesMeta');
  });
});

describe('parseConstitutionalResponse', () => {
  it('accepts a well-formed response', () => {
    expect(
      parseConstitutionalResponse(okCons()).allConstitutionalOffices
    ).toHaveLength(1);
  });

  it('accepts the real 229-record fixture', () => {
    expect(
      parseConstitutionalResponse(constitutionalResponse)
        .allConstitutionalOffices
    ).toHaveLength(229);
  });

  it('accepts trunklines as an array and as a bare string', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ trunklines: ['(632) 1', '2'] })])
      )
    ).not.toThrow();
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ trunklines: '(632) 8952-5700' })])
      )
    ).not.toThrow();
  });

  it('fails closed when trunklines is neither an array of strings nor a string', () => {
    expect(() =>
      parseConstitutionalResponse(okCons([con({ trunklines: { n: 1 } })]))
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it('fails closed when the collection is short of its meta count', () => {
    const short = {
      ...okCons(),
      _allConstitutionalOfficesMeta: { count: 2 },
    };
    expect(() => parseConstitutionalResponse(short)).toThrow(/incomplete/i);
  });

  it('fails closed on zero records', () => {
    expect(() => parseConstitutionalResponse(okCons([]))).toThrow(
      /no constitutional offices/i
    );
  });

  it('fails closed at its own page-size ceiling, not the shared 100', () => {
    const many = Array.from({ length: CONSTITUTIONAL_PAGE_SIZE }, (_, i) =>
      con({ slug: `office-${i}`, position: i })
    );
    expect(() => parseConstitutionalResponse(okCons(many))).toThrow(/ceiling/i);
  });

  it('does NOT fail at 229 records — the shared 100 ceiling must not apply', () => {
    const many = Array.from({ length: 229 }, (_, i) =>
      con({ slug: `office-${i}`, position: i })
    );
    expect(() => parseConstitutionalResponse(okCons(many))).not.toThrow();
  });

  it('fails closed on a duplicate slug', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ slug: 'same' }), con({ slug: 'same', position: 1 })])
      )
    ).toThrow(/duplicate slug "same"/);
  });

  it('fails closed on a slug that is not a valid slug', () => {
    expect(() =>
      parseConstitutionalResponse(okCons([con({ slug: 'Not A Slug' })]))
    ).toThrow(/not a valid slug/);
  });

  it('fails closed on a blank display name', () => {
    expect(() =>
      parseConstitutionalResponse(okCons([con({ name: '   ' })]))
    ).toThrow(/blank display name/);
  });

  it('fails closed on a blank office_type, naming the slug', () => {
    // /government/constitutional/goccs and /sucs BOTH filter on office_type;
    // a blank value silently drops the record from both pages.
    expect(() =>
      parseConstitutionalResponse(okCons([con({ officeType: '  ' })]))
    ).toThrow(/commission-on-x.*office_type/s);
  });

  it('fails closed when an official is missing its name or role', () => {
    // src/pages/government/constitutional/data.ts parses with
    // ConstitutionalOfficeSchema at MODULE SCOPE — a missing name or role
    // throws at import and takes down the whole route tree.
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ officials: [{ role: 'Chairperson' }] })])
      )
    ).toThrow(/unexpected constitutional offices shape/i);
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ officials: [{ name: 'A PERSON', role: '' }] })])
      )
    ).toThrow(/unexpected constitutional offices shape/i);
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ officials: [{ name: '', role: 'Chairperson' }] })])
      )
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it.each([
    ['name', { name: '   ', role: 'Chairperson' }],
    ['name', { name: '\t\n', role: 'Chairperson' }],
    ['role', { name: 'A PERSON', role: '   ' }],
    ['role', { name: 'A PERSON', role: '\t\n' }],
  ])('fails closed on a whitespace-only official %s', (_field, official) => {
    // z.string().min(1) would ACCEPT "   ". A blank role renders as an empty
    // cell in OfficialsTable and an empty sidebar row, while every
    // count-based gate still reports a healthy 229.
    expect(() =>
      parseConstitutionalResponse(okCons([con({ officials: [official] })]))
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it('trims surrounding whitespace off an official name and role', () => {
    // .trim() is a zod TRANSFORM, so parsed values are trimmed and the
    // trimmed value is what reaches the generated file. Pinned so the
    // normalization is deliberate rather than incidental.
    const parsed = parseConstitutionalResponse(
      okCons([
        con({ officials: [{ name: '  A PERSON  ', role: ' Chairperson ' }] }),
      ])
    );
    expect(parsed.allConstitutionalOffices[0].officials[0]).toMatchObject({
      name: 'A PERSON',
      role: 'Chairperson',
    });
  });

  it('fails closed when officials is null rather than an array', () => {
    expect(() =>
      parseConstitutionalResponse(okCons([con({ officials: null })]))
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it('keeps unknown official keys rather than rejecting them', () => {
    const parsed = parseConstitutionalResponse(
      okCons([
        con({
          officials: [
            {
              name: 'A PERSON',
              role: 'Chairperson',
              office: 'Legal',
              contact: 'loc. 1',
            },
          ],
        }),
      ])
    );
    expect(parsed.allConstitutionalOffices[0].officials[0]).toMatchObject({
      office: 'Legal',
      contact: 'loc. 1',
    });
  });

  it('fails closed on a null position', () => {
    // Unlike departments and executive, Constitutional record ORDER is
    // consumed — ConstitutionalSidebar renders in array order and
    // generate-sitemap.js emits URLs in array order. A null position would
    // sink the record to the end of the file via sortForOutput's null-last
    // rule, silently reordering the sidebar with no count changing.
    expect(() =>
      parseConstitutionalResponse(okCons([con({ position: null })]))
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it('fails closed on a missing or non-integer position', () => {
    const noPosition: Record<string, unknown> = con();
    delete noPosition.position;
    expect(() =>
      parseConstitutionalResponse(okCons([noPosition as never]))
    ).toThrow(/unexpected constitutional offices shape/i);
    expect(() =>
      parseConstitutionalResponse(okCons([con({ position: 1.5 })]))
    ).toThrow(/unexpected constitutional offices shape/i);
  });

  it('fails closed on a duplicate position, naming both slugs', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([
          con({ slug: 'office-a', position: 7 }),
          con({ slug: 'office-b', position: 7 }),
        ])
      )
    ).toThrow(/office-a.*office-b.*duplicate position 7/s);
  });

  it('accepts non-contiguous positions — gaps are normal after a retirement', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([
          con({ slug: 'office-a', position: 0 }),
          con({ slug: 'office-b', position: 5 }),
          con({ slug: 'office-c', position: 900 }),
        ])
      )
    ).not.toThrow();
  });

  it('accepts the real fixture, whose 229 positions are unique and non-null', () => {
    const parsed = parseConstitutionalResponse(constitutionalResponse);
    const positions = parsed.allConstitutionalOffices.map(r => r.position);
    expect(positions).toHaveLength(229);
    expect(new Set(positions).size).toBe(229);
    expect(positions.every(p => Number.isInteger(p))).toBe(true);
  });

  it('accepts the two allowlisted additionalDetails keys', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([
          con({
            additionalDetails: {
              region: 'NATIONAL CAPITAL REGION',
              satellite_office: 'Baler, Aurora',
            },
          }),
        ])
      )
    ).not.toThrow();
  });

  it('accepts a null additionalDetails', () => {
    expect(() =>
      parseConstitutionalResponse(okCons([con({ additionalDetails: null })]))
    ).not.toThrow();
  });

  it('fails closed on an unknown additionalDetails key, naming the key and the slug', () => {
    // The blob is spread verbatim onto the top level of the generated record,
    // so any key the CMS gains would land in constitutional.json unreviewed.
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ additionalDetails: { motto: 'Serve the people' } })])
      )
    ).toThrow(/commission-on-x.*motto/s);
  });

  it('fails closed on a `position` key inside additionalDetails', () => {
    // position is never a mapped OUTPUT key, so applyFieldMap's collision
    // check cannot see this — only the allowlist can. It must never reach the
    // generated file as content.
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ additionalDetails: { position: 3 } })])
      )
    ).toThrow(/commission-on-x.*position/s);
  });

  it('fails closed on a mapped-field key inside additionalDetails', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ additionalDetails: { website: 'sneaky.gov.ph' } })])
      )
    ).toThrow(/commission-on-x.*website/s);
  });

  it('reports every disallowed key, not just the first', () => {
    expect(() =>
      parseConstitutionalResponse(
        okCons([con({ additionalDetails: { motto: 'x', founded: 1987 } })])
      )
    ).toThrow(/motto.*founded/s);
  });
});

describe('assertAllowedDetailKeys', () => {
  it('allows exactly region and satellite_office', () => {
    expect(CONSTITUTIONAL_DETAIL_KEYS).toEqual(['region', 'satellite_office']);
    expect(() =>
      assertAllowedDetailKeys('x', { region: 'NCR', satellite_office: 'Baler' })
    ).not.toThrow();
  });

  it('allows null and an empty object', () => {
    expect(() => assertAllowedDetailKeys('x', null)).not.toThrow();
    expect(() => assertAllowedDetailKeys('x', {})).not.toThrow();
  });

  it('rejects any other key', () => {
    expect(() => assertAllowedDetailKeys('x', { motto: 'y' })).toThrow(/motto/);
  });
});

describe('normalizeTrunklines', () => {
  it('passes an array through untouched', () => {
    expect(normalizeTrunklines(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('wraps a bare string into a one-element array', () => {
    // The tracked JSON Schema declares trunklines as an array, and every
    // consumer reads trunklines?.[0]. A bare string would render as "(".
    expect(normalizeTrunklines('(632) 8952-5700')).toEqual(['(632) 8952-5700']);
  });

  it('treats a blank string as absent rather than emitting [""]', () => {
    expect(normalizeTrunklines('')).toBeNull();
    expect(normalizeTrunklines('   ')).toBeNull();
  });

  it('passes null through', () => {
    expect(normalizeTrunklines(null)).toBeNull();
  });

  it('preserves an empty array — that is a present value, not an absent one', () => {
    expect(normalizeTrunklines([])).toEqual([]);
  });
});

describe('shapeConstitutional', () => {
  it('reproduces the committed file, content for content', () => {
    const out = shapeConstitutional(rawConstitutional);
    expect(out).toHaveLength(expectedConstitutional.length);
    // Deep key-sorted: content equality without regard to key order.
    for (const [i, rec] of out.entries()) {
      const expected = {
        ...(expectedConstitutional[i] as Record<string, unknown>),
      };
      // The three ACCEPTED deltas, applied to the expected side so the rest
      // of the record is still compared strictly. See §0.5 of the plan.
      if (expected.trunk_line !== undefined) {
        expected.trunklines = [expected.trunk_line];
        delete expected.trunk_line;
      }
      if (expected.trunkline !== undefined) {
        expected.trunklines = [expected.trunkline];
        delete expected.trunkline;
      }
      expect(sortDeep(rec)).toEqual(sortDeep(expected));
    }
  });

  it('emits records in committed file order', () => {
    expect(shapeConstitutional(rawConstitutional).map(r => r.slug)).toEqual(
      (expectedConstitutional as { slug: string }[]).map(r => r.slug)
    );
  });

  it('normalizes the two string trunklines into arrays', () => {
    const out = shapeConstitutional(rawConstitutional);
    const bySlug = (s: string) => out.find(r => r.slug === s)!;
    expect(bySlug('commission-on-audit-coa').trunklines).toEqual([
      '(632) 8952-5700',
    ]);
    expect(bySlug('office-of-the-ombudsman').trunklines).toEqual([
      '(632) 5317-8300; 8926-2662',
    ]);
    // And leaves the genuine array alone.
    expect(bySlug('civil-service-commission-csc').trunklines).toEqual([
      '(632) 8931-7935',
      '8931-7939',
      '8931-8092',
    ]);
  });

  it('never emits trunk_line or trunkline — the CMS normalized those away', () => {
    for (const rec of shapeConstitutional(rawConstitutional)) {
      expect(rec).not.toHaveProperty('trunk_line');
      expect(rec).not.toHaveProperty('trunkline');
    }
  });

  it('omits empty-string scalars rather than emitting them', () => {
    const out = shapeConstitutional(rawConstitutional);
    const rec = out.find(
      r => r.slug === 'tawi-tawi-regional-agricultural-college'
    )!;
    expect(rec).not.toHaveProperty('description');
    expect(rec).not.toHaveProperty('phone');
    expect(rec).not.toHaveProperty('email');
  });

  it('lifts additionalDetails to the top level', () => {
    const out = shapeConstitutional(rawConstitutional);
    expect(out.filter(r => 'region' in r)).toHaveLength(114);
    expect(out.filter(r => 'satellite_office' in r)).toHaveLength(1);
  });

  it('never emits position — it is an ordering handle, not content', () => {
    for (const rec of shapeConstitutional(rawConstitutional)) {
      expect(rec).not.toHaveProperty('position');
    }
  });

  it('spreads both allowlisted additionalDetails keys', () => {
    const [rec] = shapeConstitutional([
      con({
        additionalDetails: {
          region: 'NATIONAL CAPITAL REGION',
          satellite_office: 'Baler, Aurora',
        },
      }) as never,
    ]);
    expect(rec.region).toBe('NATIONAL CAPITAL REGION');
    expect(rec.satellite_office).toBe('Baler, Aurora');
  });

  it('fails closed on an unknown additionalDetails key, even called directly', () => {
    // The parse gate already rejects this; the shaper gate exists so a direct
    // shapeConstitutional() call cannot emit an unreviewed key either.
    expect(() =>
      shapeConstitutional([con({ additionalDetails: { motto: 'x' } }) as never])
    ).toThrow(/not in the allowlist/);
  });

  it('fails closed on a `position` key inside additionalDetails', () => {
    expect(() =>
      shapeConstitutional([
        con({ additionalDetails: { position: 3 } }) as never,
      ])
    ).toThrow(/not in the allowlist/);
  });

  it('fails closed when an additionalDetails key collides with a mapped field', () => {
    // Reaches the allowlist first, which is strictly stronger. applyFieldMap's
    // own collision check stays in place beneath it for the other models.
    expect(() =>
      shapeConstitutional([
        con({ additionalDetails: { website: 'sneaky.gov.ph' } }) as never,
      ])
    ).toThrow(/not in the allowlist/);
  });

  it('sorts strictly by position ascending', () => {
    // Deterministic position_ASC ordering is what reproduces the committed
    // file order; §0.9 is why nulls and duplicates can no longer reach here.
    const out = shapeConstitutional([
      con({ slug: 'third', position: 900 }),
      con({ slug: 'first', position: 0 }),
      con({ slug: 'second', position: 5 }),
    ] as never);
    expect(out.map(r => r.slug)).toEqual(['first', 'second', 'third']);
  });

  it('leaves every official name and role byte-identical to the fixture', () => {
    // .trim() on the officials schema is a transform. Zero of the 287 live
    // rows carry surrounding whitespace, so the generated output must be
    // unchanged by it — this is the pin for that claim.
    const out = shapeConstitutional(rawConstitutional);
    const flat = (recs: unknown[]) =>
      recs.flatMap(r =>
        (
          (r as { officials?: { name: string; role: string }[] }).officials ??
          []
        ).map(o => `${o.role}\u0000${o.name}`)
      );
    expect(flat(out)).toEqual(flat(expectedConstitutional as unknown[]));
  });

  /**
   * Guards the ACCEPTED key-order delta so it can only shrink, never silently
   * grow. 103/229 is the measured baseline; the committed file's own key
   * order is internally inconsistent, so exact agreement is not reachable.
   */
  it('holds constitutional key-order agreement at or above the measured baseline', () => {
    const out = shapeConstitutional(rawConstitutional);
    const agree = out.filter(
      (r, i) =>
        Object.keys(r).join() ===
        Object.keys(expectedConstitutional[i] as object).join()
    ).length;
    expect(agree).toBeGreaterThanOrEqual(103);
  });
});

describe('constitutional candidate emission', () => {
  it('emits the candidate against the tracked constitutional schema', () => {
    const c = buildConstitutionalCandidate({
      _allConstitutionalOfficesMeta: { count: rawConstitutional.length },
      allConstitutionalOffices: rawConstitutional,
    });
    expect(c.path).toBe('src/data/directory/constitutional.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/constitutional.schema.json'
    );
    expect(c.data).toHaveLength(229);
  });

  it('builds the candidate without reference to the other models', () => {
    expect(buildConstitutionalCandidate.length).toBe(1);
  });

  it('produces a candidate that satisfies the tracked JSON Schema', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare(
        buildConstitutionalCandidate({
          _allConstitutionalOfficesMeta: { count: rawConstitutional.length },
          allConstitutionalOffices: rawConstitutional,
        })
      )
    ).resolves.toMatchObject({
      path: 'src/data/directory/constitutional.json',
    });
  });

  it('would REJECT an un-normalized string trunklines — proving the schema gate bites', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/constitutional.json',
        schemaPath: 'src/data/directory/schema/constitutional.schema.json',
        data: [
          {
            slug: 'x',
            office_type: 'Constitutional Office',
            name: 'X',
            trunklines: '(632) 8952-5700',
          },
        ],
      })
    ).rejects.toThrow(/does not satisfy/);
  });
});

/* ------------------------------------------------------------------ */
/*  Legislative                                                        */
/* ------------------------------------------------------------------ */

const hm = (over: Record<string, unknown> = {}) => ({
  position: 0,
  name: 'DELA CRUZ, JUAN M.',
  provinceCity: 'Isabela',
  district: '1st District',
  contact: '8931-0000; local 1000',
  ...over,
});

const plr = (over: Record<string, unknown> = {}) => ({
  position: 0,
  name: 'SANTOS, MARIA C.',
  partyList: 'EXAMPLE',
  contact: '8931-1111; local 1111',
  ...over,
});

const senate = (over: Record<string, unknown> = {}) => ({
  position: 0,
  slug: 'senate-of-the-philippines-20th-congress',
  branch: 'Legislative Branch',
  chamber: 'Senate of the Philippines (20th Congress)',
  address: 'Pasay City',
  trunkline: '(632) 8552-6601 to 70',
  website: 'www.senate.gov.ph',
  officials: [{ role: 'Senate President', name: 'A PERSON' }],
  permanentCommittees: [{ committee: 'Blue Ribbon', chairperson: 'B PERSON' }],
  houseLeaders: null,
  houseCommittees: null,
  specialCommittees: null,
  secretariatOfficials: [{ role: 'Secretary', name: 'C PERSON' }],
  houseMembers: [],
  partyListRepresentatives: [],
  ...over,
});

const house = (over: Record<string, unknown> = {}) => ({
  position: 1,
  slug: 'house-of-representatives-20th-congress',
  branch: 'Legislative Branch',
  chamber: 'House of Representatives (20th Congress)',
  address: 'Quezon City',
  trunkline: '(632) 8931-5001',
  website: 'www.congress.gov.ph',
  officials: null,
  permanentCommittees: null,
  houseLeaders: { speaker: { name: 'D PERSON', contact: { contact: 'x' } } },
  houseCommittees: { chairpersons: [{ committee: 'Accounts', name: 'E' }] },
  specialCommittees: [{ committee: 'Bases', chairperson: 'F' }],
  secretariatOfficials: [{ role: 'Secretary General', name: 'G PERSON' }],
  houseMembers: [hm()],
  partyListRepresentatives: [plr()],
  ...over,
});

/** A well-formed response whose three meta counts agree with its content. */
const okLeg = (chambers: Record<string, unknown>[] = [senate(), house()]) => ({
  _allLegislativeChambersMeta: { count: chambers.length },
  _allHouseMembersMeta: {
    count: chambers.reduce(
      (n, c) => n + (c.houseMembers as unknown[]).length,
      0
    ),
  },
  _allPartyListRepresentativesMeta: {
    count: chambers.reduce(
      (n, c) => n + (c.partyListRepresentatives as unknown[]).length,
      0
    ),
  },
  allLegislativeChambers: chambers,
});

describe('LEGISLATIVE_QUERY', () => {
  it('declares ALL THREE _all*Meta fields before the collection field', () => {
    // The CDA returns count: 0 for a _all*Meta field if ANY collection field
    // appears earlier in the same operation. With three metas this is the
    // whole ballgame — verified against the live CDA 2026-09-02.
    const collection = LEGISLATIVE_QUERY.indexOf('allLegislativeChambers(');
    for (const meta of [
      '_allLegislativeChambersMeta',
      '_allHouseMembersMeta',
      '_allPartyListRepresentativesMeta',
    ]) {
      const at = LEGISLATIVE_QUERY.indexOf(meta);
      expect(at).toBeGreaterThan(-1);
      expect(at).toBeLessThan(collection);
    }
  });

  it('orders chambers by position_ASC', () => {
    expect(LEGISLATIVE_QUERY.match(/orderBy: \[position_ASC\]/g)).toHaveLength(
      1
    );
  });

  it('requests position on both nested relations, so member order is reproducible', () => {
    // The nested relations take no orderBy argument; we sort by position
    // ourselves in the shaper, so position must be selected.
    expect(LEGISLATIVE_QUERY).toMatch(/houseMembers \{[^}]*position/s);
    expect(LEGISLATIVE_QUERY).toMatch(
      /partyListRepresentatives \{[^}]*position/s
    );
  });

  it('never requests the system timestamps', () => {
    expect(LEGISLATIVE_QUERY).not.toContain('_createdAt');
    expect(LEGISLATIVE_QUERY).not.toContain('_updatedAt');
  });

  it('requests its own page-size ceiling', () => {
    expect(LEGISLATIVE_QUERY).toContain(`first: ${LEGISLATIVE_PAGE_SIZE}`);
    expect(LEGISLATIVE_PAGE_SIZE).toBeGreaterThan(2);
  });
});

describe('query isolation — legislative', () => {
  it('LEGISLATIVE_QUERY names no other model', () => {
    for (const other of [
      'allGovernmentDepartments',
      'allExecutiveOffices',
      'allConstitutionalOffices',
    ]) {
      expect(LEGISLATIVE_QUERY).not.toContain(other);
    }
  });

  it('no other directory query names the legislative collections', () => {
    for (const q of [
      DEPARTMENTS_QUERY,
      EXECUTIVE_QUERY,
      CONSTITUTIONAL_QUERY,
    ]) {
      expect(q).not.toContain('allLegislativeChambers');
      expect(q).not.toContain('_allLegislativeChambersMeta');
      expect(q).not.toContain('_allHouseMembersMeta');
      expect(q).not.toContain('_allPartyListRepresentativesMeta');
    }
  });
});

describe('parseLegislativeResponse — shared collection gates', () => {
  it('accepts a well-formed response', () => {
    expect(
      parseLegislativeResponse(okLeg()).allLegislativeChambers
    ).toHaveLength(2);
  });

  it('accepts the real fixture', () => {
    const parsed = parseLegislativeResponse(legislativeResponse);
    expect(parsed.allLegislativeChambers).toHaveLength(2);
    expect(parsed._allHouseMembersMeta.count).toBe(254);
    expect(parsed._allPartyListRepresentativesMeta.count).toBe(61);
  });

  it('fails closed on a chamber count short of its meta', () => {
    const short = { ...okLeg(), _allLegislativeChambersMeta: { count: 3 } };
    expect(() => parseLegislativeResponse(short)).toThrow(/incomplete/i);
  });

  it('fails closed on zero chambers', () => {
    expect(() => parseLegislativeResponse(okLeg([]))).toThrow(
      /no legislative chambers/i
    );
  });

  it('fails closed at the chamber page-size ceiling', () => {
    const many = Array.from({ length: LEGISLATIVE_PAGE_SIZE }, (_, i) =>
      senate({ position: i, slug: `chamber-${i}`, chamber: `Senate ${i}` })
    );
    expect(() => parseLegislativeResponse(okLeg(many))).toThrow(/ceiling/i);
  });

  it('fails closed on a duplicate or malformed chamber slug', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ slug: senate().slug })])
      )
    ).toThrow(/duplicate slug/i);
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ slug: 'Not A Slug' }), house()]))
    ).toThrow(/not a valid slug/i);
  });

  it('fails closed on a blank chamber display name', () => {
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ chamber: '   ' }), house()]))
    ).toThrow(/blank display name/i);
  });

  it('fails closed on a null or non-integer position', () => {
    // Chamber order IS the emitted file order and the sitemap's URL order.
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ position: null }), house()]))
    ).toThrow(/unexpected legislative chambers shape/i);
    expect(() =>
      parseLegislativeResponse(okLeg([senate({ position: 1.5 }), house()]))
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a duplicate chamber position, naming both slugs', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ position: 4 }), house({ position: 4 })])
      )
    ).toThrow(
      /senate-of-the-philippines-20th-congress.*house-of-representatives-20th-congress.*duplicate position 4/s
    );
  });
});

describe('parseLegislativeResponse — chamber discriminator gate', () => {
  /**
   * senate-committees.tsx selects on chamber.includes('Senate');
   * house-members.tsx and party-list-members.tsx select on
   * chamber.includes('House of Representatives'). A CMS rename empties those
   * pages while every count still looks healthy — nothing else can catch it.
   */
  it('fails closed when no chamber matches "Senate"', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ chamber: 'Upper House' }), house()])
      )
    ).toThrow(/exactly one chamber whose name contains "Senate"/i);
  });

  it('fails closed when no chamber matches "House of Representatives"', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ chamber: 'Lower House' })])
      )
    ).toThrow(
      /exactly one chamber whose name contains "House of Representatives"/i
    );
  });

  it('fails closed when TWO chambers match the same discriminator', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house(),
          senate({
            position: 2,
            slug: 'senate-of-the-philippines-21st-congress',
            chamber: 'Senate of the Philippines (21st Congress)',
          }),
        ])
      )
    ).toThrow(/exactly one chamber whose name contains "Senate"/i);
  });

  it('accepts the real fixture, whose two chambers match one discriminator each', () => {
    expect(() => parseLegislativeResponse(legislativeResponse)).not.toThrow();
  });
});

describe('parseLegislativeResponse — member reconciliation gates', () => {
  it('fails closed when nested house members undercount their meta', () => {
    // The single most important gate: the nested relation takes no `first`
    // argument and the CDA does not error on an oversized one, so a
    // truncated relation is otherwise indistinguishable from a real shrink.
    const truncated = { ...okLeg(), _allHouseMembersMeta: { count: 9 } };
    expect(() => parseLegislativeResponse(truncated)).toThrow(
      /house members.*1 nested record.*meta reported 9/is
    );
  });

  it('fails closed when nested party-list reps undercount their meta', () => {
    const truncated = {
      ...okLeg(),
      _allPartyListRepresentativesMeta: { count: 7 },
    };
    expect(() => parseLegislativeResponse(truncated)).toThrow(
      /party-list representatives.*1 nested record.*meta reported 7/is
    );
  });

  it('fails closed at the house-members ceiling', () => {
    const members = Array.from({ length: HOUSE_MEMBERS_CEILING }, (_, i) =>
      hm({ position: i, name: `MEMBER ${i}` })
    );
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: members })])
      )
    ).toThrow(/house members count reached the ceiling/i);
  });

  it('fails closed at the party-list ceiling', () => {
    const reps = Array.from({ length: PARTY_LIST_CEILING }, (_, i) =>
      plr({ position: i, name: `REP ${i}` })
    );
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ partyListRepresentatives: reps })])
      )
    ).toThrow(/party-list representatives count reached the ceiling/i);
  });

  it('fails closed when the House chamber does not carry every house member', () => {
    // Reconciliation alone would still pass if members were re-linked to the
    // Senate: totals match, but /house-members renders empty.
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ houseMembers: [hm()] }), house({ houseMembers: [] })])
      )
    ).toThrow(/House of Representatives.*carries 0 of 1 house members/is);
  });

  it('fails closed when the House chamber does not carry every party-list rep', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({ partyListRepresentatives: [plr()] }),
          house({ partyListRepresentatives: [] }),
        ])
      )
    ).toThrow(
      /House of Representatives.*carries 0 of 1 party-list representatives/is
    );
  });
});

describe('parseLegislativeResponse — duplicate member gates', () => {
  /**
   * THE gate this branch exists for. TalaCMS currently carries two identical
   * records for DY, FAUSTINO "BOJIE" G. III / Isabela / 6th District,
   * inherited from the orphaned house_members.json. That is a CMS data
   * defect, and the sync must refuse to ship it rather than de-duplicate it
   * in code — a silent de-dup would hide the defect forever and would
   * violate the never-drop-a-record rule.
   */
  it('fails closed on two house members with the same name, province and district', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ houseMembers: [hm({ position: 0 }), hm({ position: 1 })] }),
        ])
      )
    ).toThrow(
      /duplicate house member "DELA CRUZ, JUAN M\." \(Isabela, 1st District\)/i
    );
  });

  it('names the chamber and the CMS as the place to fix it', () => {
    let message = '';
    try {
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ houseMembers: [hm({ position: 0 }), hm({ position: 1 })] }),
        ])
      );
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('house-of-representatives-20th-congress');
    expect(message).toMatch(/TalaCMS/);
  });

  it('allows two same-named members in different districts — namesakes are real', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [
              hm({ position: 0, district: '1st District' }),
              hm({ position: 1, district: '2nd District' }),
            ],
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on two party-list reps with the same name and party-list', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            partyListRepresentatives: [
              plr({ position: 0 }),
              plr({ position: 1 }),
            ],
          }),
        ])
      )
    ).toThrow(
      /duplicate party-list representative "SANTOS, MARIA C\." \(EXAMPLE\)/i
    );
  });

  it('would REJECT the CMS state as it stands today', () => {
    // Reconstructs production's known defect on top of the fixture: the
    // Speaker's record, duplicated. This is the proof the gate bites on the
    // real thing, not only on synthetic data.
    const live = structuredClone(legislativeResponse) as ReturnType<
      typeof okLeg
    >;
    const h = live.allLegislativeChambers.find(c =>
      (c.slug as string).includes('house')
    )!;
    const members = h.houseMembers as { name: string; position: number }[];
    const speaker = members.find(m =>
      m.name.startsWith('DY, FAUSTINO "BOJIE"')
    )!;
    members.push({ ...speaker, position: members.length });
    live._allHouseMembersMeta = { count: members.length };
    expect(() => parseLegislativeResponse(live)).toThrow(
      /duplicate house member/i
    );
  });
});

describe('parseLegislativeResponse — member field gates', () => {
  it('fails closed on a blank member name', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ name: '  ' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank province/city — it drives the facet dropdown', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ provinceCity: '' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank district — it renders as a Flag chip', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ houseMembers: [hm({ district: '   ' })] })])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank party-list label', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({ partyListRepresentatives: [plr({ partyList: ' ' })] }),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('accepts a null contact — the pages render it conditionally', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [hm({ contact: null })],
            partyListRepresentatives: [plr({ contact: null })],
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on a duplicate member position within a chamber', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [
              hm({ position: 3, name: 'A' }),
              hm({ position: 3, name: 'B' }),
            ],
          }),
        ])
      )
    ).toThrow(/duplicate position 3/i);
  });
});

describe('parseLegislativeResponse — committee field gates', () => {
  /**
   * senate-committees.tsx calls `.localeCompare()` directly on `committee`
   * and interpolates `chairperson` into its search string, both unconditional
   * — a malformed record here would pass sync/schema validation today and
   * then crash that page at render time.
   */
  it('fails closed when a committee is missing the committee field', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: [{ chairperson: 'A PERSON' }],
          }),
          house(),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed when a committee is missing the chairperson field', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: [{ committee: 'Blue Ribbon' }],
          }),
          house(),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank committee name', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: [{ committee: '   ', chairperson: 'A' }],
          }),
          house(),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed on a blank chairperson name', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: [
              { committee: 'Blue Ribbon', chairperson: '' },
            ],
          }),
          house(),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('fails closed when permanentCommittees is not an array', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: 'Blue Ribbon',
          }),
          house(),
        ])
      )
    ).toThrow(/unexpected legislative chambers shape/i);
  });

  it('accepts null permanentCommittees on the House — it carries none', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ permanentCommittees: null })])
      )
    ).not.toThrow();
  });

  it('accepts a well-formed committee list', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate({
            permanentCommittees: [
              { committee: 'Blue Ribbon', chairperson: 'A PERSON' },
            ],
          }),
          house(),
        ])
      )
    ).not.toThrow();
  });
});

describe('parseLegislativeResponse — Senate permanent committees gate', () => {
  /**
   * senate-committees.tsx reads permanentCommittees off the Senate chamber
   * unconditionally and renders "N of N committees" — unlike the House's
   * house_* fields, which are genuinely absent by design, an empty or null
   * Senate committee list means the whole page renders with zero results.
   * The raw schema cannot express this because it can't tell chambers apart;
   * it is gated here, after chamber identification.
   */
  it('fails closed when the Senate chamber has null permanentCommittees', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ permanentCommittees: null }), house()])
      )
    ).toThrow(/"Senate" chamber.*no permanent committees/is);
  });

  it('fails closed when the Senate chamber has an empty permanentCommittees array', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate({ permanentCommittees: [] }), house()])
      )
    ).toThrow(/"Senate" chamber.*no permanent committees/is);
  });

  it('does not require permanentCommittees on the House chamber', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([senate(), house({ permanentCommittees: null })])
      )
    ).not.toThrow();
  });
});

describe('parseLegislativeResponse — member identity serialization', () => {
  /**
   * Regression for a space-joined identity string: two DISTINCT house
   * members whose (name, provinceCity, district) tuples split the same
   * concatenated text differently would previously serialize to the same
   * "A B C D" string and be misreported as duplicates of each other.
   */
  it('does not collide house members whose fields differ only in whitespace boundary', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [
              hm({
                position: 0,
                name: 'A',
                provinceCity: 'B C',
                district: 'D',
              }),
              hm({
                position: 1,
                name: 'A B',
                provinceCity: 'C',
                district: 'D',
              }),
            ],
          }),
        ])
      )
    ).not.toThrow();
  });

  /**
   * Same regression for party-list identity, which joins only two fields
   * (name, partyList).
   */
  it('does not collide party-list reps whose fields differ only in whitespace boundary', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            partyListRepresentatives: [
              plr({ position: 0, name: 'A', partyList: 'B C' }),
              plr({ position: 1, name: 'A B', partyList: 'C' }),
            ],
          }),
        ])
      )
    ).not.toThrow();
  });

  it('still catches a genuine duplicate house member sharing every field', () => {
    expect(() =>
      parseLegislativeResponse(
        okLeg([
          senate(),
          house({
            houseMembers: [hm({ position: 0 }), hm({ position: 1 })],
          }),
        ])
      )
    ).toThrow(/duplicate house member/i);
  });
});

describe('projectHouseMembers / projectPartyList', () => {
  it('renames the CMS fields to the committed local keys, in committed key order', () => {
    expect(projectHouseMembers([hm() as never])).toEqual([
      {
        province_city: 'Isabela',
        name: 'DELA CRUZ, JUAN M.',
        district: '1st District',
        contact: '8931-0000; local 1000',
      },
    ]);
    expect(Object.keys(projectHouseMembers([hm() as never])![0])).toEqual([
      'province_city',
      'name',
      'district',
      'contact',
    ]);
    expect(projectPartyList([plr() as never])).toEqual([
      {
        party_list: 'EXAMPLE',
        name: 'SANTOS, MARIA C.',
        contact: '8931-1111; local 1111',
      },
    ]);
  });

  it('sorts by position, not by the order the relation happened to arrive in', () => {
    const out = projectHouseMembers([
      hm({ position: 2, name: 'C' }),
      hm({ position: 0, name: 'A' }),
      hm({ position: 1, name: 'B' }),
    ] as never);
    expect(out!.map(m => m.name)).toEqual(['A', 'B', 'C']);
  });

  it('omits a null contact rather than emitting contact: null', () => {
    const out = projectHouseMembers([hm({ contact: null }) as never])!;
    expect(out[0]).not.toHaveProperty('contact');
    expect(
      projectPartyList([plr({ contact: null }) as never])![0]
    ).not.toHaveProperty('contact');
  });

  it('returns null for an empty relation, so the key is omitted entirely', () => {
    // The Senate record has no house_members key at all in the committed
    // file — not an empty array. applyFieldMap preserves [] as a present
    // value, so the projection must hand it null instead.
    expect(projectHouseMembers([])).toBeNull();
    expect(projectPartyList([])).toBeNull();
  });
});

describe('shapeLegislative', () => {
  const shaped = () =>
    shapeLegislative(
      parseLegislativeResponse(legislativeResponse).allLegislativeChambers
    );

  it('reproduces the committed file, content for content', () => {
    const out = shaped();
    const expected = structuredClone(expectedLegislative) as Record<
      string,
      unknown
    >[];
    // ACCEPTED DELTA 1, applied to the expected side so the rest of the
    // record is still compared strictly.
    for (const p of expected[1].party_list_representatives as {
      party_list: string;
    }[]) {
      if (p.party_list === 'MANILA TEACHERS') p.party_list = 'Manila Teachers';
    }
    expect(out).toHaveLength(expected.length);
    for (const [i, rec] of out.entries()) {
      expect(sortDeep(rec)).toEqual(sortDeep(expected[i]));
    }
  });

  it('reproduces the committed key order EXACTLY, for both records', () => {
    // Unlike Constitutional, exact agreement is reachable here: one ordered
    // field map covers both chambers because applyFieldMap omits absent keys.
    // Measured 2/2 on 2026-09-09. This is a hard equality, not a baseline.
    const out = shaped();
    for (const [i, rec] of out.entries()) {
      expect(Object.keys(rec)).toEqual(
        Object.keys(expectedLegislative[i] as object)
      );
    }
  });

  it('emits records in committed file order', () => {
    expect(shaped().map(r => r.slug)).toEqual(
      (expectedLegislative as { slug: string }[]).map(r => r.slug)
    );
  });

  it('never emits position, at the chamber or the member level', () => {
    for (const rec of shaped()) {
      expect(rec).not.toHaveProperty('position');
      for (const key of ['house_members', 'party_list_representatives']) {
        for (const m of (rec[key] as { position?: number }[]) ?? []) {
          expect(m).not.toHaveProperty('position');
        }
      }
    }
  });

  it('omits the House-only keys from the Senate record and vice versa', () => {
    const [senateRec, houseRec] = shaped();
    for (const k of [
      'house_leaders',
      'house_members',
      'party_list_representatives',
      'house_committees',
      'special_committees',
    ]) {
      expect(senateRec).not.toHaveProperty(k);
    }
    for (const k of ['officials', 'permanent_committees']) {
      expect(houseRec).not.toHaveProperty(k);
    }
  });

  it('preserves the exact member counts the two pages display', () => {
    const houseRec = shaped()[1];
    expect(houseRec.house_members).toHaveLength(254);
    expect(houseRec.party_list_representatives).toHaveLength(61);
  });

  it('leaves every member name byte-identical to the fixture', () => {
    // .trim() on the member schemas is a transform; zero live rows carry
    // surrounding whitespace, so the output must be unchanged by it.
    const houseRec = shaped()[1];
    const expectedHouse = expectedLegislative[1] as {
      house_members: { name: string }[];
    };
    expect(
      (houseRec.house_members as { name: string }[]).map(m => m.name)
    ).toEqual(expectedHouse.house_members.map(m => m.name));
  });

  it('is pure — it never mutates its input', () => {
    const parsed = parseLegislativeResponse(legislativeResponse);
    const before = JSON.stringify(parsed);
    shapeLegislative(parsed.allLegislativeChambers);
    expect(JSON.stringify(parsed)).toBe(before);
  });
});

describe('legislative candidate emission', () => {
  it('emits the candidate against the tracked legislative schema', () => {
    const c = buildLegislativeCandidate(
      parseLegislativeResponse(legislativeResponse)
    );
    expect(c.path).toBe('src/data/directory/legislative.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/legislative.schema.json'
    );
    expect(c.data).toHaveLength(2);
  });

  it('builds the candidate without reference to the other models', () => {
    expect(buildLegislativeCandidate.length).toBe(1);
  });

  it('produces a candidate that satisfies the tracked JSON Schema', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare(
        buildLegislativeCandidate(parseLegislativeResponse(legislativeResponse))
      )
    ).resolves.toMatchObject({ path: 'src/data/directory/legislative.json' });
  });

  it('would REJECT a record missing the required chamber field', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [{ slug: 'x', branch: 'Legislative Branch' }],
      })
    ).rejects.toThrow(/does not satisfy/);
  });

  it('would REJECT a house member missing province_city — the schema gate bites', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [
          {
            slug: 'x',
            branch: 'Legislative Branch',
            chamber: 'House of Representatives (20th Congress)',
            house_members: [{ name: 'A', district: '1st District' }],
          },
        ],
      })
    ).rejects.toThrow(/does not satisfy/);
  });

  it('would REJECT a whitespace-only committee name — minLength alone cannot catch it', async () => {
    // minLength counts characters, so "   " satisfies minLength: 1. The
    // pattern: "\\S" requirement is what actually enforces "not blank" at the
    // JSON Schema layer, matching Zod's .trim().min(1) on the same field.
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [
          {
            slug: 'x',
            branch: 'Legislative Branch',
            chamber: 'Senate of the Philippines (20th Congress)',
            permanent_committees: [{ committee: '   ', chairperson: 'A' }],
          },
        ],
      })
    ).rejects.toThrow(/does not satisfy/);
  });

  it('would REJECT a whitespace-only chairperson name', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/legislative.json',
        schemaPath: 'src/data/directory/schema/legislative.schema.json',
        data: [
          {
            slug: 'x',
            branch: 'Legislative Branch',
            chamber: 'Senate of the Philippines (20th Congress)',
            permanent_committees: [
              { committee: 'Blue Ribbon', chairperson: '   ' },
            ],
          },
        ],
      })
    ).rejects.toThrow(/does not satisfy/);
  });
});

/* ------------------------------------------------------------------ */
/*  Diplomatic                                                         */
/* ------------------------------------------------------------------ */

/** One valid diplomatic record, overridable per test. */
const dip = (over: Partial<RawDiplomatic> = {}): RawDiplomatic => ({
  position: 0,
  slug: 'holy-see',
  entityType: 'Diplomatic Mission',
  name: 'Apostolic Nunciature',
  country: 'HOLY SEE',
  address: '2140 Taft Avenue, Manila',
  contact: '8521-0306',
  email: null,
  website: null,
  representative: 'H.E. MOST REV. CHARLES JOHN BROWN',
  title: 'Apostolic Nuncio',
  ...over,
});

const dipResponse = (records: RawDiplomatic[]) => ({
  _allDiplomaticEntitiesMeta: { count: records.length },
  allDiplomaticEntities: records,
});

describe('query isolation — diplomatic', () => {
  it('DIPLOMATIC_QUERY is one operation over only its own collection', () => {
    expect(DIPLOMATIC_QUERY).toContain('allDiplomaticEntities');
    expect(DIPLOMATIC_QUERY).toContain('_allDiplomaticEntitiesMeta');
    for (const other of [
      'allGovernmentDepartments',
      'allExecutiveOffices',
      'allConstitutionalOffices',
      'allLegislativeChambers',
    ]) {
      expect(DIPLOMATIC_QUERY).not.toContain(other);
    }
  });

  it('declares the meta field BEFORE the collection field', () => {
    // The CDA returns count: 0 for any _all*Meta field that follows a
    // collection field in the same operation. Do not reorder.
    expect(DIPLOMATIC_QUERY.indexOf('_allDiplomaticEntitiesMeta')).toBeLessThan(
      DIPLOMATIC_QUERY.indexOf('allDiplomaticEntities(')
    );
  });

  it('orders by position_ASC and requests the whole collection in one page', () => {
    expect(DIPLOMATIC_QUERY).toContain('orderBy: [position_ASC]');
    expect(DIPLOMATIC_QUERY).toContain(`first: ${DIPLOMATIC_PAGE_SIZE}`);
  });

  it('stays below the CDA hard cap of 500', () => {
    expect(DIPLOMATIC_PAGE_SIZE).toBeLessThanOrEqual(500);
    expect(DIPLOMATIC_PAGE_SIZE).toBeGreaterThan(227);
  });

  it('never selects `details` — it is null on every live record', () => {
    expect(DIPLOMATIC_QUERY).not.toContain('details');
  });

  it('the other queries never mention the diplomatic collection', () => {
    for (const q of [
      DEPARTMENTS_QUERY,
      EXECUTIVE_QUERY,
      CONSTITUTIONAL_QUERY,
      LEGISLATIVE_QUERY,
    ]) {
      expect(q).not.toContain('DiplomaticEntities');
    }
  });
});

describe('parseDiplomaticResponse', () => {
  it('accepts the live fixture', () => {
    const parsed = parseDiplomaticResponse(diplomaticResponse);
    expect(parsed.allDiplomaticEntities).toHaveLength(227);
    expect(parsed._allDiplomaticEntitiesMeta.count).toBe(227);
  });

  it('accepts a record with a null slug — 157 live records have one', () => {
    // Fillers of the other two entityTypes so the collection satisfies the
    // separately-tested "every entityType present" gate; this test is only
    // about the null-slug record.
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ slug: null, entityType: 'Consulate' }),
          dip({ position: 1, slug: 'filler-mission' }),
          dip({
            position: 2,
            slug: 'filler-org',
            entityType: 'International Organization',
          }),
        ])
      )
    ).not.toThrow();
  });

  it('accepts a null title — 4 live records have one', () => {
    // Fillers of the other two entityTypes, same reasoning as above.
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ title: null }),
          dip({
            position: 1,
            slug: 'filler-consulate',
            entityType: 'Consulate',
          }),
          dip({
            position: 2,
            slug: 'filler-org',
            entityType: 'International Organization',
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on a count/length mismatch', () => {
    expect(() =>
      parseDiplomaticResponse({
        _allDiplomaticEntitiesMeta: { count: 227 },
        allDiplomaticEntities: [dip()],
      })
    ).toThrow(/incomplete diplomatic entities list/i);
  });

  it('fails closed on an empty collection', () => {
    expect(() => parseDiplomaticResponse(dipResponse([]))).toThrow(
      /no diplomatic entities/i
    );
  });

  it('fails closed at the page-size ceiling', () => {
    const many = Array.from({ length: DIPLOMATIC_PAGE_SIZE }, (_, i) =>
      dip({ position: i, slug: `m-${i}` })
    );
    expect(() => parseDiplomaticResponse(dipResponse(many))).toThrow(
      /page-size ceiling/i
    );
  });

  it('fails closed on an unknown entityType', () => {
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ entityType: 'Embassy' })]))
    ).toThrow(/entityType "Embassy" is not one of/i);
  });

  it('fails closed on a blank entityType', () => {
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ entityType: '   ' })]))
    ).toThrow(/entityType/i);
  });

  it('fails closed on a blank name', () => {
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ name: '  ' })]))
    ).toThrow(/blank display name/i);
  });

  it('fails closed on a null position', () => {
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([dip({ position: null as unknown as number })])
      )
    ).toThrow(/unexpected diplomatic entities shape/i);
  });

  it('fails closed on a non-integer position', () => {
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ position: 1.5 })]))
    ).toThrow(/unexpected diplomatic entities shape/i);
  });

  it('fails closed on duplicate positions', () => {
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ position: 3, slug: 'a' }),
          dip({ position: 3, slug: 'b' }),
        ])
      )
    ).toThrow(/duplicate position 3/i);
  });

  it('tolerates gaps in position — retiring a record is normal', () => {
    // Fillers of the other two entityTypes, same reasoning as above.
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ position: 0, slug: 'a' }),
          dip({ position: 900, slug: 'b' }),
          dip({
            position: 1,
            slug: 'filler-consulate',
            entityType: 'Consulate',
          }),
          dip({
            position: 2,
            slug: 'filler-org',
            entityType: 'International Organization',
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on a duplicate non-null slug', () => {
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ position: 0, slug: 'japan' }),
          dip({ position: 1, slug: 'japan' }),
        ])
      )
    ).toThrow(/duplicate slug "japan"/i);
  });

  it('does NOT treat two null slugs as a duplicate', () => {
    // 157 live records carry slug: null. Uniqueness applies only to the
    // records that actually have one. Fillers of the other two entityTypes,
    // same reasoning as above.
    expect(() =>
      parseDiplomaticResponse(
        dipResponse([
          dip({ position: 0, slug: null, entityType: 'Consulate' }),
          dip({ position: 1, slug: null, entityType: 'Consulate' }),
          dip({ position: 2, slug: 'filler-mission' }),
          dip({
            position: 3,
            slug: 'filler-org',
            entityType: 'International Organization',
          }),
        ])
      )
    ).not.toThrow();
  });

  it('fails closed on a malformed slug', () => {
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ slug: 'Holy See' })]))
    ).toThrow(/not a valid slug/i);
  });

  it('fails closed when an entityType disappears entirely', () => {
    // A group that empties out would silently emit `[]` for a whole page.
    expect(() =>
      parseDiplomaticResponse(dipResponse([dip({ entityType: 'Consulate' })]))
    ).toThrow(/no records for entityType "Diplomatic Mission"/i);
  });

  it('fails closed on an unexpected envelope shape', () => {
    expect(() => parseDiplomaticResponse({ nope: 1 })).toThrow(
      /unexpected diplomatic entities shape/i
    );
  });
});

/**
 * The ONE known content difference between TalaCMS and the pre-migration
 * fixture, as an explicit allowlist rather than a code workaround.
 *
 * `holy-see`'s office_name carries a stray trailing period in the CMS. It is
 * CMS content drift and is fixed by editing the CMS, not by normalizing in
 * the shaper. This allowlist is written so it passes BOTH before and after
 * that edit: the test asserts every difference is IN the list, never that a
 * listed difference is present. When the CMS is corrected, delete the entry.
 */
const KNOWN_CMS_DRIFT: {
  type: string;
  index: number;
  field: string;
  cms: string;
  fixture: string;
}[] = [
  {
    type: 'Diplomatic Mission',
    index: 0,
    field: 'office_name',
    cms: 'Apostolic Nunciature.',
    fixture: 'Apostolic Nunciature',
  },
];

describe('shapeDiplomatic', () => {
  const shaped = () => shapeDiplomatic(rawDiplomatic);

  it('emits exactly the three contract keys, in the fixture order', () => {
    expect(Object.keys(shaped())).toEqual([
      'Diplomatic Mission',
      'Consulate',
      'International Organization',
    ]);
  });

  it('groups every record into the right bucket, with exact counts', () => {
    const out = shaped();
    expect(out['Diplomatic Mission']).toHaveLength(70);
    expect(out['Consulate']).toHaveLength(139);
    expect(out['International Organization']).toHaveLength(18);
  });

  it('reproduces the tracked fixture exactly, modulo the known CMS drift', () => {
    const out = shaped() as unknown as Record<
      string,
      Record<string, unknown>[]
    >;
    const fixture = expectedDiplomatic as unknown as Record<
      string,
      Record<string, unknown>[]
    >;
    const differences: string[] = [];
    for (const type of Object.keys(fixture)) {
      out[type].forEach((rec, i) => {
        const exp = fixture[type][i];
        for (const key of new Set([...Object.keys(rec), ...Object.keys(exp)])) {
          if (JSON.stringify(rec[key]) !== JSON.stringify(exp[key])) {
            const allowed = KNOWN_CMS_DRIFT.some(
              d => d.type === type && d.index === i && d.field === key
            );
            if (!allowed) {
              differences.push(
                `${type}[${i}].${key}: ${JSON.stringify(rec[key])} !== ${JSON.stringify(exp[key])}`
              );
            }
          }
        }
      });
    }
    expect(differences).toEqual([]);
  });

  it('reproduces the fixture key order exactly, 227/227', () => {
    // Unlike Departments (14/23) and Constitutional (103/229), the diplomatic
    // field maps reproduce the committed key order for EVERY record. This is
    // an exact pin, not a floor: if it ever regresses, the field maps changed.
    const out = shaped() as unknown as Record<
      string,
      Record<string, unknown>[]
    >;
    const fixture = expectedDiplomatic as unknown as Record<
      string,
      Record<string, unknown>[]
    >;
    let agree = 0;
    let total = 0;
    for (const type of Object.keys(fixture)) {
      out[type].forEach((rec, i) => {
        total++;
        if (Object.keys(rec).join() === Object.keys(fixture[type][i]).join()) {
          agree++;
        }
      });
    }
    expect(total).toBe(227);
    expect(agree).toBe(227);
  });

  it('preserves title: null on exactly the four live records', () => {
    const withNullTitle = shaped()
      ['Diplomatic Mission'].filter(r => r.title === null)
      .map(r => r.slug);
    expect(withNullTitle).toEqual([
      'colombia',
      'nigeria',
      'palestine',
      'papua-new-guinea',
    ]);
  });

  it('keeps the title KEY present when the value is null', () => {
    // Distinct from the assertion above: `undefined === null` is false but
    // `{}.title === null` is also false, so absence must be ruled out directly.
    const rec = shapeDiplomatic([dip({ title: null })])[
      'Diplomatic Mission'
    ][0];
    expect('title' in rec).toBe(true);
    expect(rec.title).toBeNull();
  });

  it('omits every OTHER null rather than emitting it', () => {
    const rec = shapeDiplomatic([
      dip({ website: null, email: null, contact: null, representative: null }),
    ])['Diplomatic Mission'][0];
    for (const key of ['website', 'email', 'contact', 'representative']) {
      expect(key in rec).toBe(false);
    }
  });

  it('omits empty strings — the Holy See carries email:"" and website:""', () => {
    const rec = shapeDiplomatic([dip({ email: '', website: '' })])[
      'Diplomatic Mission'
    ][0];
    expect('email' in rec).toBe(false);
    expect('website' in rec).toBe(false);
  });

  it('maps name to office_name for missions and consulates', () => {
    const out = shapeDiplomatic([
      dip({ name: 'Australian Embassy' }),
      dip({
        position: 1,
        slug: null,
        entityType: 'Consulate',
        name: 'Consulate of X',
      }),
    ]);
    expect(out['Diplomatic Mission'][0].office_name).toBe('Australian Embassy');
    expect(out['Consulate'][0].office_name).toBe('Consulate of X');
  });

  it('maps name to organization_name and representative to head for organizations', () => {
    const rec = shapeDiplomatic([
      dip({
        position: 2,
        slug: null,
        entityType: 'International Organization',
        name: 'ASIAN DEVELOPMENT BANK',
        representative: 'MR. ASAKAWA MASATSUGU',
        country: null,
      }),
    ])['International Organization'][0];
    expect(rec.organization_name).toBe('ASIAN DEVELOPMENT BANK');
    expect(rec.head).toBe('MR. ASAKAWA MASATSUGU');
    expect('office_name' in rec).toBe(false);
    expect('representative' in rec).toBe(false);
    expect('country' in rec).toBe(false);
  });

  it('never emits slug for consulates or organizations', () => {
    const out = shapeDiplomatic(rawDiplomatic);
    expect(out['Consulate'].every(r => !('slug' in r))).toBe(true);
    expect(out['International Organization'].every(r => !('slug' in r))).toBe(
      true
    );
    expect(
      out['Diplomatic Mission'].every(r => typeof r.slug === 'string')
    ).toBe(true);
  });

  it('never emits position, entityType, or details', () => {
    const out = shapeDiplomatic(rawDiplomatic);
    for (const recs of Object.values(out)) {
      for (const r of recs) {
        expect('position' in r).toBe(false);
        expect('entityType' in r).toBe(false);
        expect('details' in r).toBe(false);
      }
    }
  });

  it('sorts each group strictly by position ascending', () => {
    const out = shapeDiplomatic([
      dip({ position: 900, slug: 'third' }),
      dip({ position: 0, slug: 'first' }),
      dip({ position: 5, slug: 'second' }),
    ]);
    expect(out['Diplomatic Mission'].map(r => r.slug)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('emits all three keys even when a group is empty', () => {
    // shapeDiplomatic is pure and callable directly; the parse gate is what
    // refuses an empty group in a real sync. The shape must still be complete.
    const out = shapeDiplomatic([dip()]);
    expect(Object.keys(out)).toEqual([
      'Diplomatic Mission',
      'Consulate',
      'International Organization',
    ]);
    expect(out['Consulate']).toEqual([]);
  });

  it('is pure — it never mutates its input', () => {
    const input = [
      dip({ position: 5, slug: 'b' }),
      dip({ position: 0, slug: 'a' }),
    ];
    const before = JSON.stringify(input);
    shapeDiplomatic(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('applyFieldMap preserveNulls (via the other models)', () => {
  it('leaves Departments, Executive and Constitutional null-omitting', () => {
    // preserveNulls is opt-in. Proven here by the fact that Constitutional's
    // own fixture comparison still passes with nulls absent.
    const rec = shapeConstitutional([
      con({ description: null, phone: null }) as never,
    ])[0];
    expect('description' in rec).toBe(false);
    expect('phone' in rec).toBe(false);
  });
});

describe('diplomatic candidate emission', () => {
  const raw = () => ({
    _allDiplomaticEntitiesMeta: { count: rawDiplomatic.length },
    allDiplomaticEntities: rawDiplomatic,
  });

  it('emits the candidate against the tracked diplomatic schema', () => {
    const c = buildDiplomaticCandidate(raw());
    expect(c.path).toBe('src/data/directory/diplomatic.json');
    expect(c.schemaPath).toBe(
      'src/data/directory/schema/diplomatic.schema.json'
    );
  });

  it('emits an OBJECT, not an array — the contract is three keyed groups', () => {
    const c = buildDiplomaticCandidate(raw());
    expect(Array.isArray(c.data)).toBe(false);
    expect(Object.keys(c.data as object)).toEqual([
      'Diplomatic Mission',
      'Consulate',
      'International Organization',
    ]);
  });

  it('builds the candidate without reference to the other models', () => {
    expect(buildDiplomaticCandidate.length).toBe(1);
  });

  it('produces a candidate that satisfies the tracked JSON Schema', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare(buildDiplomaticCandidate(raw()))
    ).resolves.toMatchObject({ path: 'src/data/directory/diplomatic.json' });
  });

  it('would REJECT a candidate missing an entity-type key — the schema gate bites', async () => {
    const { prepare } = await import('../write');
    await expect(
      prepare({
        path: 'src/data/directory/diplomatic.json',
        schemaPath: 'src/data/directory/schema/diplomatic.schema.json',
        data: { 'Diplomatic Mission': [], Consulate: [] },
      })
    ).rejects.toThrow(/does not satisfy/);
  });
});

describe('candidateSlugs', () => {
  const c = (data: unknown) => ({
    path: 'x.json',
    schemaPath: 'x.schema.json',
    data,
  });

  it('extracts slugs from a flat array candidate', () => {
    expect(candidateSlugs(c([{ slug: 'a' }, { slug: 'b' }]))).toEqual([
      'a',
      'b',
    ]);
  });

  it('extracts slugs from a grouped object-of-arrays candidate', () => {
    expect(
      candidateSlugs(
        c({
          'Diplomatic Mission': [{ slug: 'japan' }, { slug: 'peru' }],
          Consulate: [{ country: 'ALBANIA' }],
          'International Organization': [],
        })
      )
    ).toEqual(['japan', 'peru']);
  });

  it('extracts the slug from a single-object candidate (the LGU shape)', () => {
    expect(
      candidateSlugs(c({ slug: 'region-i-ilocos-region', provinces: [] }))
    ).toEqual(['region-i-ilocos-region']);
  });

  it('skips records with no slug rather than emitting undefined', () => {
    expect(
      candidateSlugs(c([{ slug: 'a' }, { country: 'X' }, { slug: 'b' }]))
    ).toEqual(['a', 'b']);
  });

  it('skips non-string slugs', () => {
    expect(
      candidateSlugs(c([{ slug: 'a' }, { slug: 42 }, { slug: null }]))
    ).toEqual(['a']);
  });

  it('returns an empty array for a candidate with no slugs anywhere', () => {
    expect(candidateSlugs(c({ categories: [{ category: 'X' }] }))).toEqual([]);
  });
});

describe('assertNoCrossModelSlugCollisions — grouped candidates', () => {
  const candidate = (path: string, data: unknown) => ({
    path,
    schemaPath: 'x.schema.json',
    data,
  });

  it('does not throw on a grouped candidate with no collision', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('src/data/directory/departments.json', [{ slug: 'doh' }]),
        candidate('src/data/directory/diplomatic.json', {
          'Diplomatic Mission': [{ slug: 'japan' }],
          Consulate: [{ country: 'ALBANIA' }],
          'International Organization': [],
        }),
      ])
    ).not.toThrow();
  });

  it('detects a collision between a grouped and a flat candidate', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('src/data/directory/departments.json', [{ slug: 'japan' }]),
        candidate('src/data/directory/diplomatic.json', {
          'Diplomatic Mission': [{ slug: 'japan' }],
          Consulate: [],
          'International Organization': [],
        }),
      ])
    ).toThrow(/departments\.json.*diplomatic\.json/s);
  });

  it('names the colliding slug in the error', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('a.json', [{ slug: 'japan' }]),
        candidate('b.json', { G: [{ slug: 'japan' }] }),
      ])
    ).toThrow(/japan/);
  });

  it('ignores slugless records entirely — 157 diplomatic records have none', () => {
    expect(() =>
      assertNoCrossModelSlugCollisions([
        candidate('a.json', [{ country: 'X' }]),
        candidate('b.json', { G: [{ country: 'X' }] }),
      ])
    ).not.toThrow();
  });

  it('the real diplomatic candidate collides with none of the other models', () => {
    // Empirically verified 2026-09-09: the 70 mission slugs collide with
    // nothing across departments, executive, constitutional or legislative.
    expect(() =>
      assertNoCrossModelSlugCollisions([
        buildDepartmentsCandidate({
          _allGovernmentDepartmentsMeta: { count: rawDepartments.length },
          allGovernmentDepartments: rawDepartments,
        }),
        buildExecutiveCandidate({
          _allExecutiveOfficesMeta: { count: rawExecutive.length },
          allExecutiveOffices: rawExecutive,
        }),
        buildConstitutionalCandidate({
          _allConstitutionalOfficesMeta: { count: rawConstitutional.length },
          allConstitutionalOffices: rawConstitutional,
        }),
        buildDiplomaticCandidate({
          _allDiplomaticEntitiesMeta: { count: rawDiplomatic.length },
          allDiplomaticEntities: rawDiplomatic,
        }),
      ])
    ).not.toThrow();
  });
});
