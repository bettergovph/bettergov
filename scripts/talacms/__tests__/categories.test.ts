import { describe, it, expect } from 'vitest';
import { buildCategories, type ServiceRecordRef } from '../categories';
import type { TalaCmsClient } from '../client';

const clientReturning = (payload: unknown): TalaCmsClient =>
  (async () => payload) as TalaCmsClient;

/** Two categories, deliberately returned out of position order. */
const validPayload = {
  _allServiceCategoriesMeta: { count: 2 },
  allServiceCategories: [
    {
      position: 1,
      category: 'Health',
      slug: 'health',
      subcategories: [
        { name: 'Financial Assistance', slug: 'financial-assistance' },
      ],
    },
    {
      position: 0,
      category: 'Business and Trade',
      slug: 'business-trade',
      subcategories: [
        { name: 'Business Registration', slug: 'business-registration' },
      ],
    },
  ],
};

const records: ServiceRecordRef[] = [
  {
    category: { name: 'Health', slug: 'health' },
    subcategory: { name: 'Financial Assistance', slug: 'financial-assistance' },
  },
  {
    category: { name: 'Business and Trade', slug: 'business-trade' },
    subcategory: {
      name: 'Business Registration',
      slug: 'business-registration',
    },
  },
];

const withCategories = (categories: unknown[]) => ({
  _allServiceCategoriesMeta: { count: categories.length },
  allServiceCategories: categories,
});

const category = (over: Record<string, unknown> = {}) => ({
  position: 0,
  category: 'Health',
  slug: 'health',
  subcategories: [
    { name: 'Financial Assistance', slug: 'financial-assistance' },
  ],
  ...over,
});

describe('buildCategories', () => {
  it('produces the exact file contract, sorted by position, with no extra keys', async () => {
    const candidate = await buildCategories(
      clientReturning(validPayload),
      records
    );

    expect(candidate.path).toBe('src/data/service_categories.json');
    expect(candidate.schemaPath).toBe(
      'src/data/schema/service_categories.schema.json'
    );
    expect(candidate.data).toEqual({
      categories: [
        {
          category: 'Business and Trade',
          slug: 'business-trade',
          subcategories: [
            { name: 'Business Registration', slug: 'business-registration' },
          ],
        },
        {
          category: 'Health',
          slug: 'health',
          subcategories: [
            { name: 'Financial Assistance', slug: 'financial-assistance' },
          ],
        },
      ],
    });
  });

  it('writes CMS display names verbatim, including suspicious punctuation', async () => {
    const payload = withCategories([
      category({ category: 'Education!', slug: 'education' }),
    ]);
    const candidate = await buildCategories(clientReturning(payload), []);
    expect(
      (candidate.data as { categories: { category: string }[] }).categories[0]
        .category
    ).toBe('Education!');
  });

  it.each([
    [
      'returned/meta mismatch',
      {
        _allServiceCategoriesMeta: { count: 5 },
        allServiceCategories: [category()],
      },
      /incomplete/i,
    ],
    ['zero categories', withCategories([]), /no categories/i],
    [
      'a slug that violates the schema pattern',
      withCategories([category({ slug: 'Health Services' })]),
      /slug/i,
    ],
    [
      'a category with no subcategories',
      withCategories([category({ subcategories: [] })]),
      /subcategor/i,
    ],
    [
      'a whitespace-only category name',
      withCategories([category({ category: '   ' })]),
      /blank/i,
    ],
    [
      'a whitespace-only subcategory name',
      withCategories([
        category({
          subcategories: [{ name: '  ', slug: 'financial-assistance' }],
        }),
      ]),
      /blank/i,
    ],
    [
      'duplicate category slugs',
      withCategories([category(), category({ position: 1 })]),
      /duplicate category slug/i,
    ],
    [
      'duplicate subcategory slugs within one parent',
      withCategories([
        category({
          subcategories: [
            { name: 'A', slug: 'financial-assistance' },
            { name: 'B', slug: 'financial-assistance' },
          ],
        }),
      ]),
      /duplicate subcategory slug/i,
    ],
    [
      'a null position',
      withCategories([category({ position: null })]),
      /position/i,
    ],
    [
      'tied positions',
      withCategories([category(), category({ slug: 'education' })]),
      /position/i,
    ],
  ])('fails closed on %s', async (_label, payload, pattern) => {
    await expect(buildCategories(clientReturning(payload), [])).rejects.toThrow(
      pattern
    );
  });

  it('fails when the returned count reaches the page-size ceiling', async () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      category({ position: i, slug: `cat-${i}` })
    );
    await expect(
      buildCategories(clientReturning(withCategories(many)), [])
    ).rejects.toThrow(/ceiling/i);
  });

  describe('referential integrity against committed service records', () => {
    it('fails when a category slug that records reference is missing', async () => {
      const payload = withCategories([category()]);
      const orphaning = [
        {
          category: { name: 'Tax', slug: 'tax' },
          subcategory: { name: 'Filing', slug: 'filing' },
        },
      ];
      await expect(
        buildCategories(clientReturning(payload), orphaning)
      ).rejects.toThrow(/tax/);
    });

    it('fails when a subcategory moved to a different parent', async () => {
      const payload = withCategories([
        category({ position: 0, slug: 'health' }),
        category({
          position: 1,
          category: 'Tax',
          slug: 'tax',
          subcategories: [
            { name: 'Financial Assistance', slug: 'financial-assistance' },
          ],
        }),
      ]);
      // The record says health/financial-assistance; the candidate below
      // keeps that pair, so flip it to prove parent scoping is enforced.
      const moved = withCategories([
        category({
          position: 0,
          slug: 'health',
          subcategories: [{ name: 'Other', slug: 'other' }],
        }),
        category({
          position: 1,
          category: 'Tax',
          slug: 'tax',
          subcategories: [
            { name: 'Financial Assistance', slug: 'financial-assistance' },
          ],
        }),
      ]);
      await expect(
        buildCategories(clientReturning(moved), [
          {
            category: { name: 'Health', slug: 'health' },
            subcategory: {
              name: 'Financial Assistance',
              slug: 'financial-assistance',
            },
          },
        ])
      ).rejects.toThrow(/health\/financial-assistance/);
      // Sanity: the unmoved arrangement passes.
      await expect(
        buildCategories(clientReturning(payload), [
          {
            category: { name: 'Health', slug: 'health' },
            subcategory: {
              name: 'Financial Assistance',
              slug: 'financial-assistance',
            },
          },
        ])
      ).resolves.toBeDefined();
    });

    it('ALLOWS a generated category that has no service records', async () => {
      const payload = withCategories([
        category({ position: 0 }),
        category({
          position: 1,
          category: 'Brand New',
          slug: 'brand-new',
          subcategories: [{ name: 'Something', slug: 'something' }],
        }),
      ]);
      const candidate = await buildCategories(
        clientReturning(payload),
        records.slice(0, 1)
      );
      const slugs = (
        candidate.data as { categories: { slug: string }[] }
      ).categories.map(c => c.slug);
      expect(slugs).toContain('brand-new');
    });
  });

  it('keeps every _all*Meta field ahead of every collection field in the query', async () => {
    const { CATEGORIES_QUERY } = await import('../categories');
    const metaAt = CATEGORIES_QUERY.indexOf('_allServiceCategoriesMeta');
    const collectionAt = CATEGORIES_QUERY.indexOf('allServiceCategories(');
    expect(metaAt).toBeGreaterThan(-1);
    expect(collectionAt).toBeGreaterThan(metaAt);
    expect(CATEGORIES_QUERY).toContain('orderBy: [position_ASC]');
    expect(CATEGORIES_QUERY).toContain('first: 100');
  });
});
