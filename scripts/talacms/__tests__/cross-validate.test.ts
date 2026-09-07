import { describe, it, expect } from 'vitest';
import { crossValidate } from '../services';
import type { ServiceRecordRef, Taxonomy } from '../categories';

const taxonomy: Taxonomy = {
  categories: [
    {
      category: 'Business and Trade',
      slug: 'business-trade',
      subcategories: [
        { name: 'Business Registration', slug: 'business-registration' },
        { name: 'Financial Assistance', slug: 'financial-assistance' },
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
};

const records: ServiceRecordRef[] = [
  {
    category: { name: 'Business and Trade', slug: 'business-trade' },
    subcategory: {
      name: 'Business Registration',
      slug: 'business-registration',
    },
  },
  {
    category: { name: 'Health', slug: 'health' },
    subcategory: { name: 'Financial Assistance', slug: 'financial-assistance' },
  },
];

const base = {
  taxonomy,
  records,
  ordering: [
    { position: 0, categorySlug: 'business-trade' },
    { position: 1, categorySlug: 'health' },
  ],
};

describe('crossValidate — pair integrity (§6.3)', () => {
  it('passes on consistent inputs', () => {
    expect(() => crossValidate(base)).not.toThrow();
  });

  it('fails when a record references a category the taxonomy lacks', () => {
    expect(() =>
      crossValidate({
        ...base,
        records: [
          {
            category: { name: 'Tax', slug: 'tax' },
            subcategory: { name: 'Filing', slug: 'filing' },
          },
        ],
        ordering: [{ position: 0, categorySlug: 'tax' }],
      })
    ).toThrow(/\[sync:categories\].*category "tax"/);
  });

  it('allows a taxonomy category with zero records — the one-directional contract', () => {
    expect(() =>
      crossValidate({
        ...base,
        taxonomy: {
          categories: [
            ...taxonomy.categories,
            {
              category: 'Brand New',
              slug: 'brand-new',
              subcategories: [{ name: 'S', slug: 's' }],
            },
          ],
        },
      })
    ).not.toThrow();
  });
});

describe('crossValidate — name agreement (§6.4)', () => {
  it('fails when a record category name disagrees with the taxonomy', () => {
    expect(() =>
      crossValidate({
        ...base,
        records: [
          {
            category: { name: 'Business and Trade.', slug: 'business-trade' },
            subcategory: {
              name: 'Business Registration',
              slug: 'business-registration',
            },
          },
        ],
        ordering: [{ position: 0, categorySlug: 'business-trade' }],
      })
    ).toThrow(
      /^\[sync:services\] category "business-trade" is named "Business and Trade\." on a service record but "Business and Trade" in the taxonomy/
    );
  });

  it('fails when a subcategory name disagrees', () => {
    expect(() =>
      crossValidate({
        ...base,
        records: [
          {
            category: { name: 'Health', slug: 'health' },
            subcategory: {
              name: 'Financial Assistance!',
              slug: 'financial-assistance',
            },
          },
        ],
        ordering: [{ position: 0, categorySlug: 'health' }],
      })
    ).toThrow(/subcategory "health\/financial-assistance" is named/);
  });

  it('keys subcategory names by (categorySlug, subcategorySlug), not by bare slug', () => {
    // `financial-assistance` exists under both parents with DIFFERENT names
    // here. A globally-keyed map would raise a false disagreement.
    const twoParents: Taxonomy = {
      categories: [
        {
          category: 'Business and Trade',
          slug: 'business-trade',
          subcategories: [
            { name: 'Trade Grants', slug: 'financial-assistance' },
          ],
        },
        {
          category: 'Health',
          slug: 'health',
          subcategories: [
            { name: 'Medical Aid', slug: 'financial-assistance' },
          ],
        },
      ],
    };
    expect(() =>
      crossValidate({
        ...base,
        taxonomy: twoParents,
        records: [
          {
            category: { name: 'Business and Trade', slug: 'business-trade' },
            subcategory: {
              name: 'Trade Grants',
              slug: 'financial-assistance',
            },
          },
          {
            category: { name: 'Health', slug: 'health' },
            subcategory: { name: 'Medical Aid', slug: 'financial-assistance' },
          },
        ],
      })
    ).not.toThrow();
  });
});

describe('crossValidate — global ordering (§6.5)', () => {
  it('passes when position order yields category-contiguous blocks in codepoint order', () => {
    expect(() =>
      crossValidate({
        ...base,
        ordering: [
          { position: 5, categorySlug: 'business-trade' },
          { position: 0, categorySlug: 'business-trade' },
          { position: 9, categorySlug: 'health' },
        ],
      })
    ).not.toThrow();
  });

  it('fails, naming the first divergence, when categories interleave', () => {
    expect(() =>
      crossValidate({
        ...base,
        ordering: [
          { position: 0, categorySlug: 'business-trade' },
          { position: 1, categorySlug: 'health' },
          { position: 2, categorySlug: 'business-trade' },
        ],
      })
    ).toThrow(
      /^\[sync:services\] global `position` order does not match codepoint filename order: position 2 lands in src\/data\/services\/business-trade\.json, after position 1 in src\/data\/services\/health\.json/
    );
  });

  it('is NOT APPLIED when ordering is null — position has no committed source', () => {
    expect(() => crossValidate({ ...base, ordering: null })).not.toThrow();
  });

  it('a category losing its last record is not a validation failure', () => {
    // There is no file-set gate anymore: a taxonomy category with zero
    // matching records is legitimate (an editor adds a category before its
    // services exist), and stale-file cleanup — not validation — is what
    // handles a category retired from the taxonomy.
    expect(() => crossValidate({ ...base, records: [] })).not.toThrow();
  });
});
