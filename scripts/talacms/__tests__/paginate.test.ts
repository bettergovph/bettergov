import { describe, it, expect } from 'vitest';
import {
  CDA_MAX_PAGE,
  fetchAllRecords,
  type PaginatedFetch,
} from '../paginate';
import type { TalaCmsClient } from '../client';

type Rec = { id: string };

/** Builds `count` records like `{ id: 'r0' }, { id: 'r1' }, ...`. */
function records(count: number, offset = 0): Rec[] {
  return Array.from({ length: count }, (_, i) => ({ id: `r${offset + i}` }));
}

const COUNT_QUERY = 'query Count { _allWidgetsMeta { count } }';

function baseOptions(overrides: Partial<PaginatedFetch> = {}): PaginatedFetch {
  return {
    label: 'widgets',
    countQuery: COUNT_QUERY,
    countField: '_allWidgetsMeta',
    collectionField: 'allWidgets',
    page: (skip, first) =>
      `query Page { allWidgets(skip: ${skip}, first: ${first}, orderBy: [id_ASC]) { id } }`,
    ceiling: 10000,
    ...overrides,
  };
}

/**
 * Builds a client from a fixed count and an ordered list of pages, and
 * records every document it receives (in the order received) so tests can
 * assert on request shape and count.
 */
function clientWithPages(
  count: number,
  pages: Rec[][]
): {
  client: TalaCmsClient;
  received: string[];
} {
  const received: string[] = [];
  let callIndex = 0;
  const client: TalaCmsClient = (async <T>(query: string): Promise<T> => {
    received.push(query);
    if (query.includes('_allWidgetsMeta')) {
      return { _allWidgetsMeta: { count } } as T;
    }
    const page = pages[callIndex] ?? [];
    callIndex += 1;
    return { allWidgets: page } as T;
  }) as TalaCmsClient;
  return { client, received };
}

describe('fetchAllRecords', () => {
  it('assembles 3 pages (500/500/435) into 1435 records, in wire order', async () => {
    const page0 = records(500, 0);
    const page1 = records(500, 500);
    const page2 = records(435, 1000);
    const { client } = clientWithPages(1435, [page0, page1, page2]);

    const result = await fetchAllRecords<Rec>(client, baseOptions());

    expect(result).toHaveLength(1435);
    expect(result).toEqual([...page0, ...page1, ...page2]);
  });

  it('stops on the first short page, and issues no further request', async () => {
    const page0 = records(500, 0);
    const page1 = records(200, 500);
    const { client, received } = clientWithPages(700, [page0, page1]);

    const result = await fetchAllRecords<Rec>(client, baseOptions());

    expect(result).toHaveLength(700);
    // 1 count query + 2 page queries — a short page must stop the loop.
    expect(received).toHaveLength(3);
  });

  it('issues one extra request returning [] when the collection is an exact multiple of CDA_MAX_PAGE', async () => {
    const page0 = records(CDA_MAX_PAGE, 0);
    const page1 = records(CDA_MAX_PAGE, CDA_MAX_PAGE);
    const { client, received } = clientWithPages(2 * CDA_MAX_PAGE, [
      page0,
      page1,
      [],
    ]);

    const result = await fetchAllRecords<Rec>(client, baseOptions());

    expect(result).toHaveLength(2 * CDA_MAX_PAGE);
    // 1 count query + 2 full pages + 1 trailing empty page.
    expect(received).toHaveLength(4);
  });

  it('throws naming both numbers and the label when accumulated total does not match the separately-fetched count', async () => {
    // Count says 700, but only one short page of 500 is ever returned —
    // the loop stops there (500 < CDA_MAX_PAGE), leaving a mismatch.
    const page0 = records(500, 0);
    const { client } = clientWithPages(700, [page0]);

    await expect(fetchAllRecords<Rec>(client, baseOptions())).rejects.toThrow(
      /\[sync:paginate\].*widgets.*500.*700|\[sync:paginate\].*widgets.*700.*500/
    );
  });

  it('throws naming the id when the same id appears on two pages', async () => {
    const page0 = records(500, 0);
    // Second page repeats the last id of page0 ("r499") instead of continuing.
    const page1 = [{ id: 'r499' }, ...records(199, 500)];
    const { client } = clientWithPages(699, [page0, page1]);

    await expect(fetchAllRecords<Rec>(client, baseOptions())).rejects.toThrow(
      /\[sync:paginate\].*r499/
    );
  });

  it('throws "TalaCMS returned no <label>" when count is 0', async () => {
    const { client } = clientWithPages(0, []);

    await expect(fetchAllRecords<Rec>(client, baseOptions())).rejects.toThrow(
      '[sync:paginate] TalaCMS returned no widgets'
    );
  });

  it('throws naming the constant to raise when count >= ceiling', async () => {
    const { client } = clientWithPages(10000, []);

    await expect(
      fetchAllRecords<Rec>(client, baseOptions({ ceiling: 10000 }))
    ).rejects.toThrow(/\[sync:paginate\].*widgets.*10000/);
  });

  it('terminates via the derived page bound when a client never returns a short page', async () => {
    const ceiling = 1200;
    const received: string[] = [];
    const client: TalaCmsClient = (async <T>(query: string): Promise<T> => {
      received.push(query);
      if (query.includes('_allWidgetsMeta')) {
        return { _allWidgetsMeta: { count: 1100 } } as T;
      }
      // Always returns a full page, never a short one and never [].
      return { allWidgets: records(CDA_MAX_PAGE, 0) } as T;
    }) as TalaCmsClient;

    await expect(
      fetchAllRecords<Rec>(client, baseOptions({ ceiling }))
    ).rejects.toThrow('[sync:paginate]');

    // Bound is Math.ceil(ceiling / CDA_MAX_PAGE) + 1 page requests, plus 1
    // count request — the loop must not run forever.
    const expectedPageRequests = Math.ceil(ceiling / CDA_MAX_PAGE) + 1;
    expect(received.length).toBeLessThanOrEqual(expectedPageRequests + 1);
  });

  it('page documents carry no meta field', async () => {
    const page0 = records(10, 0);
    const { client, received } = clientWithPages(10, [page0]);

    await fetchAllRecords<Rec>(client, baseOptions());

    const pageDocuments = received.filter(q => !q.includes('_allWidgetsMeta'));
    expect(pageDocuments.length).toBeGreaterThan(0);
    for (const doc of pageDocuments) {
      expect(doc).not.toMatch(/_all\w*Meta/);
    }
  });

  it('every page document contains id_ASC', async () => {
    const page0 = records(10, 0);
    const { client, received } = clientWithPages(10, [page0]);

    await fetchAllRecords<Rec>(client, baseOptions());

    const pageDocuments = received.filter(q => !q.includes('_allWidgetsMeta'));
    expect(pageDocuments.length).toBeGreaterThan(0);
    for (const doc of pageDocuments) {
      expect(doc).toContain('id_ASC');
    }
  });

  it('issues the count query as its own document, separate from every page document', async () => {
    const page0 = records(10, 0);
    const { client, received } = clientWithPages(10, [page0]);

    await fetchAllRecords<Rec>(client, baseOptions());

    const countDocuments = received.filter(q => q.includes('_allWidgetsMeta'));
    expect(countDocuments).toHaveLength(1);
    for (const doc of countDocuments) {
      expect(doc).not.toContain('allWidgets(');
    }
  });
});
