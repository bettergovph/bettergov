import type { TalaCmsClient } from './client';

/**
 * The CDA hard-caps `first` at 500 on top-level collection fields:
 * `first: 501`, `first: 1000` and `first: 1500` all return exactly 500
 * (verified 2026-09-09 against allLguMunicipalities, 1435 records).
 * This is a fact about the server, not a tuning knob — raising it silently
 * changes nothing and would make the short-page terminator unreachable.
 */
export const CDA_MAX_PAGE = 500;

export interface PaginatedFetch {
  /** Used in every error message. */
  label: string;
  /**
   * The count operation, ALONE in its own document. The CDA returns
   * `count: 0` for any `_all*Meta` field that follows a collection field
   * anywhere in the same operation, so it cannot share a document with a
   * page query.
   */
  countQuery: string;
  /** e.g. '_allLguMunicipalitiesMeta' */
  countField: string;
  /** e.g. 'allLguMunicipalities' */
  collectionField: string;
  /**
   * Builds one page document. MUST order by `id_ASC` and MUST NOT select any
   * `_all*Meta` field. `id` MUST be selected — it is the duplicate gate's key.
   */
  page: (skip: number, first: number) => string;
  /** Fails loudly well below any real growth path. */
  ceiling: number;
}

const fail = (message: string): never => {
  throw new Error(`[sync:paginate] ${message}`);
};

/**
 * Generic page-fetching helper for any TalaCMS collection that can exceed
 * the CDA's hard 500-record page cap (see `CDA_MAX_PAGE`). Callers supply the
 * count query, the page-document builder, and a growth ceiling; this
 * function drives the paging loop and enforces the integrity gates that make
 * skip-based paging safe (no duplicate ids, no silent truncation).
 */
export async function fetchAllRecords<T extends { id: string }>(
  client: TalaCmsClient,
  options: PaginatedFetch
): Promise<T[]> {
  const { label, countQuery, countField, collectionField, page, ceiling } =
    options;

  const countResponse =
    await client<Record<string, { count: unknown }>>(countQuery);
  const rawCount: unknown = countResponse[countField]?.count;
  if (typeof rawCount !== 'number' || Number.isNaN(rawCount)) {
    fail(`TalaCMS returned a non-numeric count for ${label}`);
  }
  // `fail` always throws; the cast just restates what the guard above
  // already proved, since `fail`'s `never` return type does not narrow
  // through a `const`-bound arrow function the way a function declaration
  // would.
  const count = rawCount as number;
  if (count === 0) {
    fail(`TalaCMS returned no ${label}`);
  }
  if (count >= ceiling) {
    fail(
      `${label} count (${count}) reached the ceiling of ${ceiling}; raise the ceiling and re-run`
    );
  }

  const maxIterations = Math.ceil(ceiling / CDA_MAX_PAGE) + 1;
  const records: T[] = [];

  let skip = 0;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const response = await client<Record<string, T[]>>(
      page(skip, CDA_MAX_PAGE)
    );
    const received = response[collectionField];
    if (!Array.isArray(received)) {
      fail(`TalaCMS returned a non-array page for ${label}`);
    }
    if (received.length > CDA_MAX_PAGE) {
      fail(
        `TalaCMS returned a page of ${received.length} ${label}, exceeding the ${CDA_MAX_PAGE}-record page cap`
      );
    }

    records.push(...received);

    if (received.length < CDA_MAX_PAGE) {
      break;
    }

    skip += CDA_MAX_PAGE;

    if (iteration === maxIterations - 1) {
      fail(
        `${label} paging exceeded ${maxIterations} requests without a short page; raise the ceiling and re-run`
      );
    }
  }

  const seenIds = new Set<string>();
  for (const record of records) {
    if (seenIds.has(record.id)) {
      fail(`duplicate ${label} id "${record.id}" across pages`);
    }
    seenIds.add(record.id);
  }

  if (records.length !== count) {
    fail(
      `${label} paging returned ${records.length} records but the count query reported ${count}; records were lost or shifted in transit`
    );
  }

  return records;
}
