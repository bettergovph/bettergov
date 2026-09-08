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
  assertNoCrossModelSlugCollision,
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
import departmentsResponse from './fixtures/departments-response.json';
import executiveResponse from './fixtures/executive-response.json';
import constitutionalResponse from './fixtures/constitutional-response.json';
import expectedDepartments from '../../../src/data/directory/__fixtures__/departments.expected.json';
import expectedExecutive from '../../../src/data/directory/__fixtures__/executive.expected.json';
import expectedConstitutional from '../../../src/data/directory/__fixtures__/constitutional.expected.json';
import type {
  RawDepartment,
  RawExecutive,
  RawConstitutional,
} from '../directory';

const rawDepartments =
  departmentsResponse.allGovernmentDepartments as unknown as RawDepartment[];
const rawExecutive =
  executiveResponse.allExecutiveOffices as unknown as RawExecutive[];
const rawConstitutional =
  constitutionalResponse.allConstitutionalOffices as unknown as RawConstitutional[];

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

describe('assertNoCrossModelSlugCollision', () => {
  const candidate = (path: string, slugs: string[]) => ({
    path,
    schemaPath: 'unused',
    data: slugs.map(slug => ({ slug })),
  });

  it('passes when the two models share no slug', () => {
    expect(() =>
      assertNoCrossModelSlugCollision(
        candidate('d', ['department-of-x']),
        candidate('e', ['office-of-y'])
      )
    ).not.toThrow();
  });

  it('fails closed when a department and an executive office share a slug', () => {
    expect(() =>
      assertNoCrossModelSlugCollision(
        candidate('d', ['shared-slug']),
        candidate('e', ['shared-slug'])
      )
    ).toThrow(/shared-slug/);
  });

  it('names every colliding slug, not just the first', () => {
    expect(() =>
      assertNoCrossModelSlugCollision(
        candidate('d', ['a', 'b', 'c']),
        candidate('e', ['a', 'c'])
      )
    ).toThrow(/a.*c/s);
  });

  it('passes against the real generated candidates', () => {
    expect(() =>
      assertNoCrossModelSlugCollision(
        buildDepartmentsCandidate({
          _allGovernmentDepartmentsMeta: { count: rawDepartments.length },
          allGovernmentDepartments: rawDepartments,
        }),
        buildExecutiveCandidate({
          _allExecutiveOfficesMeta: { count: rawExecutive.length },
          allExecutiveOffices: rawExecutive,
        })
      )
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
