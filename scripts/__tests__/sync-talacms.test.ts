import { describe, it, expect, vi } from 'vitest';
import { run } from '../sync-talacms';
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

const HOTLINE_KEYS = [
  'emergencyHotlines',
  'disasterHotlines',
  'securityHotlines',
  'transportHotlines',
  'weatherHotlines',
  'utilityHotlines',
  'socialServicesHotlines',
  'criticalHotlines',
];

const existingHotlinesFile = Object.fromEntries(HOTLINE_KEYS.map(k => [k, []]));

const makeDeps = (over: Record<string, unknown> = {}) => {
  const client = vi.fn(async (query: string) =>
    query.includes('SyncServiceCategories')
      ? categoriesPayload
      : hotlinesPayload
  ) as unknown as TalaCmsClient;

  return {
    client,
    deps: {
      createClient: () => client,
      readJson: vi.fn(() => existingHotlinesFile),
      readServiceRecords: vi.fn(() => [
        {
          category: { slug: 'health' },
          subcategory: { slug: 'financial-assistance' },
        },
      ]),
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
  it('writes both datasets and exits 0', async () => {
    const { deps } = makeDeps();
    await expect(run([], deps as never)).resolves.toBe(0);
    expect(deps.commitFiles).toHaveBeenCalledTimes(1);
    const written = (deps.commitFiles as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(written.map((f: { path: string }) => f.path)).toEqual([
      'src/data/service_categories.json',
      'src/data/philippines_hotlines.json',
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
      'src/data/philippines_hotlines.json',
    ]);
  });

  it('--only=categories never reads the hotlines file', async () => {
    const { client, deps } = makeDeps();
    await expect(run(['--only=categories'], deps as never)).resolves.toBe(0);
    expect(deps.readJson).not.toHaveBeenCalled();
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
    expect(deps.readJson).not.toHaveBeenCalled();
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
