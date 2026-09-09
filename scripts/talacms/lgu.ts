import { z } from 'zod';
import type { TalaCmsClient } from './client';
import type { Candidate } from './categories';
import { fetchAllRecords, type PaginatedFetch } from './paginate';

/**
 * Verified 2026-09-09 against the live CDA. Four independent collections,
 * each fetched with its own count query + paged collection query (see
 * `fetchAllRecords`, Task 1).
 *
 * Every page query orders by `id_ASC`, never `position_ASC`: `position` is
 * per-PARENT (a per-region province index, a per-province city index, …), so
 * it cannot order a flat top-level page across many parents. `id` is the only
 * field guaranteed both present and globally unique, which is what
 * `fetchAllRecords`'s duplicate-across-pages gate requires.
 *
 * Child `slug` is deliberately never selected: city/municipality slugs are
 * not globally unique (two different provinces can each have a "san-jose"),
 * they are never emitted to the generated files, and selecting an unused
 * field would only invite a future author to wire it in without the
 * uniqueness gate that region `slug` gets in `parseLguRegions`.
 *
 * `region.name` is not selected because it is redundant with `region.region`
 * — both name the same parent region, and only one round trip through the
 * CDA is needed to resolve it.
 */
export const LGU_REGIONS_CEILING = 100; // today 19
export const LGU_PROVINCES_CEILING = 200; // today 80
export const LGU_CITIES_CEILING = 300; // today 110
export const LGU_MUNICIPALITIES_CEILING = 2500; // today 1435

const LGU_REGIONS_COUNT_QUERY = `
query CountLguRegions {
  _allLguRegionsMeta {
    count
  }
}
`;

const LGU_PROVINCES_COUNT_QUERY = `
query CountLguProvinces {
  _allLguProvincesMeta {
    count
  }
}
`;

const LGU_CITIES_COUNT_QUERY = `
query CountLguCities {
  _allLguCitiesMeta {
    count
  }
}
`;

const LGU_MUNICIPALITIES_COUNT_QUERY = `
query CountLguMunicipalities {
  _allLguMunicipalitiesMeta {
    count
  }
}
`;

export function lguRegionsPageQuery(skip: number, first: number): string {
  return `
query PageLguRegions {
  allLguRegions(orderBy: [id_ASC], skip: ${skip}, first: ${first}) {
    id
    position
    slug
    region
  }
}
`;
}

export function lguProvincesPageQuery(skip: number, first: number): string {
  return `
query PageLguProvinces {
  allLguProvinces(orderBy: [id_ASC], skip: ${skip}, first: ${first}) {
    id
    position
    province
    region {
      id
    }
  }
}
`;
}

export function lguCitiesPageQuery(skip: number, first: number): string {
  return `
query PageLguCities {
  allLguCities(orderBy: [id_ASC], skip: ${skip}, first: ${first}) {
    id
    position
    city
    zipCode
    mayor {
      name
      contact
      email
    }
    viceMayor {
      name
      contact
      email
    }
    region {
      id
    }
    province {
      id
    }
  }
}
`;
}

export function lguMunicipalitiesPageQuery(
  skip: number,
  first: number
): string {
  return `
query PageLguMunicipalities {
  allLguMunicipalities(orderBy: [id_ASC], skip: ${skip}, first: ${first}) {
    id
    position
    municipality
    zipCode
    mayor {
      name
      contact
      email
    }
    viceMayor {
      name
      contact
      email
    }
    region {
      id
    }
    province {
      id
    }
  }
}
`;
}

const LGU_REGIONS_FETCH: PaginatedFetch = {
  label: 'LGU regions',
  countQuery: LGU_REGIONS_COUNT_QUERY,
  countField: '_allLguRegionsMeta',
  collectionField: 'allLguRegions',
  page: lguRegionsPageQuery,
  ceiling: LGU_REGIONS_CEILING,
};

const LGU_PROVINCES_FETCH: PaginatedFetch = {
  label: 'LGU provinces',
  countQuery: LGU_PROVINCES_COUNT_QUERY,
  countField: '_allLguProvincesMeta',
  collectionField: 'allLguProvinces',
  page: lguProvincesPageQuery,
  ceiling: LGU_PROVINCES_CEILING,
};

const LGU_CITIES_FETCH: PaginatedFetch = {
  label: 'LGU cities',
  countQuery: LGU_CITIES_COUNT_QUERY,
  countField: '_allLguCitiesMeta',
  collectionField: 'allLguCities',
  page: lguCitiesPageQuery,
  ceiling: LGU_CITIES_CEILING,
};

const LGU_MUNICIPALITIES_FETCH: PaginatedFetch = {
  label: 'LGU municipalities',
  countQuery: LGU_MUNICIPALITIES_COUNT_QUERY,
  countField: '_allLguMunicipalitiesMeta',
  collectionField: 'allLguMunicipalities',
  page: lguMunicipalitiesPageQuery,
  ceiling: LGU_MUNICIPALITIES_CEILING,
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const fail = (message: string): never => {
  throw new Error(`[sync:lgu] ${message}`);
};

/**
 * `.strict()` matters: the local schema is `additionalProperties: false` on
 * `official`, so an unreviewed CMS key on `mayor`/`viceMayor` must fail the
 * sync here — where the error can name the record — rather than fail Ajv
 * later with a message naming only the generated file.
 *
 * `name` is required and non-blank because both the region and province
 * pages key their render off `.name`.
 */
const RawOfficialSchema = z
  .object({
    name: z.string().trim().min(1),
    contact: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  })
  .strict();

const RegionRefSchema = z.object({ id: z.string() });
const ProvinceRefSchema = z.object({ id: z.string() }).nullable();

/**
 * `slug` is a bare `z.string()` here — its pattern is checked in
 * `parseLguRegions`, not in the schema, so the failure message can name the
 * offending region rather than report a generic zod issue path.
 */
const RawLguRegionSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  slug: z.string(),
  region: z.string().trim().min(1),
});

const RawLguProvinceSchema = z.object({
  id: z.string(),
  position: z.number().int(),
  province: z.string().trim().min(1),
  region: RegionRefSchema,
});

const RawLguCitySchema = z.object({
  id: z.string(),
  position: z.number().int(),
  city: z.string().trim().min(1),
  zipCode: z.string().nullable(),
  mayor: RawOfficialSchema,
  viceMayor: RawOfficialSchema,
  region: RegionRefSchema,
  province: ProvinceRefSchema,
});

const RawLguMunicipalitySchema = z.object({
  id: z.string(),
  position: z.number().int(),
  municipality: z.string().trim().min(1),
  zipCode: z.string().nullable(),
  mayor: RawOfficialSchema,
  viceMayor: RawOfficialSchema,
  region: RegionRefSchema,
  province: ProvinceRefSchema,
});

export type RawOfficial = z.infer<typeof RawOfficialSchema>;
export type RawLguRegion = z.infer<typeof RawLguRegionSchema>;
export type RawLguProvince = z.infer<typeof RawLguProvinceSchema>;
export type RawLguCity = z.infer<typeof RawLguCitySchema>;
export type RawLguMunicipality = z.infer<typeof RawLguMunicipalitySchema>;

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

/**
 * Region-level gates — the only ones that can be checked from the regions
 * array alone. Every gate below fails the whole sync; a record is never
 * dropped.
 */
export function parseLguRegions(records: unknown): RawLguRegion[] {
  const regions = parseOrFail(
    z.array(RawLguRegionSchema),
    records,
    'LGU regions'
  );

  const slugs = new Set<string>();
  const positions = new Map<number, string>();

  for (const r of regions) {
    if (!SLUG_PATTERN.test(r.slug)) {
      fail(
        `LGU region "${r.region}" has slug "${r.slug}", which does not match ` +
          'the required slug pattern (lowercase letters, digits and hyphens only)'
      );
    }
    if (slugs.has(r.slug)) {
      fail(
        `duplicate LGU region slug "${r.slug}" — the slug is the output ` +
          'filename and the route param, so it must be unique'
      );
    }
    slugs.add(r.slug);

    const seenSlug = positions.get(r.position);
    if (seenSlug !== undefined) {
      fail(
        `LGU regions "${seenSlug}" and "${r.slug}" share duplicate position ` +
          `${r.position}`
      );
    }
    positions.set(r.position, r.slug);
  }

  return regions;
}

/**
 * No per-collection gates here: uniqueness and referential checks for
 * provinces need the region collection to resolve names/existence, so they
 * live in `joinLgu`, which sees all four collections at once.
 */
export function parseLguProvinces(records: unknown): RawLguProvince[] {
  return parseOrFail(z.array(RawLguProvinceSchema), records, 'LGU provinces');
}

export function parseLguCities(records: unknown): RawLguCity[] {
  return parseOrFail(z.array(RawLguCitySchema), records, 'LGU cities');
}

export function parseLguMunicipalities(records: unknown): RawLguMunicipality[] {
  return parseOrFail(
    z.array(RawLguMunicipalitySchema),
    records,
    'LGU municipalities'
  );
}

export interface JoinedProvince {
  province: RawLguProvince;
  cities: RawLguCity[];
  municipalities: RawLguMunicipality[];
}

export interface JoinedRegion {
  region: RawLguRegion;
  cities: RawLguCity[];
  municipalities: RawLguMunicipality[];
  provinces: JoinedProvince[];
}

const byPositionThenId = (
  a: { position: number; id: string },
  b: { position: number; id: string }
) =>
  a.position !== b.position
    ? a.position - b.position
    : a.id < b.id
      ? -1
      : a.id > b.id
        ? 1
        : 0;

/**
 * Checks duplicate `position` and duplicate display-name within every group
 * of `items` sharing the same `groupKeyOf` value. Used both for provinces
 * grouped by region and for cities/municipalities grouped by their immediate
 * parent (region or province).
 *
 * `positionMessage`/`nameMessage` build the failure text — they receive the
 * two colliding items and the shared position/name — so each call site can
 * name the parent and explain the specific consequence, per Step 3.
 */
function assertNoDuplicatesWithinGroups<
  T extends { position: number; id: string },
>(
  items: T[],
  groupKeyOf: (item: T) => string,
  nameOf: (item: T) => string,
  positionMessage: (groupKey: string, a: T, b: T) => string,
  nameMessage: (groupKey: string, duplicate: T) => string
): void {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupKeyOf(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  for (const [key, group] of groups) {
    const byPosition = new Map<number, T>();
    for (const item of group) {
      const existing = byPosition.get(item.position);
      if (existing) {
        fail(positionMessage(key, existing, item));
      }
      byPosition.set(item.position, item);
    }

    const byName = new Map<string, T>();
    for (const item of group) {
      const name = nameOf(item);
      const existing = byName.get(name);
      if (existing) {
        fail(nameMessage(key, item));
      }
      byName.set(name, item);
    }
  }
}

/**
 * `joinLgu` is where every cross-collection integrity gate from the brief's
 * Step 3 lives: referential checks (a child pointing at a region/province
 * that doesn't exist, or a child whose region disagrees with its own
 * province's region), within-parent duplicate checks (position and name),
 * and the two structural rules the tracked schema expresses as `anyOf` — a
 * region needs at least one child collection, and a province needs at least
 * one of cities/municipalities.
 *
 * Every gate below fails the whole sync; no record is ever dropped. All of
 * them have 0 occurrences in today's data (verified 2026-09-09) — each is a
 * regression gate, not a migration blocker.
 */
export function joinLgu(
  regions: RawLguRegion[],
  provinces: RawLguProvince[],
  cities: RawLguCity[],
  municipalities: RawLguMunicipality[]
): JoinedRegion[] {
  const regionIds = new Set(regions.map(r => r.id));
  const regionById = new Map(regions.map(r => [r.id, r]));
  const provinceRegionId = new Map(provinces.map(p => [p.id, p.region.id]));

  // Referential: province -> region.
  for (const p of provinces) {
    if (!regionIds.has(p.region.id)) {
      fail(
        `LGU province "${p.province}" (id "${p.id}") references unknown ` +
          `region id "${p.region.id}"`
      );
    }
  }

  // Referential: child -> region, child -> province, and parentage
  // consistency between the two.
  function assertChildReferences<
    T extends {
      id: string;
      region: { id: string };
      province: { id: string } | null;
    },
  >(label: string, children: T[], nameOf: (c: T) => string): void {
    for (const c of children) {
      if (!regionIds.has(c.region.id)) {
        fail(
          `${label} "${nameOf(c)}" (id "${c.id}") references unknown region ` +
            `id "${c.region.id}"`
        );
      }
      if (c.province !== null) {
        const provinceRegion = provinceRegionId.get(c.province.id);
        if (provinceRegion === undefined) {
          fail(
            `${label} "${nameOf(c)}" (id "${c.id}") references unknown ` +
              `province id "${c.province.id}"`
          );
        }
        if (provinceRegion !== c.region.id) {
          fail(
            `${label} "${nameOf(c)}" (id "${c.id}") has region id ` +
              `"${c.region.id}", but its province (id "${c.province.id}") ` +
              `belongs to region id "${provinceRegion}" — inconsistent ` +
              'parentage. The record was re-linked to the wrong region while ' +
              'the aggregate counts still reconcile.'
          );
        }
      }
    }
  }

  assertChildReferences('LGU city', cities, c => c.city);
  assertChildReferences(
    'LGU municipality',
    municipalities,
    m => m.municipality
  );

  // Within-parent duplicates: provinces grouped by region.
  assertNoDuplicatesWithinGroups(
    provinces,
    p => p.region.id,
    p => p.province,
    (regionId, a, b) =>
      `LGU provinces "${a.province}" and "${b.province}" of region ` +
      `"${regionById.get(regionId)?.slug ?? regionId}" share duplicate ` +
      `position ${a.position}. Output order is derived from position, so a ` +
      'tie would be resolved arbitrarily rather than by editorial intent.',
    (regionId, dup) =>
      `duplicate province name "${dup.province}" within region ` +
      `"${regionById.get(regionId)?.slug ?? regionId}". The region page ` +
      'renders one card per unit, so this is a visibly repeated card and an ' +
      'inflated count. The fix belongs in TalaCMS — the sync will not ' +
      'de-duplicate, because that would hide the defect permanently.'
  );

  // Within-parent duplicates: cities grouped by their immediate parent
  // (province if present, else the region itself).
  const parentKeyOf = (c: {
    region: { id: string };
    province: { id: string } | null;
  }) => (c.province ? `province:${c.province.id}` : `region:${c.region.id}`);
  const parentLabel = (key: string): string => {
    const [kind, id] = key.split(':');
    if (kind === 'province') {
      const province = provinces.find(p => p.id === id);
      return `province "${province?.province ?? id}"`;
    }
    return `region "${regionById.get(id)?.slug ?? id}"`;
  };

  assertNoDuplicatesWithinGroups(
    cities,
    parentKeyOf,
    c => c.city,
    (key, a, b) =>
      `LGU cities "${a.city}" and "${b.city}" of ${parentLabel(key)} share ` +
      `duplicate position ${a.position}. Output order is derived from ` +
      'position, so a tie would be resolved arbitrarily rather than by ' +
      'editorial intent.',
    (key, dup) =>
      `duplicate city name "${dup.city}" within ${parentLabel(key)}. The ` +
      'region page renders one card per unit, so this is a visibly repeated ' +
      'card and an inflated count. The fix belongs in TalaCMS — the sync ' +
      'will not de-duplicate, because that would hide the defect ' +
      'permanently.'
  );

  assertNoDuplicatesWithinGroups(
    municipalities,
    parentKeyOf,
    m => m.municipality,
    (key, a, b) =>
      `LGU municipalities "${a.municipality}" and "${b.municipality}" of ` +
      `${parentLabel(key)} share duplicate position ${a.position}. Output ` +
      'order is derived from position, so a tie would be resolved ' +
      'arbitrarily rather than by editorial intent.',
    (key, dup) =>
      `duplicate municipality name "${dup.municipality}" within ` +
      `${parentLabel(key)}. The region page renders one card per unit, so ` +
      'this is a visibly repeated card and an inflated count. The fix ' +
      'belongs in TalaCMS — the sync will not de-duplicate, because that ' +
      'would hide the defect permanently.'
  );

  // Group children by parent for assembly.
  const citiesByRegion = new Map<string, RawLguCity[]>();
  const citiesByProvince = new Map<string, RawLguCity[]>();
  for (const c of cities) {
    if (c.province === null) {
      const arr = citiesByRegion.get(c.region.id) ?? [];
      arr.push(c);
      citiesByRegion.set(c.region.id, arr);
    } else {
      const arr = citiesByProvince.get(c.province.id) ?? [];
      arr.push(c);
      citiesByProvince.set(c.province.id, arr);
    }
  }

  const municipalitiesByRegion = new Map<string, RawLguMunicipality[]>();
  const municipalitiesByProvince = new Map<string, RawLguMunicipality[]>();
  for (const m of municipalities) {
    if (m.province === null) {
      const arr = municipalitiesByRegion.get(m.region.id) ?? [];
      arr.push(m);
      municipalitiesByRegion.set(m.region.id, arr);
    } else {
      const arr = municipalitiesByProvince.get(m.province.id) ?? [];
      arr.push(m);
      municipalitiesByProvince.set(m.province.id, arr);
    }
  }

  const provincesByRegion = new Map<string, RawLguProvince[]>();
  for (const p of provinces) {
    const arr = provincesByRegion.get(p.region.id) ?? [];
    arr.push(p);
    provincesByRegion.set(p.region.id, arr);
  }

  // Structural: a province with no children.
  for (const p of provinces) {
    const hasCities = (citiesByProvince.get(p.id) ?? []).length > 0;
    const hasMunicipalities =
      (municipalitiesByProvince.get(p.id) ?? []).length > 0;
    if (!hasCities && !hasMunicipalities) {
      fail(
        `LGU province "${p.province}" (id "${p.id}") has no cities and no ` +
          'municipalities'
      );
    }
  }

  const joined: JoinedRegion[] = regions.map(region => {
    const regionProvinces = (provincesByRegion.get(region.id) ?? [])
      .slice()
      .sort(byPositionThenId)
      .map(province => ({
        province,
        cities: (citiesByProvince.get(province.id) ?? [])
          .slice()
          .sort(byPositionThenId),
        municipalities: (municipalitiesByProvince.get(province.id) ?? [])
          .slice()
          .sort(byPositionThenId),
      }));

    const regionCities = (citiesByRegion.get(region.id) ?? [])
      .slice()
      .sort(byPositionThenId);
    const regionMunicipalities = (municipalitiesByRegion.get(region.id) ?? [])
      .slice()
      .sort(byPositionThenId);

    return {
      region,
      cities: regionCities,
      municipalities: regionMunicipalities,
      provinces: regionProvinces,
    };
  });

  // Structural: a region with no provinces and no region-level children.
  for (const r of joined) {
    if (
      r.provinces.length === 0 &&
      r.cities.length === 0 &&
      r.municipalities.length === 0
    ) {
      fail(
        `LGU region "${r.region.slug}" has no provinces, no cities and no ` +
          'municipalities'
      );
    }
  }

  return joined.slice().sort((a, b) => byPositionThenId(a.region, b.region));
}

/** `official: { name, contact, email }`, omitting contact/email when absent. */
function shapeOfficial(official: RawOfficial): Record<string, unknown> {
  const out: Record<string, unknown> = { name: official.name };
  if (
    official.contact !== null &&
    official.contact !== undefined &&
    official.contact !== ''
  ) {
    out.contact = official.contact;
  }
  if (
    official.email !== null &&
    official.email !== undefined &&
    official.email !== ''
  ) {
    out.email = official.email;
  }
  return out;
}

function shapeCity(city: RawLguCity): Record<string, unknown> {
  const out: Record<string, unknown> = { city: city.city };
  if (city.zipCode !== null && city.zipCode !== '') {
    out.zip_code = city.zipCode;
  }
  out.mayor = shapeOfficial(city.mayor);
  out.vice_mayor = shapeOfficial(city.viceMayor);
  return out;
}

function shapeMunicipality(
  municipality: RawLguMunicipality
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    municipality: municipality.municipality,
  };
  if (municipality.zipCode !== null && municipality.zipCode !== '') {
    out.zip_code = municipality.zipCode;
  }
  out.mayor = shapeOfficial(municipality.mayor);
  out.vice_mayor = shapeOfficial(municipality.viceMayor);
  return out;
}

function shapeProvince(province: JoinedProvince): Record<string, unknown> {
  const out: Record<string, unknown> = {
    province: province.province.province,
  };
  if (province.cities.length > 0) {
    out.cities = province.cities.map(shapeCity);
  }
  if (province.municipalities.length > 0) {
    out.municipalities = province.municipalities.map(shapeMunicipality);
  }
  return out;
}

/**
 * Emitted key order (per region): `region, cities, municipalities,
 * provinces, slug`. `position`, `id`, the region's own `name` (it's on the
 * top-level `region` key already) and every child `slug` are never emitted —
 * `slug` is not even selected on children (see the module doc comment).
 *
 * Ordering at every level is `position` ascending, `id` ascending as the
 * tie-breaker — done once in `joinLgu`, so this function only shapes.
 */
export function shapeLguRegion(joined: JoinedRegion): Record<string, unknown> {
  const out: Record<string, unknown> = { region: joined.region.region };
  if (joined.cities.length > 0) {
    out.cities = joined.cities.map(shapeCity);
  }
  if (joined.municipalities.length > 0) {
    out.municipalities = joined.municipalities.map(shapeMunicipality);
  }
  if (joined.provinces.length > 0) {
    out.provinces = joined.provinces.map(shapeProvince);
  }
  out.slug = joined.region.slug;
  return out;
}

/**
 * Returns exactly one `Candidate` per region, sorted by `path` codepoint
 * order — deterministic regardless of `joinLgu`'s own (position-based) order.
 */
export function buildLguCandidates(joined: JoinedRegion[]): Candidate[] {
  return joined
    .map(r => ({
      path: `src/data/directory/lgu/${r.region.slug}.json`,
      schemaPath: 'src/data/directory/lgu/schema/lgu-region.schema.json',
      data: shapeLguRegion(r),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/**
 * Stage 2+4: four paginated fetches, parse each collection, then join.
 * Nothing else in this module touches the network.
 */
export async function fetchLgu(client: TalaCmsClient): Promise<JoinedRegion[]> {
  const [regions, provinces, cities, municipalities] = await Promise.all([
    fetchAllRecords<RawLguRegion>(client, LGU_REGIONS_FETCH),
    fetchAllRecords<RawLguProvince>(client, LGU_PROVINCES_FETCH),
    fetchAllRecords<RawLguCity>(client, LGU_CITIES_FETCH),
    fetchAllRecords<RawLguMunicipality>(client, LGU_MUNICIPALITIES_FETCH),
  ]);

  return joinLgu(
    parseLguRegions(regions),
    parseLguProvinces(provinces),
    parseLguCities(cities),
    parseLguMunicipalities(municipalities)
  );
}
