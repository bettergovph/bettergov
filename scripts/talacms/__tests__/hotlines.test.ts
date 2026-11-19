import { describe, it, expect } from 'vitest';
import { buildCriticalHotlines } from '../hotlines';
import type { TalaCmsClient } from '../client';

const clientReturning = (payload: unknown): TalaCmsClient =>
  (async () => payload) as TalaCmsClient;

const record = (over: Record<string, unknown> = {}) => ({
  position: 0,
  name: 'National Emergency Hotline',
  category: 'Emergency',
  numbers: ['911'],
  description: 'National emergency response hotline',
  ...over,
});

const payloadOf = (records: unknown[]) => ({
  _allHotlinesMeta: { count: records.length },
  allHotlines: records,
});

describe('buildCriticalHotlines', () => {
  it('produces a critical_hotlines.json candidate sorted by position', async () => {
    const candidate = await buildCriticalHotlines(
      clientReturning(
        payloadOf([
          record({ position: 1 }),
          record({
            position: 0,
            name: 'PNP Emergency',
            category: 'Security',
            numbers: ['117'],
            description: 'Police',
          }),
        ])
      )
    );

    expect(candidate.path).toBe('src/data/critical_hotlines.json');
    expect(candidate.schemaPath).toBe(
      'src/data/schema/critical_hotlines.schema.json'
    );

    // Sorted by position, full numbers array retained, no id/isCritical/position.
    expect(candidate.data).toEqual([
      {
        name: 'PNP Emergency',
        category: 'Security',
        numbers: ['117'],
        description: 'Police',
      },
      {
        name: 'National Emergency Hotline',
        category: 'Emergency',
        numbers: ['911'],
        description: 'National emergency response hotline',
      },
    ]);
  });

  it('retains every number, not just the first', async () => {
    const candidate = await buildCriticalHotlines(
      clientReturning(
        payloadOf([record({ numbers: ['0917-899-8727', '989-8727'] })])
      )
    );
    const data = candidate.data as { numbers: string[] }[];
    expect(data[0].numbers).toEqual(['0917-899-8727', '989-8727']);
  });

  it.each([
    [
      'returned/meta mismatch',
      { _allHotlinesMeta: { count: 4 }, allHotlines: [record()] },
      /incomplete/i,
    ],
    ['zero critical hotlines', payloadOf([]), /no critical hotlines/i],
    ['a blank name', payloadOf([record({ name: '  ' })]), /blank/i],
    ['a blank description', payloadOf([record({ description: '' })]), /blank/i],
    [
      'a category outside the schema enum',
      payloadOf([record({ category: 'Nonsense' })]),
      /category/i,
    ],
    [
      'numbers that are not an array',
      payloadOf([record({ numbers: '911' })]),
      /numbers/i,
    ],
    [
      'an empty numbers array',
      payloadOf([record({ numbers: [] })]),
      /numbers/i,
    ],
    [
      'a blank element in numbers',
      payloadOf([record({ numbers: ['  '] })]),
      /numbers/i,
    ],
    ['a null position', payloadOf([record({ position: null })]), /position/i],
    [
      'tied positions',
      payloadOf([record(), record({ name: 'Other' })]),
      /position/i,
    ],
  ])(
    'fails closed on %s — never drops a row',
    async (_label, payload, pattern) => {
      await expect(
        buildCriticalHotlines(clientReturning(payload))
      ).rejects.toThrow(pattern);
    }
  );

  it('keeps meta ahead of the collection and pins the filter and page size', async () => {
    const { HOTLINES_QUERY } = await import('../hotlines');
    expect(HOTLINES_QUERY.indexOf('_allHotlinesMeta')).toBeLessThan(
      HOTLINES_QUERY.indexOf('allHotlines(')
    );
    expect(HOTLINES_QUERY).toContain('isCritical: { eq: true }');
    expect(HOTLINES_QUERY).toContain('orderBy: [position_ASC]');
    expect(HOTLINES_QUERY).toContain('first: 50');
    // HotlineRecord has no `published` field; referencing one is a GraphQL error.
    expect(HOTLINES_QUERY).not.toContain('published');
  });
});
