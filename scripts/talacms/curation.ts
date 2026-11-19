import fs from 'node:fs';
import path from 'node:path';
import type { Candidate, ServiceRecordRef, Taxonomy } from './categories';

const CURATION_PATH = 'src/data/service-curation.json';
const SERVICES_PREFIX = 'src/data/services/';
const TAXONOMY_PATH = 'src/data/service_categories.json';

export interface ServiceCuration {
  taxonomy: {
    renameSubcategories: {
      categorySlug: string;
      subcategorySlug: string;
      name: string;
    }[];
    addSubcategories: {
      categorySlug: string;
      name: string;
      slug: string;
    }[];
  };
  overrides: { id: string; fields: Record<string, unknown> }[];
  removeIds: string[];
  additions: CuratedServiceRecord[];
}

export interface CuratedServiceRecord {
  id: string;
  slug: string;
  service: string;
  url: string;
  category: { name: string; slug: string };
  subcategory: { name: string; slug: string };
  [key: string]: unknown;
}

const fail = (message: string): never => {
  throw new Error(`[sync:curation] ${message}`);
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Load and minimally validate the reviewed, committed curation overlay. */
export function readServiceCuration(
  filePath = path.join(process.cwd(), CURATION_PATH)
): ServiceCuration {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fail(`cannot read valid JSON from ${CURATION_PATH}`);
  }
  if (!isObject(parsed) || !isObject(parsed.taxonomy)) {
    return fail(`${CURATION_PATH} has an invalid top-level shape`);
  }
  const taxonomy = parsed.taxonomy;
  if (
    !Array.isArray(taxonomy.renameSubcategories) ||
    !Array.isArray(taxonomy.addSubcategories) ||
    !Array.isArray(parsed.overrides) ||
    !Array.isArray(parsed.removeIds) ||
    !Array.isArray(parsed.additions)
  ) {
    return fail(`${CURATION_PATH} is missing required curation lists`);
  }
  for (const entry of parsed.overrides) {
    if (
      !isObject(entry) ||
      typeof entry.id !== 'string' ||
      !isObject(entry.fields)
    ) {
      return fail(`${CURATION_PATH} contains an invalid override`);
    }
  }
  for (const id of parsed.removeIds) {
    if (typeof id !== 'string')
      return fail(`${CURATION_PATH} contains an invalid removal ID`);
  }
  for (const record of parsed.additions) {
    if (
      !isObject(record) ||
      typeof record.id !== 'string' ||
      typeof record.slug !== 'string' ||
      typeof record.service !== 'string' ||
      typeof record.url !== 'string' ||
      !isObject(record.category) ||
      !isObject(record.subcategory)
    ) {
      return fail(`${CURATION_PATH} contains an invalid service addition`);
    }
  }
  return parsed as unknown as ServiceCuration;
}

/** Apply reviewed subcategory renames/additions to a fresh or committed taxonomy. */
export function curateTaxonomy(
  source: Taxonomy,
  curation: ServiceCuration
): Taxonomy {
  const taxonomy: Taxonomy = {
    categories: source.categories.map(category => ({
      category: category.category,
      slug: category.slug,
      subcategories: category.subcategories.map(subcategory => ({
        name: subcategory.name,
        slug: subcategory.slug,
      })),
    })),
  };
  for (const rename of curation.taxonomy.renameSubcategories) {
    const category = taxonomy.categories.find(
      c => c.slug === rename.categorySlug
    );
    const subcategory = category?.subcategories.find(
      s => s.slug === rename.subcategorySlug
    );
    if (!subcategory) {
      return fail(
        `cannot rename missing taxonomy entry ${rename.categorySlug}/${rename.subcategorySlug}`
      );
    }
    subcategory.name = rename.name;
  }
  for (const addition of curation.taxonomy.addSubcategories) {
    const category = taxonomy.categories.find(
      c => c.slug === addition.categorySlug
    );
    if (!category) {
      return fail(
        `cannot add subcategory to missing category ${addition.categorySlug}`
      );
    }
    const existing = category.subcategories.find(s => s.slug === addition.slug);
    if (existing) {
      existing.name = addition.name;
    } else {
      category.subcategories.push({ name: addition.name, slug: addition.slug });
    }
  }
  return taxonomy;
}

/**
 * Normalize source/committed references before cross-validation. Overrides and
 * additions are applied by stable source ID; display names are then taken from
 * the curated taxonomy so a rename never leaves stale names on unaffected rows.
 */
export function curateServiceReferences(
  source: ServiceRecordRef[],
  taxonomy: Taxonomy,
  curation: ServiceCuration
): ServiceRecordRef[] {
  const overrideById = new Map(
    curation.overrides.map(entry => [entry.id, entry.fields])
  );
  const additionBySlug = new Map(
    curation.additions.map(record => [record.slug, record])
  );
  const removed = new Set(curation.removeIds);
  const records = source
    .filter(record => !record.id || !removed.has(record.id))
    .map(record => {
      const fields =
        (record.id ? overrideById.get(record.id) : undefined) ??
        (record.slug ? additionBySlug.get(record.slug) : undefined);
      const overrideCategory = fields?.category;
      const overrideSubcategory = fields?.subcategory;
      const category = isObject(overrideCategory)
        ? (overrideCategory as { name: string; slug: string })
        : record.category;
      const subcategory = isObject(overrideSubcategory)
        ? (overrideSubcategory as { name: string; slug: string })
        : record.subcategory;
      return {
        id: record.id,
        slug: record.slug,
        category: { ...category },
        subcategory: { ...subcategory },
      };
    });
  const seenIds = new Set(
    records.flatMap(record => (record.id ? [record.id] : []))
  );
  const seenSlugs = new Set(
    records.flatMap(record => (record.slug ? [record.slug] : []))
  );
  for (const addition of curation.additions) {
    if (!seenIds.has(addition.id) && !seenSlugs.has(addition.slug)) {
      records.push({
        id: addition.id,
        slug: addition.slug,
        category: { ...addition.category },
        subcategory: { ...addition.subcategory },
      });
      seenIds.add(addition.id);
      seenSlugs.add(addition.slug);
    }
  }

  const categoryBySlug = new Map(taxonomy.categories.map(c => [c.slug, c]));
  return records.map(record => {
    const category = categoryBySlug.get(record.category.slug);
    const subcategory = category?.subcategories.find(
      s => s.slug === record.subcategory.slug
    );
    return {
      ...record,
      category: category
        ? { name: category.category, slug: category.slug }
        : record.category,
      subcategory: subcategory
        ? { name: subcategory.name, slug: subcategory.slug }
        : record.subcategory,
    };
  });
}

/** Replace a generated taxonomy candidate with its curated equivalent. */
export function applyCuratedTaxonomyCandidate(
  candidate: Candidate,
  taxonomy: Taxonomy
): Candidate {
  if (candidate.path !== TAXONOMY_PATH) return candidate;
  return { ...candidate, data: taxonomy };
}

/** Apply corrections, removals, additions, and taxonomy names to service candidates. */
export function applyServiceCuration(
  candidates: Candidate[],
  taxonomy: Taxonomy,
  curation: ServiceCuration
): Candidate[] {
  const serviceCandidates = candidates.filter(c =>
    c.path.startsWith(SERVICES_PREFIX)
  );
  const candidateByCategory = new Map<string, Candidate>();
  const rowsByCategory = new Map<string, CuratedServiceRecord[]>();
  const allRows: CuratedServiceRecord[] = [];

  for (const candidate of serviceCandidates) {
    const categorySlug = path.basename(candidate.path, '.json');
    if (!Array.isArray(candidate.data)) {
      return fail(`generated ${candidate.path} is not a service array`);
    }
    candidateByCategory.set(categorySlug, candidate);
    const rows = candidate.data as CuratedServiceRecord[];
    rowsByCategory.set(categorySlug, [...rows]);
    allRows.push(...rows);
  }

  const byId = new Map(allRows.map(record => [record.id, record]));
  const originalCategoryById = new Map(
    allRows.map(record => [record.id, record.category.slug])
  );
  for (const override of curation.overrides) {
    const record = byId.get(override.id);
    if (record) Object.assign(record, override.fields);
  }
  const removed = new Set(curation.removeIds);
  const remaining = allRows.filter(record => !removed.has(record.id));
  const presentIds = new Set(remaining.map(record => record.id));
  for (const addition of curation.additions) {
    const matchedBySlug = remaining.find(
      record => record.slug === addition.slug
    );
    if (matchedBySlug && matchedBySlug.id !== addition.id) {
      Object.assign(matchedBySlug, { ...addition, id: matchedBySlug.id });
    } else if (!presentIds.has(addition.id) && !matchedBySlug) {
      remaining.push({ ...addition });
      presentIds.add(addition.id);
    }
  }

  const categoryBySlug = new Map(taxonomy.categories.map(c => [c.slug, c]));
  const subcategoryNameByKey = new Map(
    taxonomy.categories.flatMap(category =>
      category.subcategories.map(
        subcategory =>
          [`${category.slug}/${subcategory.slug}`, subcategory.name] as const
      )
    )
  );
  for (const rows of rowsByCategory.values()) rows.splice(0, rows.length);
  const movedRows: CuratedServiceRecord[] = [];
  const addedRows: CuratedServiceRecord[] = [];
  for (const record of remaining) {
    const category = categoryBySlug.get(record.category.slug);
    const destination = rowsByCategory.get(record.category.slug);
    if (
      !category ||
      !destination ||
      !candidateByCategory.has(record.category.slug)
    ) {
      return fail(
        `curated service "${record.slug}" targets missing generated category ${record.category.slug}`
      );
    }
    record.category.name = category.category;
    const subcategoryName = subcategoryNameByKey.get(
      `${record.category.slug}/${record.subcategory.slug}`
    );
    if (subcategoryName) record.subcategory.name = subcategoryName;
    const originalCategory = originalCategoryById.get(record.id);
    if (originalCategory && originalCategory !== record.category.slug) {
      movedRows.push(record);
    } else if (!originalCategory) {
      addedRows.push(record);
    } else {
      destination.push(record);
    }
  }
  for (const record of [...movedRows, ...addedRows]) {
    rowsByCategory.get(record.category.slug)!.push(record);
  }

  const finalIds = new Set<string>();
  const finalSlugs = new Set<string>();
  for (const record of remaining) {
    if (finalIds.has(record.id))
      return fail(`duplicate curated service ID ${record.id}`);
    if (finalSlugs.has(record.slug))
      return fail(`duplicate curated service slug ${record.slug}`);
    finalIds.add(record.id);
    finalSlugs.add(record.slug);
  }

  return candidates.map(candidate => {
    if (!candidate.path.startsWith(SERVICES_PREFIX)) return candidate;
    const categorySlug = path.basename(candidate.path, '.json');
    return { ...candidate, data: rowsByCategory.get(categorySlug) ?? [] };
  });
}
