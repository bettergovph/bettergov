import { z } from 'zod';
import type { TalaCmsClient } from './client';
import type { Candidate } from './categories';

/** The schema's `category` enum, copied from critical_hotlines.schema.json. */
const CATEGORY_ENUM = [
  'Emergency',
  'Disaster',
  'Security',
  'Transport',
  'Weather',
  'Utility',
  'Social Services',
] as const;

const HOTLINES_PAGE_SIZE = 50;

/**
 * NOTE: `_allHotlinesMeta` precedes `allHotlines` — see the ordering rule in
 * ./categories.ts. There is deliberately no `published` filter: HotlineRecord
 * has no `published` field and referencing one is a GraphQL error.
 */
export const HOTLINES_QUERY = `
query SyncCriticalHotlines {
  _allHotlinesMeta(filter: { isCritical: { eq: true } }) {
    count
  }
  allHotlines(
    filter: { isCritical: { eq: true } }
    orderBy: [position_ASC]
    first: ${HOTLINES_PAGE_SIZE}
  ) {
    position
    name
    category
    numbers
    description
  }
}
`;

const RawHotlineSchema = z.object({
  position: z.number().int(),
  name: z.string(),
  category: z.string(),
  // `numbers` is a TalaCMS JsonField: GraphQL guarantees nothing about it.
  numbers: z.unknown(),
  description: z.string(),
});
const RawResponseSchema = z.object({
  _allHotlinesMeta: z.object({ count: z.number() }),
  allHotlines: z.array(RawHotlineSchema),
});
type RawResponse = z.infer<typeof RawResponseSchema>;

const fail = (message: string): never => {
  throw new Error(`[sync:hotlines] ${message}`);
};

function normalizeRecords(raw: RawResponse) {
  const returned = raw.allHotlines.length;
  const meta = raw._allHotlinesMeta.count;

  if (returned !== meta) {
    fail(
      `TalaCMS returned an incomplete hotline list (returned ${returned}, meta reported ${meta})`
    );
  }
  if (meta === 0) fail('TalaCMS returned no critical hotlines');
  if (returned >= HOTLINES_PAGE_SIZE) {
    fail(
      `critical hotline count reached the page-size ceiling of ${HOTLINES_PAGE_SIZE}; raise HOTLINES_PAGE_SIZE and re-run`
    );
  }

  const positions = new Set<number>();

  // A record that fails validation fails the whole sync. It is never dropped:
  // a silently short criticalHotlines array, once committed, is
  // indistinguishable from a correct one forever after.
  for (const r of raw.allHotlines) {
    if (positions.has(r.position)) {
      fail(
        `duplicate position ${r.position} — output ordering would be non-deterministic`
      );
    }
    positions.add(r.position);

    if (r.name.trim() === '') fail('a critical hotline has a blank name');
    if (r.description.trim() === '') {
      fail(`hotline "${r.name}" has a blank description`);
    }
    if (!(CATEGORY_ENUM as readonly string[]).includes(r.category)) {
      fail(
        `hotline "${r.name}" has category "${r.category}", which is not one of the schema's permitted values`
      );
    }
    if (
      !Array.isArray(r.numbers) ||
      r.numbers.length === 0 ||
      r.numbers.some(n => typeof n !== 'string' || n.trim() === '')
    ) {
      fail(`hotline "${r.name}" has an unusable numbers value`);
    }
  }

  return [...raw.allHotlines]
    .sort((a, b) => a.position - b.position)
    .map(r => ({
      name: r.name,
      category: r.category,
      numbers: (r.numbers as string[]).map(n => n),
      description: r.description,
    }));
}

export async function buildCriticalHotlines(
  client: TalaCmsClient
): Promise<Candidate> {
  const raw = RawResponseSchema.parse(
    await client<RawResponse>(HOTLINES_QUERY)
  );
  const criticalHotlines = normalizeRecords(raw);

  return {
    path: 'src/data/critical_hotlines.json',
    schemaPath: 'src/data/schema/critical_hotlines.schema.json',
    data: criticalHotlines,
  };
}
