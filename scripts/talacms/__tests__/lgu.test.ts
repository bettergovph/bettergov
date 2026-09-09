import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  LGU_REGIONS_CEILING,
  LGU_PROVINCES_CEILING,
  LGU_CITIES_CEILING,
  LGU_MUNICIPALITIES_CEILING,
  lguRegionsPageQuery,
  lguProvincesPageQuery,
  lguCitiesPageQuery,
  lguMunicipalitiesPageQuery,
  parseLguRegions,
  parseLguProvinces,
  parseLguCities,
  parseLguMunicipalities,
  joinLgu,
  shapeLguRegion,
  buildLguCandidates,
  fetchLgu,
  type RawLguRegion,
  type RawLguProvince,
  type RawLguCity,
  type RawLguMunicipality,
  type JoinedRegion,
} from '../lgu';
import type { TalaCmsClient } from '../client';
import lguResponse from './fixtures/lgu-response.json';

const REPO_ROOT = process.cwd();

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

const rawRegions = lguResponse.allLguRegions as unknown as RawLguRegion[];
const rawProvinces = lguResponse.allLguProvinces as unknown as RawLguProvince[];
const rawCities = lguResponse.allLguCities as unknown as RawLguCity[];
const rawMunicipalities =
  lguResponse.allLguMunicipalities as unknown as RawLguMunicipality[];

function joinFixture(): JoinedRegion[] {
  return joinLgu(
    parseLguRegions(rawRegions),
    parseLguProvinces(rawProvinces),
    parseLguCities(rawCities),
    parseLguMunicipalities(rawMunicipalities)
  );
}

// ---------------------------------------------------------------------------
// Minimal record builders for the gate tests below.
// ---------------------------------------------------------------------------

const region = (over: Partial<RawLguRegion> = {}): RawLguRegion => ({
  id: 'r0',
  position: 0,
  slug: 'test-region',
  region: 'TEST REGION',
  ...over,
});

const official = (over: Record<string, unknown> = {}) => ({
  name: 'JUAN A. DELA CRUZ',
  contact: null,
  email: null,
  ...over,
});

const province = (over: Partial<RawLguProvince> = {}): RawLguProvince => ({
  id: 'p0',
  position: 0,
  province: 'Test Province',
  region: { id: 'r0' },
  ...over,
});

const city = (over: Partial<RawLguCity> = {}): RawLguCity => ({
  id: 'c0',
  position: 0,
  city: 'Test City',
  zipCode: null,
  mayor: official(),
  viceMayor: official({ name: 'ANA B. SANTOS' }),
  region: { id: 'r0' },
  province: { id: 'p0' },
  ...over,
});

const municipality = (
  over: Partial<RawLguMunicipality> = {}
): RawLguMunicipality => ({
  id: 'm0',
  position: 0,
  municipality: 'Test Municipality',
  zipCode: null,
  mayor: official(),
  viceMayor: official({ name: 'ANA B. SANTOS' }),
  region: { id: 'r0' },
  province: { id: 'p0' },
  ...over,
});

// A minimal region/province/city/muni set with one of everything, valid.
function minimalOk(): {
  regions: RawLguRegion[];
  provinces: RawLguProvince[];
  cities: RawLguCity[];
  municipalities: RawLguMunicipality[];
} {
  return {
    regions: [region()],
    provinces: [province()],
    cities: [city()],
    municipalities: [],
  };
}

// ---------------------------------------------------------------------------
// Step 1: queries and ceilings
// ---------------------------------------------------------------------------

describe('ceilings', () => {
  it("are set well above today's counts", () => {
    expect(LGU_REGIONS_CEILING).toBeGreaterThan(19);
    expect(LGU_PROVINCES_CEILING).toBeGreaterThan(80);
    expect(LGU_CITIES_CEILING).toBeGreaterThan(110);
    expect(LGU_MUNICIPALITIES_CEILING).toBeGreaterThan(1435);
  });
});

describe.each([
  ['lguRegionsPageQuery', lguRegionsPageQuery, 'allLguRegions'],
  ['lguProvincesPageQuery', lguProvincesPageQuery, 'allLguProvinces'],
  ['lguCitiesPageQuery', lguCitiesPageQuery, 'allLguCities'],
  [
    'lguMunicipalitiesPageQuery',
    lguMunicipalitiesPageQuery,
    'allLguMunicipalities',
  ],
])('%s', (_name, builder, collectionField) => {
  const doc = builder(10, 500);

  it('orders by id_ASC', () => {
    expect(doc).toContain('orderBy: [id_ASC]');
  });

  it('never selects a meta field', () => {
    expect(doc).not.toContain('Meta');
  });

  it('selects the named collection field', () => {
    expect(doc).toContain(`${collectionField}(`);
  });

  it('applies the given skip and first', () => {
    expect(doc).toContain('skip: 10');
    expect(doc).toContain('first: 500');
  });
});

describe('field selection', () => {
  it('selects slug only on regions', () => {
    expect(lguRegionsPageQuery(0, 1)).toContain('slug');
    expect(lguProvincesPageQuery(0, 1)).not.toContain('slug');
    expect(lguCitiesPageQuery(0, 1)).not.toContain('slug');
    expect(lguMunicipalitiesPageQuery(0, 1)).not.toContain('slug');
  });

  it('selects region and province back-references on cities and municipalities', () => {
    for (const doc of [
      lguCitiesPageQuery(0, 1),
      lguMunicipalitiesPageQuery(0, 1),
    ]) {
      expect(doc).toContain('region {');
      expect(doc).toContain('province {');
      expect(doc).toContain('mayor {');
      expect(doc).toContain('viceMayor {');
    }
  });

  it('selects only region (not province) on provinces', () => {
    const doc = lguProvincesPageQuery(0, 1);
    expect(doc).toContain('region {');
    expect(doc).not.toContain('province {');
  });
});

// ---------------------------------------------------------------------------
// Step 2/3: parse + region-level gates
// ---------------------------------------------------------------------------

describe('parseLguRegions', () => {
  it('accepts a well-formed region list', () => {
    expect(() => parseLguRegions([region()])).not.toThrow();
  });

  it('fails a region slug that does not match the slug pattern, naming the region', () => {
    expect(() => parseLguRegions([region({ slug: 'Not_A_Slug' })])).toThrow(
      /\[sync:lgu\].*TEST REGION.*slug/
    );
  });

  it('fails on a duplicate region slug', () => {
    expect(() =>
      parseLguRegions([
        region({ id: 'r0', slug: 'dup' }),
        region({ id: 'r1', slug: 'dup' }),
      ])
    ).toThrow(/\[sync:lgu\].*duplicate.*slug "dup"/);
  });

  it('fails on a duplicate region position', () => {
    expect(() =>
      parseLguRegions([
        region({ id: 'r0', slug: 'a', position: 0 }),
        region({ id: 'r1', slug: 'b', position: 0 }),
      ])
    ).toThrow(/\[sync:lgu\].*duplicate position/);
  });

  it('fails an unknown key inside mayor via .strict()', () => {
    expect(() =>
      parseLguCities([
        city({ mayor: { ...official(), unexpectedField: 'x' } as never }),
      ])
    ).toThrow(/\[sync:lgu\]/);
  });
});

// ---------------------------------------------------------------------------
// Step 3: referential gates (need joinLgu, since they're cross-collection)
// ---------------------------------------------------------------------------

describe('joinLgu referential gates', () => {
  it('fails when a province references an unknown region id', () => {
    const { regions, cities } = minimalOk();
    expect(() =>
      joinLgu(regions, [province({ region: { id: 'unknown' } })], cities, [])
    ).toThrow(/\[sync:lgu\].*Test Province.*unknown region/);
  });

  it('fails when a city references an unknown region id', () => {
    const { regions, provinces } = minimalOk();
    expect(() =>
      joinLgu(regions, provinces, [city({ region: { id: 'unknown' } })], [])
    ).toThrow(/\[sync:lgu\].*Test City.*unknown region/);
  });

  it('fails when a municipality references an unknown non-null province id', () => {
    const { regions, provinces } = minimalOk();
    expect(() =>
      joinLgu(
        regions,
        provinces,
        [],
        [municipality({ province: { id: 'unknown' } })]
      )
    ).toThrow(/\[sync:lgu\].*Test Municipality.*unknown province/);
  });

  it('fails when a child region.id disagrees with its province.region.id', () => {
    const regions = [
      region({ id: 'r0' }),
      region({ id: 'r1', slug: 'other', region: 'OTHER' }),
    ];
    const provinces = [province({ region: { id: 'r0' } })];
    const cities = [city({ region: { id: 'r1' }, province: { id: 'p0' } })];
    expect(() => joinLgu(regions, provinces, cities, [])).toThrow(
      /\[sync:lgu\].*Test City.*inconsistent parentage/
    );
  });
});

// ---------------------------------------------------------------------------
// Step 3: within-parent duplicate gates
// ---------------------------------------------------------------------------

describe('joinLgu within-parent duplicate gates', () => {
  it('fails on duplicate province position within one region', () => {
    const { regions, cities } = minimalOk();
    const provinces = [
      province({ id: 'p0', position: 0, province: 'A' }),
      province({ id: 'p1', position: 0, province: 'B' }),
    ];
    expect(() => joinLgu(regions, provinces, cities, [])).toThrow(
      /\[sync:lgu\].*duplicate position/
    );
  });

  it('fails on duplicate province name within one region', () => {
    const { regions, cities } = minimalOk();
    const provinces = [
      province({ id: 'p0', position: 0, province: 'Same' }),
      province({ id: 'p1', position: 1, province: 'Same' }),
    ];
    expect(() => joinLgu(regions, provinces, cities, [])).toThrow(
      /\[sync:lgu\].*duplicate province name "Same"/
    );
  });

  it('fails on duplicate city position within one parent', () => {
    const { regions, provinces } = minimalOk();
    const cities = [
      city({ id: 'c0', position: 0, city: 'A' }),
      city({ id: 'c1', position: 0, city: 'B' }),
    ];
    expect(() => joinLgu(regions, provinces, cities, [])).toThrow(
      /\[sync:lgu\].*duplicate position/
    );
  });

  it('fails on duplicate city name within one parent', () => {
    const { regions, provinces } = minimalOk();
    const cities = [
      city({ id: 'c0', position: 0, city: 'Same' }),
      city({ id: 'c1', position: 1, city: 'Same' }),
    ];
    expect(() => joinLgu(regions, provinces, cities, [])).toThrow(
      /\[sync:lgu\].*duplicate city name "Same"/
    );
  });

  it('fails on duplicate municipality position within one parent', () => {
    const { regions, provinces } = minimalOk();
    const municipalities = [
      municipality({ id: 'm0', position: 0, municipality: 'A' }),
      municipality({ id: 'm1', position: 0, municipality: 'B' }),
    ];
    expect(() => joinLgu(regions, provinces, [], municipalities)).toThrow(
      /\[sync:lgu\].*duplicate position/
    );
  });

  it('fails on duplicate municipality name within one parent', () => {
    const { regions, provinces } = minimalOk();
    const municipalities = [
      municipality({ id: 'm0', position: 0, municipality: 'Same' }),
      municipality({ id: 'm1', position: 1, municipality: 'Same' }),
    ];
    expect(() => joinLgu(regions, provinces, [], municipalities)).toThrow(
      /\[sync:lgu\].*duplicate municipality name "Same"/
    );
  });

  it('does not fail when the SAME position/name appears under DIFFERENT parents', () => {
    const regions = [region()];
    const provinces = [
      province({ id: 'p0', position: 0, province: 'Prov A' }),
      province({ id: 'p1', position: 1, province: 'Prov B' }),
    ];
    const cities = [
      city({ id: 'c0', position: 0, city: 'Same', province: { id: 'p0' } }),
      city({ id: 'c1', position: 0, city: 'Same', province: { id: 'p1' } }),
    ];
    expect(() => joinLgu(regions, provinces, cities, [])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Step 3: structural gates
// ---------------------------------------------------------------------------

describe('joinLgu structural gates', () => {
  it('fails a region with no provinces, cities or municipalities', () => {
    expect(() => joinLgu([region()], [], [], [])).toThrow(
      /\[sync:lgu\].*TEST REGION|test-region.*no provinces, no cities and no municipalities/
    );
  });

  it('fails a province with no cities and no municipalities', () => {
    const regions = [region()];
    const provinces = [province()];
    expect(() => joinLgu(regions, provinces, [], [])).toThrow(
      /\[sync:lgu\].*Test Province.*no cities and no municipalities/
    );
  });
});

// ---------------------------------------------------------------------------
// Step 4/5: joiner + shaper placement and shape rules
// ---------------------------------------------------------------------------

describe('placement', () => {
  it('places a province:null child at the region root', () => {
    const regions = [region()];
    const cities = [city({ province: null })];
    const [joined] = joinLgu(regions, [], cities, []);
    expect(joined.cities).toHaveLength(1);
    expect(joined.provinces).toHaveLength(0);
    const shaped = shapeLguRegion(joined);
    expect(shaped.cities).toBeDefined();
    expect(shaped.provinces).toBeUndefined();
  });

  it('places a province-bearing child under its province, not the region root', () => {
    const { regions, provinces, cities } = minimalOk();
    const [joined] = joinLgu(regions, provinces, cities, []);
    expect(joined.cities).toHaveLength(0);
    expect(joined.provinces).toHaveLength(1);
    expect(joined.provinces[0].cities).toHaveLength(1);
    const shaped = shapeLguRegion(joined);
    expect(shaped.cities).toBeUndefined();
    const shapedProvinces = shaped.provinces as Record<string, unknown>[];
    expect(shapedProvinces[0].cities).toBeDefined();
  });
});

describe('shape: omitted and forbidden fields', () => {
  function walk(value: unknown, visit: (v: Record<string, unknown>) => void) {
    if (Array.isArray(value)) {
      value.forEach(v => walk(v, visit));
    } else if (value && typeof value === 'object') {
      visit(value as Record<string, unknown>);
      for (const v of Object.values(value as Record<string, unknown>)) {
        walk(v, visit);
      }
    }
  }

  it('never emits position, id, region name (redundant), or child slug anywhere', () => {
    const joined = joinFixture();
    for (const region of joined) {
      const shaped = shapeLguRegion(region);
      walk(shaped, obj => {
        expect(obj).not.toHaveProperty('position');
        expect(obj).not.toHaveProperty('id');
      });
      // No nested object other than the top-level region carries a bare
      // "name" key that isn't inside mayor/vice_mayor (i.e. no stray region
      // name duplication at province/city/municipality level).
    }
  });

  it('omits zip_code when zipCode is null or empty', () => {
    const regions = [region()];
    const provinces = [province()];
    const withNullZip = city({ zipCode: null });
    const withEmptyZip = city({
      id: 'c1',
      position: 1,
      city: 'City2',
      zipCode: '',
    });
    const [joined] = joinLgu(
      regions,
      provinces,
      [withNullZip, withEmptyZip],
      []
    );
    const shaped = shapeLguRegion(joined);
    const shapedCities = (shaped.provinces as Record<string, unknown>[])[0]
      .cities as Record<string, unknown>[];
    for (const c of shapedCities) {
      expect(c).not.toHaveProperty('zip_code');
    }
  });

  it('emits zip_code when present and non-empty', () => {
    const regions = [region()];
    const provinces = [province()];
    const cities = [city({ zipCode: '1000' })];
    const [joined] = joinLgu(regions, provinces, cities, []);
    const shaped = shapeLguRegion(joined);
    const shapedCities = (shaped.provinces as Record<string, unknown>[])[0]
      .cities as Record<string, unknown>[];
    expect(shapedCities[0].zip_code).toBe('1000');
  });

  it('omits official contact/email when null, undefined, or empty', () => {
    const regions = [region()];
    const provinces = [province()];
    const cities = [
      city({
        mayor: official({ contact: null, email: undefined }),
        viceMayor: official({ name: 'V', contact: '', email: '' }),
      }),
    ];
    const [joined] = joinLgu(regions, provinces, cities, []);
    const shaped = shapeLguRegion(joined);
    const shapedProvince = (shaped.provinces as Record<string, unknown>[])[0];
    const shapedCity = (shapedProvince.cities as Record<string, unknown>[])[0];
    expect(shapedCity.mayor).toEqual({ name: 'JUAN A. DELA CRUZ' });
    expect(shapedCity.vice_mayor).toEqual({ name: 'V' });
  });

  it('omits an empty child array entirely rather than emitting []', () => {
    const regions = [region()];
    const provinces = [province()];
    const cities = [city()];
    const [joined] = joinLgu(regions, provinces, cities, []);
    const shaped = shapeLguRegion(joined);
    const shapedProvince = (shaped.provinces as Record<string, unknown>[])[0];
    expect(shapedProvince).not.toHaveProperty('municipalities');
    expect(shaped).not.toHaveProperty('municipalities');
    expect(Object.values(shaped)).not.toContainEqual([]);
  });

  it('emits region key order: region, cities, municipalities, provinces, slug', () => {
    const regions = [region()];
    const provinces = [province()];
    const cities = [
      city({ province: null }),
      city({ id: 'c1', position: 1, city: 'Provincial City' }),
    ];
    const municipalities = [municipality({ id: 'm1', province: null })];
    const [joined] = joinLgu(regions, provinces, cities, municipalities);
    const shaped = shapeLguRegion(joined);
    expect(Object.keys(shaped)).toEqual([
      'region',
      'cities',
      'municipalities',
      'provinces',
      'slug',
    ]);
  });

  it('emits official key order: name, contact, email', () => {
    const regions = [region()];
    const provinces = [province()];
    const cities = [
      city({ mayor: official({ contact: '123', email: 'a@b.com' }) }),
    ];
    const [joined] = joinLgu(regions, provinces, cities, []);
    const shaped = shapeLguRegion(joined);
    const mayor = (
      (shaped.provinces as Record<string, unknown>[])[0].cities as Record<
        string,
        unknown
      >[]
    )[0].mayor as Record<string, unknown>;
    expect(Object.keys(mayor)).toEqual(['name', 'contact', 'email']);
  });
});

describe('ordering', () => {
  it('sorts by position ascending', () => {
    const regions = [region()];
    const provinces = [
      province({ id: 'p1', position: 1, province: 'B' }),
      province({ id: 'p0', position: 0, province: 'A' }),
    ];
    const cities = [
      city({ id: 'c0', province: { id: 'p0' } }),
      city({ id: 'c1', province: { id: 'p1' } }),
    ];
    const [joined] = joinLgu(regions, provinces, cities, []);
    expect(joined.provinces.map(p => p.province.province)).toEqual(['A', 'B']);
  });
});

describe('determinism', () => {
  function shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    // Fixed reversal + rotation: deterministic "shuffle" that changes order
    // without relying on Math.random (keeps the test itself deterministic).
    out.reverse();
    if (out.length > 2) {
      const [first, ...rest] = out;
      out.length = 0;
      out.push(...rest, first);
    }
    return out;
  }

  it('produces byte-identical output regardless of input array order', () => {
    const inOrder = buildLguCandidates(joinFixture());
    const shuffled = buildLguCandidates(
      joinLgu(
        shuffle(parseLguRegions(rawRegions)),
        shuffle(parseLguProvinces(rawProvinces)),
        shuffle(parseLguCities(rawCities)),
        shuffle(parseLguMunicipalities(rawMunicipalities))
      )
    );
    expect(JSON.stringify(shuffled)).toEqual(JSON.stringify(inOrder));
  });
});

// ---------------------------------------------------------------------------
// Step 6: fetchLgu
// ---------------------------------------------------------------------------

describe('fetchLgu', () => {
  it('drives four paginated fetches and joins the result, with no other network access', async () => {
    const calls: string[] = [];

    /** Extracts `skip: N, first: M` from a page query, mirroring the CDA's page cap. */
    function page<T>(all: T[], query: string): T[] {
      const skipMatch = /skip: (\d+)/.exec(query);
      const firstMatch = /first: (\d+)/.exec(query);
      const skip = skipMatch ? Number(skipMatch[1]) : 0;
      const first = firstMatch ? Number(firstMatch[1]) : all.length;
      return all.slice(skip, skip + first);
    }

    const client: TalaCmsClient = async <T>(query: string): Promise<T> => {
      calls.push(query);
      if (query.includes('_allLguRegionsMeta')) {
        return { _allLguRegionsMeta: { count: rawRegions.length } } as T;
      }
      if (query.includes('_allLguProvincesMeta')) {
        return { _allLguProvincesMeta: { count: rawProvinces.length } } as T;
      }
      if (query.includes('_allLguCitiesMeta')) {
        return { _allLguCitiesMeta: { count: rawCities.length } } as T;
      }
      if (query.includes('_allLguMunicipalitiesMeta')) {
        return {
          _allLguMunicipalitiesMeta: { count: rawMunicipalities.length },
        } as T;
      }
      if (query.includes('allLguRegions(')) {
        return { allLguRegions: page(rawRegions, query) } as T;
      }
      if (query.includes('allLguProvinces(')) {
        return { allLguProvinces: page(rawProvinces, query) } as T;
      }
      if (query.includes('allLguCities(')) {
        return { allLguCities: page(rawCities, query) } as T;
      }
      if (query.includes('allLguMunicipalities(')) {
        return { allLguMunicipalities: page(rawMunicipalities, query) } as T;
      }
      throw new Error(`unexpected query: ${query}`);
    };

    const joined = await fetchLgu(client);
    expect(joined).toHaveLength(19);
    expect(calls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Step 7: the round-trip test — the load-bearing assertion
// ---------------------------------------------------------------------------

describe('round-trip equivalence against the pre-migration files', () => {
  const FIXTURES_DIR = path.join(
    REPO_ROOT,
    'src/data/directory/lgu/__fixtures__'
  );
  const SCHEMA_PATH = 'src/data/directory/lgu/schema/lgu-region.schema.json';

  const joined = joinFixture();
  const candidates = buildLguCandidates(joined);

  it('produces exactly 19 candidates', () => {
    expect(candidates).toHaveLength(19);
  });

  it('matches aggregate counts: 19 regions, 80 provinces, 110 cities, 1435 municipalities, 20+9 region-level children', () => {
    expect(joined).toHaveLength(19);
    const totalProvinces = joined.reduce((n, r) => n + r.provinces.length, 0);
    const totalCities =
      joined.reduce((n, r) => n + r.cities.length, 0) +
      joined.reduce(
        (n, r) => n + r.provinces.reduce((m, p) => m + p.cities.length, 0),
        0
      );
    const totalMunicipalities =
      joined.reduce((n, r) => n + r.municipalities.length, 0) +
      joined.reduce(
        (n, r) =>
          n + r.provinces.reduce((m, p) => m + p.municipalities.length, 0),
        0
      );
    const regionLevelCities = joined.reduce((n, r) => n + r.cities.length, 0);
    const regionLevelMunicipalities = joined.reduce(
      (n, r) => n + r.municipalities.length,
      0
    );

    expect(totalProvinces).toBe(80);
    expect(totalCities).toBe(110);
    expect(totalMunicipalities).toBe(1435);
    expect(regionLevelCities).toBe(20);
    expect(regionLevelMunicipalities).toBe(9);
  });

  it('is byte-identical, after prepare(), for exactly 17 of 19 regions — the 2 exceptions are exactly negros-island-region and region-vi-western-visayas', async () => {
    const { prepare } = await import('../write');

    const byteExact: string[] = [];
    const diverging: string[] = [];

    for (const candidate of candidates) {
      const prepared = await prepare(candidate);
      const fixturePath = path.join(
        FIXTURES_DIR,
        `${path.basename(candidate.path, '.json')}.expected.json`
      );
      const expectedText = fs.readFileSync(fixturePath, 'utf8');
      const slug = path.basename(candidate.path, '.json');
      if (prepared.text === expectedText) {
        byteExact.push(slug);
      } else {
        diverging.push(slug);
      }
    }

    expect(diverging.sort()).toEqual([
      'negros-island-region',
      'region-vi-western-visayas',
    ]);
    expect(byteExact).toHaveLength(17);
  });

  it('is content-identical for all 19 after deep key-sort, stripping the two vestigial province `slug` keys from the expected side', () => {
    for (const candidate of candidates) {
      const slug = path.basename(candidate.path, '.json');
      const fixturePath = path.join(FIXTURES_DIR, `${slug}.expected.json`);
      const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

      // The two accepted deltas: negros-island-region and
      // region-vi-western-visayas carry a vestigial province-level `slug`
      // (guimaras-province / iloilo-province) in the committed file that the
      // shaper correctly never emits, because `slug` is never selected on
      // provinces (Step 1). Strip it from the expected side only.
      if (expected.provinces) {
        for (const p of expected.provinces) {
          delete p.slug;
        }
      }

      expect(sortDeep(candidate.data)).toEqual(sortDeep(expected));
    }
  });

  it('validates all 19 candidates against the tracked lgu-region.schema.json via prepare()', async () => {
    const { prepare } = await import('../write');
    for (const candidate of candidates) {
      expect(candidate.schemaPath).toBe(SCHEMA_PATH);
      await expect(prepare(candidate)).resolves.toMatchObject({
        path: candidate.path,
      });
    }
  });
});
