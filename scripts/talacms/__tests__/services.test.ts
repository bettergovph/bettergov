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

describe('URL gates', () => {
  it.each([
    ['a bare scheme with no host', 'http://'],
    ['a bare https scheme with no host', 'https://'],
    ['an uppercase scheme', 'HTTP://EXAMPLE.COM'],
    ['a leading space', ' https://example.com'],
    ['an embedded tab', 'https://exam\tple.com'],
    ['a raw space in the path', 'https://example.com/a b'],
    ['a newline', 'https://example.com/a\nb'],
    ['a non-http scheme', 'ftp://example.com'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a trailing bare percent', 'https://e.com/%'],
    ['a non-hex escape', 'https://e.com/%z1'],
    ['a one-digit escape', 'https://e.com/%1'],
    ['a two-letter non-hex escape', 'https://e.com/a%zz'],
    ['a bare percent in a query', 'https://e.com/?q=%'],
    ['a percent sign used as text', 'https://e.com/100%'],
  ])('rejects %s', async (_label, url) => {
    await expect(
      fetchServices(clientReturning(withServices([service({ url })])))
    ).rejects.toThrow(
      /^\[sync:services\] service "apply-for-a-trademark" has an invalid url/
    );
  });

  it.each([
    ['a plain https URL', 'https://example.gov.ph/'],
    ['a plain http URL', 'http://oltrap.pchrd.dost.gov.ph/'],
    // Real committed data. A naive "reject any %" rule would break these.
    [
      'a real committed URL with %20 escapes',
      'https://www.prc.gov.ph/uploaded/documents/rd%20oath%20form.pdf',
    ],
    [
      'a real committed URL combining %20 with empty query values',
      'https://branddb.wipo.int/en/IPO-PH/quicksearch?by=brandName&v=&rows=30&sort=score%20desc&start=0&_=1683010258958',
    ],
    ['an escaped slash', 'https://e.com/%2F'],
    ['a correctly escaped literal percent', 'https://e.com/%25'],
  ])('accepts %s', async (_label, url) => {
    await expect(
      fetchServices(clientReturning(withServices([service({ url })])))
    ).resolves.toBeDefined();
  });
});

describe('timestamp gates', () => {
  it.each([
    ['an impossible month and day', '2025-13-45T11:30:06.318Z'],
    // Matches the pattern AND `Date` accepts it, silently rolling over to
    // March 2 — only the canonical re-serialization check catches this.
    ['a date that rolls over', '2025-02-30T00:00:00.000Z'],
    ['an impossible hour', '2025-06-06T25:00:00.000Z'],
    ['a numeric offset', '2025-06-06T11:30:06+08:00'],
    ['lowercase t and z', '2025-06-06t11:30:06.318z'],
    ['a space separator', '2025-06-06 11:30:06.318Z'],
    ['two fractional digits', '2025-06-06T11:30:06.31Z'],
    ['an empty string', ''],
  ])('rejects createdAt with %s', async (_label, createdAt) => {
    await expect(
      fetchServices(clientReturning(withServices([service({ createdAt })])))
    ).rejects.toThrow(
      /^\[sync:services\] service "apply-for-a-trademark" has an invalid createdAt/
    );
  });

  it('rejects an invalid updatedAt too, naming that field', async () => {
    await expect(
      fetchServices(
        clientReturning(
          withServices([service({ updatedAt: '2025-02-30T00:00:00.000Z' })])
        )
      )
    ).rejects.toThrow(/invalid updatedAt/);
  });

  it.each([
    ['three fractional digits', '2025-06-06T11:30:06.318Z'],
    // The shape 3 committed records (6 values) legitimately use. A naive
    // toISOString() === raw check would reject these.
    ['no fractional part at all', '2025-06-06T11:30:06Z'],
    ['a leap day that really exists', '2024-02-29T00:00:00.000Z'],
  ])('accepts %s', async (_label, createdAt) => {
    await expect(
      fetchServices(
        clientReturning(
          withServices([service({ createdAt, updatedAt: createdAt })])
        )
      )
    ).resolves.toBeDefined();
  });
});
