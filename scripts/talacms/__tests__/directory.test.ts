import { describe, it, expect } from 'vitest';
import {
  DEPARTMENTS_QUERY,
  EXECUTIVE_QUERY,
  parseDepartmentsResponse,
  parseExecutiveResponse,
} from '../directory';
import { shapeDepartments, shapeExecutive, sortForOutput } from '../directory';
import departmentsResponse from './fixtures/departments-response.json';
import executiveResponse from './fixtures/executive-response.json';
import expectedDepartments from '../../../src/data/directory/__fixtures__/departments.expected.json';
import expectedExecutive from '../../../src/data/directory/__fixtures__/executive.expected.json';
import type { RawDepartment, RawExecutive } from '../directory';

const rawDepartments =
  departmentsResponse.allGovernmentDepartments as unknown as RawDepartment[];
const rawExecutive =
  executiveResponse.allExecutiveOffices as unknown as RawExecutive[];

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
