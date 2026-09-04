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
  fileSet: {
    generated: ['business-trade.json', 'health.json'],
    committed: ['business-trade.json', 'health.json'],
  },
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
        fileSet: {
          generated: ['business-trade.json', 'health.json', 'brand-new.json'],
          committed: ['business-trade.json', 'health.json', 'brand-new.json'],
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
    expect(() =>
      crossValidate({ ...base, ordering: null, fileSet: null })
    ).not.toThrow();
  });
});

describe('crossValidate — file-set churn (§6.6, §6.8)', () => {
  it('fails on an added file and states the unblocking action', () => {
    let message = '';
    try {
      crossValidate({
        ...base,
        fileSet: {
          generated: ['business-trade.json', 'business-x.json', 'health.json'],
          committed: ['business-trade.json', 'health.json'],
        },
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(
      '[sync:services] the generated file set does not match the approved one.'
    );
    expect(message).toContain('would add: src/data/services/business-x.json');
    expect(message).toContain('To unblock:');
    expect(message).toContain('containing an empty array: []');
    expect(message).toContain('Category churn checklist');
    expect(message).not.toContain('would remove:');
  });

  it('fails on a removed file and never proposes deleting data automatically', () => {
    let message = '';
    try {
      crossValidate({
        ...base,
        fileSet: {
          generated: ['business-trade.json'],
          committed: ['business-trade.json', 'old-category.json'],
        },
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(
      'would remove: src/data/services/old-category.json'
    );
    expect(message).toContain('Deleting data is never automatic in this sync.');
  });

  it('passes when the sets match — a category losing its last record is not churn', () => {
    expect(() => crossValidate({ ...base, records: [] })).not.toThrow();
  });

  it('is NOT APPLIED when fileSet is null — a categories-only run generates no service files', () => {
    // Without this the one-directional allowance breaks: a new CMS category
    // with no service file yet would fail a run that works today.
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
        ordering: null,
        fileSet: null,
      })
    ).not.toThrow();
  });
});
