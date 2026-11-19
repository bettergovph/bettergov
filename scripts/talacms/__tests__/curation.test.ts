import { describe, expect, it } from 'vitest';
import type { Candidate, Taxonomy } from '../categories';
import {
  applyServiceCuration,
  curateServiceReferences,
  curateTaxonomy,
  type CuratedServiceRecord,
  type ServiceCuration,
} from '../curation';

const baseCuration = (): ServiceCuration => ({
  taxonomy: {
    renameSubcategories: [
      { categorySlug: 'alpha', subcategorySlug: 'old-name', name: 'Renamed' },
    ],
    addSubcategories: [
      {
        categorySlug: 'alpha',
        name: 'New Subcategory',
        slug: 'new-subcategory',
      },
    ],
  },
  overrides: [
    {
      id: 'record-1',
      fields: {
        description: 'Updated description',
        subcategory: { name: 'Renamed', slug: 'old-name' },
      },
    },
    {
      id: 'record-move',
      fields: {
        category: { name: 'Beta', slug: 'beta' },
        subcategory: { name: 'Destination', slug: 'destination' },
      },
    },
  ],
  removeIds: ['record-remove'],
  additions: [
    {
      id: 'record-added',
      slug: 'new-record',
      service: 'New service',
      url: 'https://example.gov.ph/new',
      category: { name: 'Alpha', slug: 'alpha' },
      subcategory: { name: 'New Subcategory', slug: 'new-subcategory' },
      published: true,
      featured: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      description: 'A newly curated service.',
    },
  ],
});

const baseTaxonomy = (): Taxonomy => ({
  categories: [
    {
      category: 'Alpha',
      slug: 'alpha',
      subcategories: [{ name: 'Old name', slug: 'old-name' }],
    },
    {
      category: 'Beta',
      slug: 'beta',
      subcategories: [{ name: 'Destination', slug: 'destination' }],
    },
  ],
});

const record = (
  id: string,
  category: { name: string; slug: string },
  subcategory: { name: string; slug: string }
): CuratedServiceRecord => ({
  id,
  slug: id,
  service: id,
  url: `https://example.gov.ph/${id}`,
  category: { ...category },
  subcategory: { ...subcategory },
  published: true,
  featured: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

describe('curated taxonomy', () => {
  it('renames and adds taxonomy entries without carrying CMS-only fields', () => {
    const source = {
      categories: [
        {
          category: 'Alpha',
          slug: 'alpha',
          position: 4,
          subcategories: [{ name: 'Old name', slug: 'old-name' }],
        },
        ...baseTaxonomy().categories.slice(1),
      ],
    } as Taxonomy;
    const result = curateTaxonomy(source, baseCuration());
    expect(result.categories[0]).toEqual({
      category: 'Alpha',
      slug: 'alpha',
      subcategories: [
        { name: 'Renamed', slug: 'old-name' },
        { name: 'New Subcategory', slug: 'new-subcategory' },
      ],
    });
  });
});

describe('curated service references', () => {
  it('applies overrides/removals/additions and aligns names to the curated taxonomy', () => {
    const taxonomy = curateTaxonomy(baseTaxonomy(), baseCuration());
    const refs = curateServiceReferences(
      [
        {
          id: 'record-1',
          category: { name: 'Alpha', slug: 'alpha' },
          subcategory: { name: 'Old name', slug: 'old-name' },
        },
        {
          id: 'record-remove',
          category: { name: 'Alpha', slug: 'alpha' },
          subcategory: { name: 'Old name', slug: 'old-name' },
        },
      ],
      taxonomy,
      baseCuration()
    );
    expect(refs.map(ref => ref.id)).toEqual(['record-1', 'record-added']);
    expect(refs[0].subcategory.name).toBe('Renamed');
    expect(refs[1].subcategory.slug).toBe('new-subcategory');
    expect(refs.filter(ref => ref.id === 'record-added')).toHaveLength(1);
  });
});

describe('generated service candidates', () => {
  it('keeps original rows in order and appends moved and new rows', () => {
    const taxonomy = curateTaxonomy(baseTaxonomy(), baseCuration());
    const candidates: Candidate[] = [
      {
        path: 'src/data/services/alpha.json',
        schemaPath: 'schema.json',
        data: [
          record(
            'record-1',
            { name: 'Alpha', slug: 'alpha' },
            { name: 'Old name', slug: 'old-name' }
          ),
          record(
            'record-move',
            { name: 'Alpha', slug: 'alpha' },
            { name: 'Old name', slug: 'old-name' }
          ),
          record(
            'record-remove',
            { name: 'Alpha', slug: 'alpha' },
            { name: 'Old name', slug: 'old-name' }
          ),
        ],
      },
      {
        path: 'src/data/services/beta.json',
        schemaPath: 'schema.json',
        data: [
          record(
            'record-beta',
            { name: 'Beta', slug: 'beta' },
            { name: 'Destination', slug: 'destination' }
          ),
        ],
      },
    ];
    const result = applyServiceCuration(candidates, taxonomy, baseCuration());
    const alpha = result[0].data as CuratedServiceRecord[];
    const beta = result[1].data as CuratedServiceRecord[];
    expect(alpha.map(row => row.id)).toEqual(['record-1', 'record-added']);
    expect(beta.map(row => row.id)).toEqual(['record-beta', 'record-move']);
    expect(alpha[0].description).toBe('Updated description');
    expect(beta[1].subcategory.name).toBe('Destination');
  });
});
