import { describe, it, expect } from 'vitest';
import { fetchServices, SERVICES_QUERY } from '../services';
import type { TalaCmsClient } from '../client';

const clientReturning = (payload: unknown): TalaCmsClient =>
  (async () => payload) as TalaCmsClient;

const service = (over: Record<string, unknown> = {}) => ({
  sourceId: 'id-1',
  position: 0,
  service: 'Apply for a Trademark',
  slug: 'apply-for-a-trademark',
  url: 'https://example.gov.ph/',
  published: true,
  featured: false,
  createdAt: '2025-06-06T11:30:06.318Z',
  updatedAt: '2025-06-06T11:30:06.318Z',
  category: { slug: 'business-trade', category: 'Business and Trade' },
  subcategory: {
    slug: 'business-registration',
    name: 'Business Registration',
    category: { slug: 'business-trade' },
  },
  ...over,
});

const withServices = (services: unknown[]) => ({
  _allGovernmentServicesMeta: { count: services.length },
  allGovernmentServices: services,
});

describe('SERVICES_QUERY', () => {
  it('declares the meta field before the collection field', () => {
    // TalaCMS returns count: 0 for a _all*Meta field if any collection field
    // appears earlier anywhere in the operation.
    expect(SERVICES_QUERY.indexOf('_allGovernmentServicesMeta')).toBeLessThan(
      SERVICES_QUERY.indexOf('allGovernmentServices(')
    );
  });

  it('asks for a page size well above the current record count', () => {
    expect(SERVICES_QUERY).toContain('first: 500');
  });

  it('reads the content timestamps, never the system ones', () => {
    expect(SERVICES_QUERY).not.toContain('_createdAt');
    expect(SERVICES_QUERY).not.toContain('_updatedAt');
  });
});

describe('fetchServices structural gates', () => {
  it('returns the parsed payload when everything is well-formed', async () => {
    const raw = await fetchServices(
      clientReturning(
        withServices([
          service(),
          service({ sourceId: 'id-2', position: 1, slug: 'other' }),
        ])
      )
    );
    expect(raw.allGovernmentServices).toHaveLength(2);
  });

  it.each([
    [
      'the returned count disagrees with meta',
      {
        _allGovernmentServicesMeta: { count: 5 },
        allGovernmentServices: [service()],
      },
      /incomplete service list/,
    ],
    ['no records at all', withServices([]), /returned no government services/],
    [
      'a blank sourceId',
      withServices([service({ sourceId: '  ' })]),
      /blank sourceId/,
    ],
    [
      'a duplicate sourceId',
      withServices([service(), service({ position: 1, slug: 'other' })]),
      /duplicate sourceId "id-1"/,
    ],
    [
      'a duplicate position',
      withServices([service(), service({ sourceId: 'id-2', slug: 'other' })]),
      /duplicate position 0/,
    ],
    [
      'a duplicate slug',
      withServices([service(), service({ sourceId: 'id-2', position: 1 })]),
      /duplicate service slug/,
    ],
    [
      'a record slug breaking the pattern',
      withServices([service({ slug: 'Not A Slug' })]),
      /does not match the schema slug pattern/,
    ],
    [
      'a category slug breaking the pattern',
      withServices([
        service({ category: { slug: 'Not A Slug', category: 'X' } }),
      ]),
      /does not match the schema slug pattern/,
    ],
    [
      'a blank service name',
      withServices([service({ service: '   ' })]),
      /has a blank service name/,
    ],
    [
      'a subcategory whose parent disagrees with the record category',
      withServices([
        service({
          subcategory: {
            slug: 'business-registration',
            name: 'Business Registration',
            category: { slug: 'health' },
          },
        }),
      ]),
      /orphaned subcategory relation/,
    ],
  ])('fails closed on %s', async (_label, payload, pattern) => {
    await expect(fetchServices(clientReturning(payload))).rejects.toThrow(
      pattern
    );
    await expect(fetchServices(clientReturning(payload))).rejects.toThrow(
      /^\[sync:services\] /
    );
  });

  it('accepts a non-hex, hand-authored sourceId — the gate protects presence and uniqueness, not format', async () => {
    // Three live records already carry values like `…4g7g…`.
    await expect(
      fetchServices(
        clientReturning(withServices([service({ sourceId: 'a1b2-4g7g-zz' })]))
      )
    ).resolves.toBeDefined();
  });

  it('fails when the record count reaches the page-size ceiling', async () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      service({ sourceId: `id-${i}`, position: i, slug: `slug-${i}` })
    );
    await expect(
      fetchServices(clientReturning(withServices(many)))
    ).rejects.toThrow(/reached the page-size ceiling of 500/);
  });
});
