import { describe, it, expect, vi } from 'vitest';
import { assertUniquePaths, run } from '../sync-talacms';
import type { TalaCmsClient } from '../talacms/client';

const categoriesPayload = {
  _allServiceCategoriesMeta: { count: 1 },
  allServiceCategories: [
    {
      position: 0,
      category: 'Health',
      slug: 'health',
      subcategories: [
        { name: 'Financial Assistance', slug: 'financial-assistance' },
      ],
    },
  ],
};

const hotlinesPayload = {
  _allHotlinesMeta: { count: 1 },
  allHotlines: [
    {
      position: 0,
      name: 'National Emergency Hotline',
      category: 'Emergency',
      numbers: ['911'],
      description: 'National emergency response hotline',
    },
  ],
};

const servicesPayload = {
  _allGovernmentServicesMeta: { count: 1 },
  allGovernmentServices: [
    {
      sourceId: 'svc-1',
      position: 0,
      service: 'Apply for Financial Assistance',
      slug: 'apply-for-financial-assistance',
      url: 'https://example.gov.ph/',
      published: true,
      featured: false,
      createdAt: '2025-06-06T11:30:06.318Z',
      updatedAt: '2025-06-06T11:30:06.318Z',
      category: { slug: 'health', category: 'Health' },
      subcategory: {
        slug: 'financial-assistance',
        name: 'Financial Assistance',
        category: { slug: 'health' },
      },
    },
  ],
};

const committedTaxonomy = {
  categories: [
    {
      category: 'Health',
      slug: 'health',
      subcategories: [
        { name: 'Financial Assistance', slug: 'financial-assistance' },
      ],
    },
  ],
};

const queriesOf = (client: TalaCmsClient) =>
  (client as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
    c => c[0] as string
  );
const pathsOf = (deps: { commitFiles: unknown }) =>
  (deps.commitFiles as ReturnType<typeof vi.fn>).mock.calls[0][0].map(
    (f: { path: string }) => f.path
  );

const makeDeps = (over: Record<string, unknown> = {}) => {
  const client = vi.fn(async (query: string) => {
    if (query.includes('SyncServiceCategories')) return categoriesPayload;
    if (query.includes('SyncGovernmentServices')) return servicesPayload;
    return hotlinesPayload;
  }) as unknown as TalaCmsClient;

  return {
    client,
    deps: {
      createClient: () => client,
      readServiceRecords: vi.fn(() => [
        {
          category: { name: 'Health', slug: 'health' },
          subcategory: {
            name: 'Financial Assistance',
            slug: 'financial-assistance',
          },
        },
      ]),
      readTaxonomy: vi.fn(() => committedTaxonomy),
      readServiceFileNames: vi.fn(() => ['health.json']),
      prepare: vi.fn(async (c: { path: string }) => ({
        path: c.path,
        text: 'text',
        changed: true,
      })),
      commitFiles: vi.fn(async () => undefined),
      log: vi.fn(),
      ...over,
    },
  };
};

describe('run', () => {
  it('writes all three datasets and exits 0', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(deps.commitFiles).toHaveBeenCalledTimes(1);
    const written = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(written.map((f: { path: string }) => f.path)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/health.json',
    ]);
  });

  it('writes nothing and exits 3 on drift under --dry-run', async () => {
    const { deps } = makeDeps();
    await expect(run(['--dry-run'], deps as never)).resolves.toBe(3);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('exits 0 under --dry-run when nothing changed', async () => {
    const { deps } = makeDeps({
      prepare: vi.fn(async (c: { path: string }) => ({
        path: c.path,
        text: 'text',
        changed: false,
      })),
    });
    await expect(run(['--dry-run'], deps as never)).resolves.toBe(0);
  });

  it('--only=hotlines never queries or reads anything for categories', async () => {
    const { client, deps } = makeDeps();
    await expect(run(['--only=hotlines'], deps as never)).resolves.toBe(0);

    const queries = (
      client as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.map(c => c[0] as string);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('SyncCriticalHotlines');
    expect(deps.readServiceRecords).not.toHaveBeenCalled();

    const written = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(written.map((f: { path: string }) => f.path)).toEqual([
      'src/data/critical_hotlines.json',
    ]);
  });

  it('--only=categories never reads the hotlines file', async () => {
    const { client, deps } = makeDeps();
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(0);
    const queries = (
      client as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.map(c => c[0] as string);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('SyncServiceCategories');
  });

  it('writes nothing when the SECOND candidate fails preparation', async () => {
    // The first dataset prepares cleanly; the second is rejected by its
    // schema. Nothing may reach the filesystem — this is the case a
    // "validate as you go, write as you go" implementation would get wrong.
    const prepare = vi
      .fn()
      .mockResolvedValueOnce({
        path: 'src/data/service_categories.json',
        text: 'ok',
        changed: true,
      })
      .mockRejectedValueOnce(new Error('does not satisfy schema'));
    const { deps } = makeDeps({ prepare });

    await expect(run([], deps as never)).resolves.toBe(1);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('fails on configuration BEFORE opening any local dataset file', async () => {
    const { deps } = makeDeps({
      createClient: () => {
        throw new Error(
          'TalaCMS is not configured: TALACMS_API_TOKEN is unset'
        );
      },
    });

    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.readServiceRecords).not.toHaveBeenCalled();
    expect(deps.prepare).not.toHaveBeenCalled();
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('exits 1 and writes nothing when a dataset fails', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        (async () => {
          throw new Error('TalaCMS is unreachable');
        }) as unknown as TalaCmsClient,
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it.each([['--nope'], ['--only=everything']])(
    'exits 1 on invalid argument %s',
    async arg => {
      const { deps } = makeDeps();
      await expect(run([arg], deps as never)).resolves.toBe(1);
      expect(deps.commitFiles).not.toHaveBeenCalled();
    }
  );
});

describe('services orchestration', () => {
  it('writes all three datasets, services last and in path order', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/health.json',
    ]);
  });

  it('orders service candidates by path codepoint, not by taxonomy position', async () => {
    // The taxonomy deliberately lists `health` before `business-trade`; the
    // written order must still be codepoint order, so preparation order, the
    // status lines and commitFiles' rename order stay reproducible.
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) {
        return {
          _allServiceCategoriesMeta: { count: 2 },
          allServiceCategories: [
            {
              position: 0,
              category: 'Health',
              slug: 'health',
              subcategories: [
                { name: 'Financial Assistance', slug: 'financial-assistance' },
              ],
            },
            {
              position: 1,
              category: 'Business and Trade',
              slug: 'business-trade',
              subcategories: [
                {
                  name: 'Business Registration',
                  slug: 'business-registration',
                },
              ],
            },
          ],
        };
      }
      if (query.includes('SyncGovernmentServices')) return servicesPayload;
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;

    const { deps } = makeDeps({
      createClient: () => client,
      readServiceFileNames: vi.fn(() => ['business-trade.json', 'health.json']),
    });
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/business-trade.json',
      'src/data/services/health.json',
    ]);
  });

  it('--only=services issues NO taxonomy query and reads the committed taxonomy', async () => {
    const { client, deps } = makeDeps();
    await expect(run(['--only=services'], deps as never)).resolves.toBe(0);
    const queries = queriesOf(client);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('SyncGovernmentServices');
    expect(deps.readTaxonomy).toHaveBeenCalled();
    expect(deps.readServiceRecords).not.toHaveBeenCalled();
    expect(pathsOf(deps)).toEqual(['src/data/services/health.json']);
  });

  it('--only=categories issues NO services query and applies no ordering gate', async () => {
    // Asserted by observing the injected client: a future implementation must
    // not quietly fetch `position` to "complete" the ordering check.
    const { client, deps } = makeDeps();
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(0);
    const queries = queriesOf(client);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain('SyncServiceCategories');
    expect(deps.readTaxonomy).not.toHaveBeenCalled();
    expect(deps.readServiceRecords).toHaveBeenCalled();
    expect(pathsOf(deps)).toEqual(['src/data/service_categories.json']);
  });

  it('--only=categories succeeds when the CMS adds a category with no service file on disk', async () => {
    // The one-directional allowance. Without this the file-set gate would be
    // silently wired into a mode where it must not apply, breaking a workflow
    // that works today.
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) {
        return {
          _allServiceCategoriesMeta: { count: 2 },
          allServiceCategories: [
            ...categoriesPayload.allServiceCategories,
            {
              position: 1,
              category: 'Brand New',
              slug: 'brand-new',
              subcategories: [{ name: 'Something', slug: 'something' }],
            },
          ],
        };
      }
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(0);
    expect(deps.readServiceFileNames).not.toHaveBeenCalled();
  });

  it('--only=services is BLIND to a category added in TalaCMS — the file-set gate only ever confirms the status quo', async () => {
    // Documents the §6.0 blindness as a test so it cannot be mistaken for a
    // guarantee. The generated file set is derived from the COMMITTED
    // taxonomy, which is already consistent with the on-disk files, so a
    // category that exists in TalaCMS but not in that committed copy cannot
    // be seen. Only a full sync surfaces taxonomy file churn.
    const { client, deps } = makeDeps();
    await expect(run(['--only=services'], deps as never)).resolves.toBe(0);
    expect(queriesOf(client)).toHaveLength(1);
    expect(deps.readServiceFileNames).toHaveBeenCalled();
    // Every generated path came from the committed taxonomy, not the CMS.
    expect(pathsOf(deps)).toEqual(['src/data/services/health.json']);
  });

  it('fails --only=services when the candidate records disagree with the committed taxonomy', async () => {
    const { client, deps } = makeDeps({
      readTaxonomy: vi.fn(() => ({
        categories: [
          {
            category: 'Health!',
            slug: 'health',
            subcategories: [
              { name: 'Financial Assistance', slug: 'financial-assistance' },
            ],
          },
        ],
      })),
    });
    await expect(run(['--only=services'], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    expect(
      queriesOf(client).some(q => q.includes('SyncServiceCategories'))
    ).toBe(false);
  });

  it('fails --only=categories when the candidate taxonomy disagrees with committed record names', async () => {
    // The mode that was unimplementable before readServiceRecords widened.
    const { deps } = makeDeps({
      readServiceRecords: vi.fn(() => [
        {
          category: { name: 'Health!', slug: 'health' },
          subcategory: {
            name: 'Financial Assistance',
            slug: 'financial-assistance',
          },
        },
      ]),
    });
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('a full sync passes when both candidates agree, whatever the committed sides say', async () => {
    // Proves the candidates are the authority in a full sync — the symmetry
    // that makes a rename landable through a full sync and only through one.
    const { deps } = makeDeps({
      readTaxonomy: vi.fn(() => {
        throw new Error(
          'the committed taxonomy must not be read in a full sync'
        );
      }),
      readServiceRecords: vi.fn(() => {
        throw new Error('committed records must not be read in a full sync');
      }),
    });
    await expect(run([], deps as never)).resolves.toBe(0);
  });

  it('rejects duplicate candidate paths, naming the duplicated path', () => {
    // §6.10 is tested directly, not through `run`. No valid pipeline input can
    // produce two candidates sharing a path — `shapeServices` keys its buckets
    // by category slug, and a duplicate slug is already rejected upstream by
    // both the structural gate and `parseTaxonomy`. That unreachability is the
    // point of the gate: it makes the failure mode unrepresentable rather than
    // merely unlikely. Its "before the first prepare call" ordering is
    // structural — `buildCandidates` runs it and returns before `run` prepares
    // anything, so no candidate can reach `prepare` past it.
    expect(() =>
      assertUniquePaths([
        { path: 'src/data/services/health.json', schemaPath: 's', data: [] },
        { path: 'src/data/services/health.json', schemaPath: 's', data: [] },
      ])
    ).toThrow(
      '[sync] two candidates would write src/data/services/health.json; refusing to write either'
    );
  });

  it('accepts distinct candidate paths — the gate is not vacuous', () => {
    expect(() =>
      assertUniquePaths([
        { path: 'src/data/services/health.json', schemaPath: 's', data: [] },
        { path: 'src/data/services/tax.json', schemaPath: 's', data: [] },
      ])
    ).not.toThrow();
  });

  it('never reaches prepare when any gate fails', async () => {
    // The general form of "nothing is prepared once validation fails", using a
    // failure that IS reachable: a candidate record naming a category the
    // committed taxonomy lacks.
    const { deps } = makeDeps({
      readTaxonomy: vi.fn(() => ({
        categories: [
          {
            category: 'Tax',
            slug: 'tax',
            subcategories: [{ name: 'Filing', slug: 'filing' }],
          },
        ],
      })),
    });
    await expect(run(['--only=services'], deps as never)).resolves.toBe(1);
    expect(deps.prepare).not.toHaveBeenCalled();
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('exits 1 on an unknown dataset and names all three in the message', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=everything'], deps as never)).resolves.toBe(1);
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toContain('categories, hotlines, services');
  });
});
