import { describe, it, expect, vi } from 'vitest';
import { DATASETS, assertUniquePaths, run } from '../sync-talacms';
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

const departmentsPayload = {
  _allGovernmentDepartmentsMeta: { count: 1 },
  allGovernmentDepartments: [
    {
      position: 0,
      slug: 'department-of-x',
      officeName: 'DEPARTMENT OF X',
      address: null,
      trunkline: null,
      email: null,
      website: null,
      secretary: null,
      undersecretaries: null,
      attachedAgencies: null,
      details: null,
    },
  ],
};

const executivePayload = {
  _allExecutiveOfficesMeta: { count: 1 },
  allExecutiveOffices: [
    {
      position: 0,
      slug: 'office-of-y',
      office: 'OFFICE OF Y',
      address: null,
      phone: null,
      trunkline: null,
      email: null,
      website: null,
      officials: null,
      bureaus: null,
      attachedAgencies: null,
    },
  ],
};

/** Same slug on both sides — used only by the cross-model gate tests. */
const collidingDepartmentsPayload = {
  _allGovernmentDepartmentsMeta: { count: 1 },
  allGovernmentDepartments: [
    { ...departmentsPayload.allGovernmentDepartments[0], slug: 'shared-slug' },
  ],
};

const collidingExecutivePayload = {
  _allExecutiveOfficesMeta: { count: 1 },
  allExecutiveOffices: [
    { ...executivePayload.allExecutiveOffices[0], slug: 'shared-slug' },
  ],
};

const constitutionalPayload = {
  _allConstitutionalOfficesMeta: { count: 1 },
  allConstitutionalOffices: [
    {
      position: 0,
      slug: 'commission-on-z',
      name: 'COMMISSION ON Z',
      officeType: 'Constitutional Office',
      description: null,
      address: null,
      phone: null,
      trunklines: null,
      website: null,
      email: null,
      officials: [{ name: 'A PERSON', role: 'Chairperson' }],
      regionalOffices: null,
      publicAssistance: null,
      additionalDetails: null,
    },
  ],
};

/** Same slug as the departments payload — used only by the gate tests. */
const collidingConstitutionalPayload = {
  _allConstitutionalOfficesMeta: { count: 1 },
  allConstitutionalOffices: [
    {
      ...constitutionalPayload.allConstitutionalOffices[0],
      slug: 'shared-slug',
    },
  ],
};

const legislativePayload = {
  _allLegislativeChambersMeta: { count: 2 },
  _allHouseMembersMeta: { count: 1 },
  _allPartyListRepresentativesMeta: { count: 1 },
  allLegislativeChambers: [
    {
      position: 0,
      slug: 'senate-of-the-philippines-20th-congress',
      branch: 'Legislative Branch',
      chamber: 'Senate of the Philippines (20th Congress)',
      address: null,
      trunkline: null,
      website: null,
      officials: [{ role: 'Senate President', name: 'A PERSON' }],
      permanentCommittees: [
        { committee: 'Blue Ribbon', chairperson: 'A PERSON' },
      ],
      houseLeaders: null,
      houseCommittees: null,
      specialCommittees: null,
      secretariatOfficials: null,
      houseMembers: [],
      partyListRepresentatives: [],
    },
    {
      position: 1,
      slug: 'house-of-representatives-20th-congress',
      branch: 'Legislative Branch',
      chamber: 'House of Representatives (20th Congress)',
      address: null,
      trunkline: null,
      website: null,
      officials: null,
      permanentCommittees: null,
      houseLeaders: null,
      houseCommittees: null,
      specialCommittees: null,
      secretariatOfficials: null,
      houseMembers: [
        {
          position: 0,
          name: 'DELA CRUZ, JUAN M.',
          provinceCity: 'Isabela',
          district: '1st District',
          contact: null,
        },
      ],
      partyListRepresentatives: [
        {
          position: 0,
          name: 'SANTOS, MARIA C.',
          partyList: 'EXAMPLE',
          contact: null,
        },
      ],
    },
  ],
};

/** Same slug as the departments payload — used only by the gate tests. */
const collidingLegislativePayload = {
  ...legislativePayload,
  allLegislativeChambers: [
    { ...legislativePayload.allLegislativeChambers[0], slug: 'shared-slug' },
    legislativePayload.allLegislativeChambers[1],
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
    if (query.includes('SyncGovernmentDepartments')) return departmentsPayload;
    if (query.includes('SyncExecutiveOffices')) return executivePayload;
    if (query.includes('SyncConstitutionalOffices'))
      return constitutionalPayload;
    if (query.includes('SyncLegislativeChambers')) return legislativePayload;
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
      removeStaleServiceFiles: vi.fn(() => ({ removed: [], failed: [] })),
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
  it('writes all seven datasets and exits 0', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(deps.commitFiles).toHaveBeenCalledTimes(1);
    const written = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(written.map((f: { path: string }) => f.path)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/health.json',
      'src/data/directory/departments.json',
      'src/data/directory/executive.json',
      'src/data/directory/constitutional.json',
      'src/data/directory/legislative.json',
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
  it('writes all seven datasets, services last among the original three, then directory', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual([
      'src/data/service_categories.json',
      'src/data/critical_hotlines.json',
      'src/data/services/health.json',
      'src/data/directory/departments.json',
      'src/data/directory/executive.json',
      'src/data/directory/constitutional.json',
      'src/data/directory/legislative.json',
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
      if (query.includes('SyncGovernmentDepartments'))
        return departmentsPayload;
      if (query.includes('SyncExecutiveOffices')) return executivePayload;
      if (query.includes('SyncConstitutionalOffices'))
        return constitutionalPayload;
      if (query.includes('SyncLegislativeChambers')) return legislativePayload;
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
      'src/data/directory/departments.json',
      'src/data/directory/executive.json',
      'src/data/directory/constitutional.json',
      'src/data/directory/legislative.json',
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
    // The one-directional allowance (assertReferentialIntegrity): a taxonomy
    // category with no matching generated records is legitimate, and an
    // isolated categories sync never touches readServiceFileNames at all —
    // there is no file-set gate to wire it into.
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

  it('--only=services never reads or removes stale service files — only a full sync does', async () => {
    // Stale-file cleanup needs the complete generated picture to safely judge
    // staleness; an isolated services sync doesn't have it, so it must not
    // even capture a "before" snapshot, let alone delete anything.
    const { client, deps } = makeDeps();
    await expect(run(['--only=services'], deps as never)).resolves.toBe(0);
    expect(queriesOf(client)).toHaveLength(1);
    expect(deps.readServiceFileNames).not.toHaveBeenCalled();
    expect(deps.removeStaleServiceFiles).not.toHaveBeenCalled();
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

  it('fails a full sync when the freshly fetched categories and services disagree with EACH OTHER', async () => {
    // Distinct from the isolated-mode tests above (which disagree with a
    // committed/generated counterpart): here both sides are fresh CMS
    // fetches, proving crossValidate is actually wired into a full run()
    // and not bypassed just because nothing "committed" is involved.
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) return categoriesPayload; // category "health"
      if (query.includes('SyncGovernmentServices')) {
        return {
          _allGovernmentServicesMeta: { count: 1 },
          allGovernmentServices: [
            {
              sourceId: 'svc-1',
              position: 0,
              service: 'Apply for Something',
              slug: 'apply-for-something',
              url: 'https://example.gov.ph/',
              published: true,
              featured: false,
              createdAt: '2025-06-06T11:30:06.318Z',
              updatedAt: '2025-06-06T11:30:06.318Z',
              category: { slug: 'health', category: 'Health!' }, // disagrees with categoriesPayload's "Health"
              subcategory: {
                slug: 'financial-assistance',
                name: 'Financial Assistance',
                category: { slug: 'health' },
              },
            },
          ],
        };
      }
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });

    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('propagates a real missing-counterpart failure through run() for --only=categories', async () => {
    // Exercises the orchestrator against the actual failure shape
    // readServiceRecords() now throws (see write.ts), not just a
    // test-local stand-in mock — proves run() doesn't swallow or
    // transform it before returning.
    const { deps } = makeDeps({
      readServiceRecords: vi.fn(() => {
        throw new Error(
          '[sync:services] no generated service files found under src/data/services — run a full sync first'
        );
      }),
    });
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('propagates a real missing-counterpart failure through run() for --only=services', async () => {
    const { deps } = makeDeps({
      readTaxonomy: vi.fn(() => {
        throw new Error(
          '[sync:services] committed src/data/service_categories.json is not valid JSON'
        );
      }),
    });
    await expect(run(['--only=services'], deps as never)).resolves.toBe(1);
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

describe('stale service file cleanup', () => {
  it('runs only after a successful full-sync write, with the before/after sets it captured', async () => {
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
    });
    await expect(run([], deps as never)).resolves.toBe(0);

    expect(deps.commitFiles).toHaveBeenCalledTimes(1);
    expect(deps.removeStaleServiceFiles).toHaveBeenCalledTimes(1);
    const [before, generated] = (
      deps.removeStaleServiceFiles as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(before).toEqual(['health.json', 'old-category.json']);
    expect(generated).toEqual(['health.json']);

    // Captured before commitFiles ran, not after — and cleanup itself runs
    // strictly after commitFiles, not concurrently with or before it.
    const beforeCallOrder = (
      deps.readServiceFileNames as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    const commitCallOrder = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .invocationCallOrder[0];
    const cleanupCallOrder = (
      deps.removeStaleServiceFiles as ReturnType<typeof vi.fn>
    ).mock.invocationCallOrder[0];
    expect(beforeCallOrder).toBeLessThan(commitCallOrder);
    expect(cleanupCallOrder).toBeGreaterThan(commitCallOrder);
  });

  it('runs even when nothing changed, so a category retired since the last sync is still cleaned up', async () => {
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
      prepare: vi.fn(async (c: { path: string }) => ({
        path: c.path,
        text: 'text',
        changed: false,
      })),
    });
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    expect(deps.removeStaleServiceFiles).toHaveBeenCalledWith(
      ['health.json', 'old-category.json'],
      ['health.json']
    );
  });

  it('never runs under --dry-run — nothing may be deleted when nothing is written', async () => {
    const { deps } = makeDeps();
    await expect(run(['--dry-run'], deps as never)).resolves.toBe(3);
    expect(deps.removeStaleServiceFiles).not.toHaveBeenCalled();
  });

  it('never runs when the write phase fails — no apparently-successful mixed snapshot', async () => {
    const { deps } = makeDeps({
      commitFiles: vi.fn(async () => {
        throw new Error('disk full');
      }),
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.removeStaleServiceFiles).not.toHaveBeenCalled();
  });

  it('never runs when configuration fails before any fetch', async () => {
    const { deps } = makeDeps({
      createClient: () => {
        throw new Error('TalaCMS is not configured');
      },
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.removeStaleServiceFiles).not.toHaveBeenCalled();
  });

  it('never runs for an isolated --only=categories sync', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(0);
    expect(deps.readServiceFileNames).not.toHaveBeenCalled();
    expect(deps.removeStaleServiceFiles).not.toHaveBeenCalled();
  });

  it('logs removals distinctly from a normal "wrote N files" run', async () => {
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
      removeStaleServiceFiles: vi.fn(() => ({
        removed: ['old-category.json'],
        failed: [],
      })),
    });
    await expect(run([], deps as never)).resolves.toBe(0);
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toContain('1 stale service file(s) removed');
  });

  it('fails the sync — not a quiet success — when a stale removal fails, but still logs it in detail', async () => {
    // cms.ts globs every top-level file in src/data/services/, so a stale
    // file the cleanup failed to delete would still be bundled into the
    // build — this must not be reported as a successful sync.
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
      removeStaleServiceFiles: vi.fn(() => ({
        removed: [],
        failed: ['old-category.json'],
      })),
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    // Per-file detail (which file, why) is removeStaleServiceFiles' own
    // responsibility and is covered directly in write.test.ts; run() only
    // needs to surface the failure count and turn it into a non-zero exit.
    expect(logged).toContain('1 failed to remove');
    expect(logged).toContain('sync failed');
  });

  it('fails the sync on a cleanup failure even when nothing else changed', async () => {
    // The "already up to date; nothing written" branch is a separate code
    // path from the "wrote N files" branch — both must propagate a cleanup
    // failure, not just the one with an actual write.
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
      prepare: vi.fn(async (c: { path: string }) => ({
        path: c.path,
        text: 'text',
        changed: false,
      })),
      removeStaleServiceFiles: vi.fn(() => ({
        removed: [],
        failed: ['old-category.json'],
      })),
    });
    await expect(run([], deps as never)).resolves.toBe(1);
  });

  it('still succeeds when every stale removal succeeds', async () => {
    const { deps } = makeDeps({
      readServiceFileNames: vi.fn(() => ['health.json', 'old-category.json']),
      removeStaleServiceFiles: vi.fn(() => ({
        removed: ['old-category.json'],
        failed: [],
      })),
    });
    await expect(run([], deps as never)).resolves.toBe(0);
  });
});

describe('directory datasets', () => {
  it('exposes all four directory models as selectable datasets', () => {
    expect(DATASETS).toEqual([
      'categories',
      'hotlines',
      'services',
      'departments',
      'executive',
      'constitutional',
      'legislative',
    ]);
  });

  it('--only=departments prepares only the departments file', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=departments'], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual(['src/data/directory/departments.json']);
  });

  it('--only=executive prepares only the executive file', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=executive'], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual(['src/data/directory/executive.json']);
  });
});

/**
 * These are the tests that actually prove the isolation contract: the
 * UNSELECTED model's data is absent or malformed, and the selected one must
 * still succeed. A client that returns the wrong shape for an unrequested
 * query would fail these.
 */
describe('directory dataset isolation', () => {
  /** A client that answers only the query naming `allowed`, and throws otherwise. */
  const clientAnswering = (allowed: string, payload: unknown) =>
    vi.fn(async (query: string) => {
      if (!query.includes(allowed)) {
        throw new Error(
          `unexpected query for an unselected dataset: ${query.slice(0, 60)}`
        );
      }
      return payload;
    }) as unknown as TalaCmsClient;

  it('--only=departments never issues the executive query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=departments'], deps as never);
    const queries = queriesOf(client);
    expect(queries.some(q => q.includes('SyncExecutiveOffices'))).toBe(false);
    expect(queries.some(q => q.includes('SyncGovernmentDepartments'))).toBe(
      true
    );
  });

  it('--only=executive never issues the departments query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=executive'], deps as never);
    const queries = queriesOf(client);
    expect(queries.some(q => q.includes('SyncGovernmentDepartments'))).toBe(
      false
    );
    expect(queries.some(q => q.includes('SyncExecutiveOffices'))).toBe(true);
  });

  it('--only=departments succeeds even when executive data would be invalid', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncGovernmentDepartments', departmentsPayload),
    });
    await expect(run(['--only=departments'], deps as never)).resolves.toBe(0);
  });

  it('--only=executive succeeds even when departments data would be invalid', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncExecutiveOffices', executivePayload),
    });
    await expect(run(['--only=executive'], deps as never)).resolves.toBe(0);
  });

  it('does not apply the cross-model slug gate in an isolated run', async () => {
    // Both models deliberately carry the same slug. A full sync would fail;
    // an isolated run has no second side to compare against and must not
    // substitute a weaker check or read the other model's committed file.
    // The collision is instead caught by assertUniqueDirectorySlugs at
    // Meilisearch preflight — see Task 8. This test asserts the isolated run
    // still generates its own file successfully.
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering(
          'SyncGovernmentDepartments',
          collidingDepartmentsPayload
        ),
    });
    await expect(run(['--only=departments'], deps as never)).resolves.toBe(0);
  });

  it('applies the cross-model slug gate on a full sync', async () => {
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) return categoriesPayload;
      if (query.includes('SyncGovernmentServices')) return servicesPayload;
      if (query.includes('SyncGovernmentDepartments'))
        return collidingDepartmentsPayload;
      if (query.includes('SyncExecutiveOffices'))
        return collidingExecutivePayload;
      if (query.includes('SyncConstitutionalOffices'))
        return constitutionalPayload;
      if (query.includes('SyncLegislativeChambers')) return legislativePayload;
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });

    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/appear in BOTH/i);
  });
});

describe('constitutional dataset', () => {
  const clientAnswering = (allowed: string, payload: unknown) =>
    vi.fn(async (query: string) => {
      if (!query.includes(allowed)) {
        throw new Error(
          `unexpected query for an unselected dataset: ${query.slice(0, 60)}`
        );
      }
      return payload;
    }) as unknown as TalaCmsClient;

  it('--only=constitutional prepares only the constitutional file', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=constitutional'], deps as never)).resolves.toBe(
      0
    );
    expect(pathsOf(deps)).toEqual(['src/data/directory/constitutional.json']);
  });

  it('--only=constitutional issues no departments or executive query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=constitutional'], deps as never);
    const queries = queriesOf(client);
    expect(queries.some(q => q.includes('SyncGovernmentDepartments'))).toBe(
      false
    );
    expect(queries.some(q => q.includes('SyncExecutiveOffices'))).toBe(false);
    expect(queries.some(q => q.includes('SyncConstitutionalOffices'))).toBe(
      true
    );
  });

  it('--only=departments never issues the constitutional query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=departments'], deps as never);
    expect(
      queriesOf(client).some(q => q.includes('SyncConstitutionalOffices'))
    ).toBe(false);
  });

  it('--only=executive never issues the constitutional query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=executive'], deps as never);
    expect(
      queriesOf(client).some(q => q.includes('SyncConstitutionalOffices'))
    ).toBe(false);
  });

  it('--only=constitutional succeeds even when departments data would be invalid', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncConstitutionalOffices', constitutionalPayload),
    });
    await expect(run(['--only=constitutional'], deps as never)).resolves.toBe(
      0
    );
  });

  it('applies the cross-model gate to constitutional on a full sync', async () => {
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) return categoriesPayload;
      if (query.includes('SyncGovernmentServices')) return servicesPayload;
      if (query.includes('SyncGovernmentDepartments'))
        return collidingDepartmentsPayload;
      if (query.includes('SyncExecutiveOffices')) return executivePayload;
      if (query.includes('SyncConstitutionalOffices'))
        return collidingConstitutionalPayload;
      if (query.includes('SyncLegislativeChambers')) return legislativePayload;
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });

    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/appear in BOTH/i);
    expect(logged).toMatch(/constitutional\.json/);
  });

  it('does not apply the cross-model gate in an isolated constitutional run', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering(
          'SyncConstitutionalOffices',
          collidingConstitutionalPayload
        ),
    });
    await expect(run(['--only=constitutional'], deps as never)).resolves.toBe(
      0
    );
  });

  it('--dry-run reports drift and exits 3 without writing for --only=constitutional', async () => {
    const { deps } = makeDeps();
    await expect(
      run(['--dry-run', '--only=constitutional'], deps as never)
    ).resolves.toBe(3);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('never runs service stale-file cleanup over the constitutional file', async () => {
    const { deps } = makeDeps();
    await run([], deps as never);
    const calls = (deps.removeStaleServiceFiles as ReturnType<typeof vi.fn>)
      .mock.calls;
    for (const [, generated] of calls) {
      expect(
        (generated as string[]).every(f => !f.includes('constitutional'))
      ).toBe(true);
    }
  });

  it('names constitutional in the unknown-dataset message', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=everything'], deps as never)).resolves.toBe(1);
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toContain('constitutional');
  });
});

describe('legislative dataset', () => {
  const clientAnswering = (allowed: string, payload: unknown) =>
    vi.fn(async (query: string) => {
      if (!query.includes(allowed)) {
        throw new Error(
          `unexpected query for an unselected dataset: ${query.slice(0, 60)}`
        );
      }
      return payload;
    }) as unknown as TalaCmsClient;

  it('--only=legislative prepares only the legislative file', async () => {
    const { deps } = makeDeps();
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
    expect(pathsOf(deps)).toEqual(['src/data/directory/legislative.json']);
  });

  it('--only=legislative issues no other model query', async () => {
    const { client, deps } = makeDeps();
    await run(['--only=legislative'], deps as never);
    const queries = queriesOf(client);
    expect(queries.some(q => q.includes('SyncLegislativeChambers'))).toBe(true);
    for (const other of [
      'SyncGovernmentDepartments',
      'SyncExecutiveOffices',
      'SyncConstitutionalOffices',
      'SyncServiceCategories',
      'SyncGovernmentServices',
    ]) {
      expect(queries.some(q => q.includes(other))).toBe(false);
    }
  });

  it('no other --only= run issues the legislative query', async () => {
    for (const only of [
      '--only=departments',
      '--only=executive',
      '--only=constitutional',
    ]) {
      const { client, deps } = makeDeps();
      await run([only], deps as never);
      expect(
        queriesOf(client).some(q => q.includes('SyncLegislativeChambers'))
      ).toBe(false);
    }
  });

  it('--only=legislative succeeds even when every other model would be invalid', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncLegislativeChambers', legislativePayload),
    });
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
  });

  it('fails the whole run and writes nothing when legislative data is invalid', async () => {
    const broken = {
      ...legislativePayload,
      _allHouseMembersMeta: { count: 99 },
    };
    const { deps } = makeDeps({
      createClient: () =>
        vi.fn(async (query: string) => {
          if (query.includes('SyncServiceCategories')) return categoriesPayload;
          if (query.includes('SyncGovernmentServices')) return servicesPayload;
          if (query.includes('SyncGovernmentDepartments'))
            return departmentsPayload;
          if (query.includes('SyncExecutiveOffices')) return executivePayload;
          if (query.includes('SyncConstitutionalOffices'))
            return constitutionalPayload;
          if (query.includes('SyncLegislativeChambers')) return broken;
          return hotlinesPayload;
        }) as unknown as TalaCmsClient,
    });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/incomplete house members/i);
    expect(logged).toContain('No files were written.');
  });

  it('applies the cross-model slug gate to legislative on a full sync', async () => {
    const client = vi.fn(async (query: string) => {
      if (query.includes('SyncServiceCategories')) return categoriesPayload;
      if (query.includes('SyncGovernmentServices')) return servicesPayload;
      if (query.includes('SyncGovernmentDepartments'))
        return collidingDepartmentsPayload;
      if (query.includes('SyncExecutiveOffices')) return executivePayload;
      if (query.includes('SyncConstitutionalOffices'))
        return constitutionalPayload;
      if (query.includes('SyncLegislativeChambers'))
        return collidingLegislativePayload;
      return hotlinesPayload;
    }) as unknown as TalaCmsClient;
    const { deps } = makeDeps({ createClient: () => client });
    await expect(run([], deps as never)).resolves.toBe(1);
    expect(deps.commitFiles).not.toHaveBeenCalled();
    const logged = (deps.log as ReturnType<typeof vi.fn>).mock.calls
      .map(c => c[0])
      .join('\n');
    expect(logged).toMatch(/appear in BOTH/i);
  });

  it('does not apply the cross-model gate in an isolated legislative run', async () => {
    const { deps } = makeDeps({
      createClient: () =>
        clientAnswering('SyncLegislativeChambers', collidingLegislativePayload),
    });
    await expect(run(['--only=legislative'], deps as never)).resolves.toBe(0);
  });
});

describe('directory dry-run, ordering and cleanup', () => {
  it('--dry-run reports drift and exits 3 without writing for an isolated directory dataset', async () => {
    const { deps } = makeDeps();
    await expect(
      run(['--dry-run', '--only=departments'], deps as never)
    ).resolves.toBe(3);
    expect(deps.commitFiles).not.toHaveBeenCalled();
  });

  it('orders candidates categories, hotlines, services…, departments, executive, constitutional', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    const written = pathsOf(deps);
    const d = written.indexOf('src/data/directory/departments.json');
    const e = written.indexOf('src/data/directory/executive.json');
    const c = written.indexOf('src/data/directory/constitutional.json');
    const lastService = written
      .map((p: string, i: number) =>
        p.startsWith('src/data/services/') ? i : -1
      )
      .reduce((a: number, b: number) => Math.max(a, b), -1);
    expect(lastService).toBeLessThan(d);
    expect(d).toBeLessThan(e);
    expect(e).toBeLessThan(c);
  });

  it('never runs service stale-file cleanup over the directory folder', async () => {
    const { deps } = makeDeps();
    await run([], deps as never);
    const calls = (deps.removeStaleServiceFiles as ReturnType<typeof vi.fn>)
      .mock.calls;
    for (const [, generated] of calls) {
      expect((generated as string[]).every(f => !f.includes('directory'))).toBe(
        true
      );
    }
  });
});
