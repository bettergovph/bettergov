import { describe, it, expect, afterEach, vi } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Minimal type surface for `index_meilisearch.cjs`'s exports, declared here
 * at the CommonJS `require` boundary rather than left as `any`. Type-only —
 * these interfaces describe the shapes this test file already relies on at
 * runtime (and that the .cjs script's own doc comments describe); they
 * change nothing about how the module is loaded or executed.
 *
 * Without this, `require(...)` types as `any`, and TypeScript's
 * `noImplicitAny` still flags an unannotated callback parameter passed to a
 * method call on an `any`-typed value (e.g. `DATA_SOURCES.filter(s => ...)`,
 * or `Object.values(DIRECTORY_EXPECTED_COUNTS).reduce(...)`, whose overload
 * resolution against an `any` argument produces `unknown` elements) —  a
 * well-known TS quirk where `any` does not propagate through every generic
 * call signature. Typing the boundary once here fixes inference everywhere
 * downstream without touching each call site individually.
 */
interface DirectoryDataSource {
  dataType: string;
  dataPath: string;
  isFile?: boolean;
  requireNonEmpty?: boolean;
  schemaPath?: string;
  excludeFiles?: string[];
  expectedFiles?: string[];
}

interface IndexedDocument {
  slug: string;
  type?: string;
  id?: string;
  __sourceFile?: string;
  [key: string]: unknown;
}

interface DirectorySnapshot {
  documents: IndexedDocument[];
  bySourceFile: Map<string, number>;
  expectedFiles: string[];
  loadedFiles: string[];
  complete: boolean;
  problems: string[];
}

interface PreflightAggregate {
  allDocumentsToIndex: IndexedDocument[];
  requiredDocuments: IndexedDocument[];
  directorySnapshot: DirectorySnapshot;
}

interface ReconcileWaiterIo {
  waiter?: (
    taskPromise: Promise<{ taskUid: number }>,
    label: string
  ) => Promise<unknown>;
}

/** Structural — a fake or a real Meilisearch `Index` both satisfy this. */
interface ReconcilableIndex {
  getDocuments(opts: {
    filter: string;
    limit: number;
    offset: number;
  }): Promise<{ results: { slug: string }[]; total: number }>;
  deleteDocuments(slugs: string[]): Promise<{ taskUid: number }>;
}

interface IndexMeilisearchModule {
  FatalIndexingError: new (message?: string) => Error;
  loadRequiredDocuments: (
    dataSource: DirectoryDataSource
  ) => Promise<IndexedDocument[]>;
  DATA_SOURCES: DirectoryDataSource[];
  DIRECTORY_EXPECTED_FILES: string[];
  DIRECTORY_GENERATED_FILES: string[];
  DIRECTORY_TOLERANT_FILES: string[];
  DIRECTORY_EXPECTED_COUNTS: Record<string, number>;
  loadDirectorySnapshot: (opts?: {
    dir?: string;
    sources?: DirectoryDataSource[];
  }) => Promise<DirectorySnapshot>;
  assertUniqueDirectorySlugs: (snapshot: DirectorySnapshot) => void;
  assemblePreflightDocuments: (
    sources?: DirectoryDataSource[],
    opts?: { directoryDir?: string }
  ) => Promise<PreflightAggregate>;
  reconcileStaleDirectoryDocuments: (
    index: ReconcilableIndex,
    snapshot: DirectorySnapshot,
    io?: ReconcileWaiterIo
  ) => Promise<void>;
}

// This is a CommonJS script (see scripts/index_meilisearch.cjs); requiring
// it does not run main() — see the require.main === module guard at the
// bottom of that file — so this never contacts Meilisearch.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- .cjs script has no ESM build to import
const indexMeilisearchRaw = require('../index_meilisearch.cjs');
const indexMeilisearch = indexMeilisearchRaw as IndexMeilisearchModule;
const {
  FatalIndexingError,
  loadRequiredDocuments,
  DATA_SOURCES,
  DIRECTORY_EXPECTED_FILES,
  DIRECTORY_GENERATED_FILES,
  DIRECTORY_TOLERANT_FILES,
  DIRECTORY_EXPECTED_COUNTS,
  loadDirectorySnapshot,
  assertUniqueDirectorySlugs,
  assemblePreflightDocuments,
  reconcileStaleDirectoryDocuments,
} = indexMeilisearch;

const REPO_ROOT = process.cwd();
const REAL_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'src/data/services/schema/services.schema.json'
);

const tempDirs: string[] = [];
const makeServicesDir = (files: Record<string, unknown>): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meili-services-'));
  tempDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(dir, `${name}.json`),
      typeof content === 'string' ? content : JSON.stringify(content),
      'utf8'
    );
  }
  return dir;
};

afterEach(() => {
  while (tempDirs.length)
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

const VALID_RECORD = {
  service: 'Apply for a Sample Service',
  url: 'https://example.gov.ph/apply-for-a-sample-service',
  id: '00000000-0000-0000-0000-000000000000',
  slug: 'apply-for-a-sample-service',
  published: true,
  featured: false,
  category: { name: 'Sample Category', slug: 'sample-category' },
  subcategory: { name: 'Sample Subcategory', slug: 'sample-subcategory' },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('index_meilisearch.cjs preflight — full schema validation', () => {
  it('rejects a syntactically valid but schema-invalid record before any Meilisearch contact', async () => {
    // Exactly the case the review flagged: valid `service` and `slug`,
    // missing every other field the tracked contract requires.
    const dir = makeServicesDir({
      health: [
        { service: 'Malformed but accepted', slug: 'malformed-accepted' },
      ],
    });

    await expect(
      loadRequiredDocuments({
        dataType: 'service',
        dataPath: dir,
        requireNonEmpty: true,
        schemaPath: REAL_SCHEMA_PATH,
      })
    ).rejects.toBeInstanceOf(FatalIndexingError);

    await expect(
      loadRequiredDocuments({
        dataType: 'service',
        dataPath: dir,
        requireNonEmpty: true,
        schemaPath: REAL_SCHEMA_PATH,
      })
    ).rejects.toThrow(/does not satisfy .*services\.schema\.json/);
  });

  it('names the missing required fields in the error, not just "invalid"', async () => {
    const dir = makeServicesDir({
      health: [
        { service: 'Malformed but accepted', slug: 'malformed-accepted' },
      ],
    });

    await expect(
      loadRequiredDocuments({
        dataType: 'service',
        dataPath: dir,
        requireNonEmpty: true,
        schemaPath: REAL_SCHEMA_PATH,
      })
    ).rejects.toThrow(/required property 'url'/);
  });

  it('accepts a fully-shaped record — the schema check is not overly strict', async () => {
    const dir = makeServicesDir({ health: [VALID_RECORD] });

    const documents = await loadRequiredDocuments({
      dataType: 'service',
      dataPath: dir,
      requireNonEmpty: true,
      schemaPath: REAL_SCHEMA_PATH,
    });

    expect(documents).toHaveLength(1);
    expect(documents[0].slug).toBe('apply-for-a-sample-service');
  });

  it('rejects an additional, undeclared property — the schema forbids it', async () => {
    const dir = makeServicesDir({
      health: [{ ...VALID_RECORD, notInTheSchema: true }],
    });

    await expect(
      loadRequiredDocuments({
        dataType: 'service',
        dataPath: dir,
        requireNonEmpty: true,
        schemaPath: REAL_SCHEMA_PATH,
      })
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('one schema-invalid record fails the whole file, even alongside otherwise-valid records', async () => {
    const dir = makeServicesDir({
      health: [
        VALID_RECORD,
        { service: 'Malformed but accepted', slug: 'malformed-accepted' },
      ],
    });

    await expect(
      loadRequiredDocuments({
        dataType: 'service',
        dataPath: dir,
        requireNonEmpty: true,
        schemaPath: REAL_SCHEMA_PATH,
      })
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });
});

describe('index_meilisearch.cjs — preflight runs before any Meilisearch mutation', () => {
  it('main() contacts Meilisearch (client.health) only after the preflight loaders are called', () => {
    // A lightweight, execution-independent guard against the exact
    // regression this review round fixed (--reset deleting the index before
    // the Services directory was even read): asserts the source order of
    // main() rather than requiring a live or mocked Meilisearch instance,
    // which a standalone CJS admin script has no existing harness for.
    //
    // The preflight assembly is now extracted into assemblePreflightDocuments()
    // (Task 8), called once at the top of main() — so the guard checks for
    // that call rather than the individual loader calls it used to inline.
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts/index_meilisearch.cjs'),
      'utf8'
    );
    const mainBody = source.slice(source.indexOf('async function main()'));

    const preflightIndex = mainBody.indexOf('assemblePreflightDocuments()');
    const firstMeilisearchCallIndex = mainBody.indexOf('client.health()');

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(firstMeilisearchCallIndex).toBeGreaterThan(-1);
    expect(preflightIndex).toBeLessThan(firstMeilisearchCallIndex);
  });
});

const SCHEMA_DIR = path.join(process.cwd(), 'src/data/directory/schema');

/** Writes `contents` to a fresh temp dir; `null` means "create nothing". */
const tmpFile = (name: string, contents: string | null) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dir-preflight-'));
  const file = path.join(dir, name);
  if (contents !== null) fs.writeFileSync(file, contents, 'utf8');
  return file;
};

const fileSource = (dataPath: string, schema: string) => ({
  dataType: 'directory_item',
  dataPath,
  isFile: true,
  requireNonEmpty: true,
  schemaPath: path.join(SCHEMA_DIR, schema),
});

describe('loadRequiredDocuments — single-file sources (departments)', () => {
  const valid = JSON.stringify([
    { slug: 'department-of-x', office_name: 'DEPARTMENT OF X' },
  ]);

  it('loads a valid single file', async () => {
    const docs = await loadRequiredDocuments(
      fileSource(tmpFile('departments.json', valid), 'departments.schema.json')
    );
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      slug: 'department-of-x',
      type: 'directory_item',
      id: 'department-of-x',
    });
  });

  it('fails closed when the file is missing', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(tmpFile('departments.json', null), 'departments.schema.json')
      )
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('fails closed when the file is not valid JSON', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(
          tmpFile('departments.json', '{ not json'),
          'departments.schema.json'
        )
      )
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('fails closed when the file is not a JSON array', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(
          tmpFile('departments.json', '{"slug":"x"}'),
          'departments.schema.json'
        )
      )
    ).rejects.toThrow(/must contain a JSON array/i);
  });

  it('fails closed when the file is an empty array', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(tmpFile('departments.json', '[]'), 'departments.schema.json')
      )
    ).rejects.toThrow(/zero/i);
  });

  it('fails closed when a record violates the tracked schema', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(
          tmpFile('departments.json', '[{"slug":"x"}]'),
          'departments.schema.json'
        )
      )
    ).rejects.toThrow(/does not satisfy/i);
  });

  it('names the file, not a directory, in its preflight log', async () => {
    const file = tmpFile('departments.json', valid);
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation(m => {
      logs.push(String(m));
    });
    await loadRequiredDocuments(fileSource(file, 'departments.schema.json'));
    spy.mockRestore();
    expect(logs.join('\n')).toContain('departments.json');
  });
});

describe('loadRequiredDocuments — single-file sources (executive)', () => {
  // executive.schema.json requires slug + office, NOT office_name.
  const valid = JSON.stringify([
    { slug: 'office-of-x', office: 'OFFICE OF X' },
  ]);

  it('loads a valid single file', async () => {
    const docs = await loadRequiredDocuments(
      fileSource(tmpFile('executive.json', valid), 'executive.schema.json')
    );
    expect(docs[0]).toMatchObject({
      slug: 'office-of-x',
      type: 'directory_item',
    });
  });

  it('fails closed when the file is missing', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(tmpFile('executive.json', null), 'executive.schema.json')
      )
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('fails closed when a record violates the tracked schema', async () => {
    await expect(
      loadRequiredDocuments(
        fileSource(
          tmpFile('executive.json', '[{"slug":"x"}]'),
          'executive.schema.json'
        )
      )
    ).rejects.toThrow(/does not satisfy/i);
  });
});

describe('loadRequiredDocuments — directory sources still work', () => {
  it('keeps loading a multi-file directory source when isFile is absent', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dir-multi-'));
    fs.writeFileSync(
      path.join(dir, 'a.json'),
      '[{"slug":"a","office_name":"A"}]'
    );
    fs.writeFileSync(
      path.join(dir, 'b.json'),
      '[{"slug":"b","office_name":"B"}]'
    );
    const docs = await loadRequiredDocuments({
      dataType: 'directory_item',
      dataPath: dir,
      requireNonEmpty: true,
      schemaPath: path.join(SCHEMA_DIR, 'departments.schema.json'),
    });
    expect(docs.map(d => d.slug)).toEqual(['a', 'b']);
  });
});

const DIR = path.join(REPO_ROOT, 'src/data/directory');

/**
 * A complete synthetic directory: all eight files, with small known record
 * counts. Never copies the real directory — departments.json and
 * executive.json are generated and gitignored, so a copy-based fixture would
 * be unavailable on exactly the clean checkouts these tests must cover.
 */
const SYNTHETIC_DIRECTORY_COUNTS = {
  'constitutional.json': 3,
  'departments.json': 2,
  'diplomatic.json': 1, // object, not array — wrapped as one document
  'executive.json': 2,
  'house_members.json': 4,
  'judicial.json': 1,
  'legislative.json': 1,
  'party_list_representatives.json': 2,
}; // total: 16

const syntheticDirectoryDir = (mutate: (dir: string) => void = () => {}) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meili-directory-'));
  tempDirs.push(dir);
  const rows = (n: number, prefix: string, extra: (i: number) => object) =>
    Array.from({ length: n }, (_, i) => ({
      slug: `${prefix}-${i}`,
      ...extra(i),
    }));

  const write = (name: string, value: unknown) =>
    fs.writeFileSync(path.join(dir, name), JSON.stringify(value), 'utf8');

  write(
    'constitutional.json',
    rows(3, 'const', i => ({ name: `Constitutional ${i}` }))
  );
  write(
    'departments.json',
    rows(2, 'dept', i => ({ office_name: `DEPARTMENT ${i}` }))
  );
  // Object, not array — mirrors the real file's shape.
  write('diplomatic.json', { 'Diplomatic Mission': [], Consulate: [] });
  write(
    'executive.json',
    rows(2, 'exec', i => ({ office: `OFFICE ${i}` }))
  );
  write(
    'house_members.json',
    rows(4, 'hm', i => ({ name: `Member ${i}` }))
  );
  write(
    'judicial.json',
    rows(1, 'jud', i => ({ name: `Court ${i}` }))
  );
  write(
    'legislative.json',
    rows(1, 'leg', i => ({ chamber: `Chamber ${i}` }))
  );
  write(
    'party_list_representatives.json',
    rows(2, 'plr', i => ({ name: `Rep ${i}` }))
  );

  mutate(dir);
  return dir;
};

/**
 * Guard for assertions that pin the REAL 612/DIRECTORY_EXPECTED_COUNTS
 * figures. It must be declared before the first `describe.runIf(...)`, which
 * evaluates its condition while the test module is being initialized.
 * Invariant-level assertions remain unconditional on synthetic fixtures.
 */
const hasGeneratedDirectoryData = DIRECTORY_EXPECTED_FILES.every((f: string) =>
  fs.existsSync(path.join(REPO_ROOT, 'src/data/directory', f))
);

/**
 * `syntheticDirectoryDir(mutate?)` writes a complete eight-file synthetic
 * directory to a temp dir and applies `mutate`. It never copies the real
 * directory: departments.json and executive.json are generated and
 * gitignored, so a copy-based fixture would be unavailable on exactly the
 * clean checkouts these tests must cover. Schemas are never copied either —
 * `schemaPath` is never rebased, so fixture files are still validated against
 * the tracked contract.
 *
 * The three mutators below are the ones the completeness tests use.
 */
const fixtureDirWithout = (file: string) =>
  syntheticDirectoryDir(dir => fs.rmSync(path.join(dir, file)));

const fixtureDirWithMalformed = (file: string) =>
  syntheticDirectoryDir(dir =>
    fs.writeFileSync(path.join(dir, file), '{ not json', 'utf8')
  );

const fixtureDirWithUnreadable = (file: string) =>
  syntheticDirectoryDir(dir => fs.chmodSync(path.join(dir, file), 0o000));

describe('DATA_SOURCES registration', () => {
  const byPath = (suffix: string) =>
    DATA_SOURCES.filter(s => s.dataPath.endsWith(suffix));

  it('registers departments.json as a required single-file source', () => {
    const [s] = byPath(path.join('directory', 'departments.json'));
    expect(s).toMatchObject({
      dataType: 'directory_item',
      isFile: true,
      requireNonEmpty: true,
    });
    expect(s.schemaPath).toContain('departments.schema.json');
  });

  it('registers executive.json as a required single-file source', () => {
    const [s] = byPath(path.join('directory', 'executive.json'));
    expect(s).toMatchObject({
      dataType: 'directory_item',
      isFile: true,
      requireNonEmpty: true,
    });
    expect(s.schemaPath).toContain('executive.schema.json');
  });

  it('registers exactly two required directory sources and one tolerant source', () => {
    const dirSources = DATA_SOURCES.filter(
      s => s.dataType === 'directory_item'
    );
    expect(dirSources.filter(s => s.isFile)).toHaveLength(2);
    expect(dirSources.filter(s => !s.isFile)).toHaveLength(1);
  });

  // The exclusion/expectation pairing is asserted once, against the derived
  // constants, in the DIRECTORY_EXPECTED_FILES manifest describe below —
  // deliberately not duplicated here with a literal that could drift.
});

/**
 * Expected-file DISCOVERY is a declared manifest, not "whatever files happened
 * to be on disk". A deleted file must make the snapshot incomplete, and a
 * readdir-based expectation cannot see a file that is gone.
 *
 * The manifest covers the COMPLETE eight-file snapshot — generated files
 * included — and the tolerant subset is derived from it.
 */
describe('DIRECTORY_EXPECTED_FILES manifest', () => {
  it('is the complete eight-file authoritative snapshot', () => {
    expect([...DIRECTORY_EXPECTED_FILES].sort()).toEqual([
      'constitutional.json',
      'departments.json',
      'diplomatic.json',
      'executive.json',
      'house_members.json',
      'judicial.json',
      'legislative.json',
      'party_list_representatives.json',
    ]);
  });

  it.runIf(hasGeneratedDirectoryData)(
    'accounts for every .json file actually present in src/data/directory',
    () => {
      const onDisk = fs
        .readdirSync(DIR)
        .filter(f => f.endsWith('.json'))
        .sort();
      expect([...DIRECTORY_EXPECTED_FILES].sort()).toEqual(onDisk);
    }
  );

  it('accounts for every tracked directory file plus the two generated ones', () => {
    const tracked = execSync('git ls-files src/data/directory/*.json', {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .map(f => path.basename(f));
    const union = [
      ...new Set([...tracked, ...DIRECTORY_GENERATED_FILES]),
    ].sort();
    expect([...DIRECTORY_EXPECTED_FILES].sort()).toEqual(union);
  });

  it('derives the tolerant subset rather than declaring it separately', () => {
    expect([...DIRECTORY_TOLERANT_FILES].sort()).toEqual([
      'constitutional.json',
      'diplomatic.json',
      'house_members.json',
      'judicial.json',
      'legislative.json',
      'party_list_representatives.json',
    ]);
    expect(DIRECTORY_TOLERANT_FILES).not.toContain('departments.json');
    expect(DIRECTORY_TOLERANT_FILES).not.toContain('executive.json');
  });

  it('excludes from the tolerant loader exactly what the required loader owns', () => {
    const [tolerant] = DATA_SOURCES.filter(
      s => !s.isFile && s.dataPath.endsWith('directory')
    );
    expect(tolerant.excludeFiles).toEqual(DIRECTORY_GENERATED_FILES);
    expect(tolerant.expectedFiles).toEqual(DIRECTORY_TOLERANT_FILES);
    const required = DATA_SOURCES.filter(
      s => s.isFile && s.dataType === 'directory_item'
    )
      .map(s => path.basename(s.dataPath))
      .sort();
    expect(required).toEqual([...DIRECTORY_GENERATED_FILES].sort());
  });

  it('the expected-count map covers exactly the expected-file manifest', () => {
    expect(Object.keys(DIRECTORY_EXPECTED_COUNTS).sort()).toEqual(
      [...DIRECTORY_EXPECTED_FILES].sort()
    );
  });

  it('the expected counts sum to 612', () => {
    const total = Object.values(DIRECTORY_EXPECTED_COUNTS).reduce(
      (a: number, b: number) => a + b,
      0
    );
    expect(total).toBe(612);
  });
});

/**
 * Provenance is asserted DIRECTLY from the snapshot, never inferred from slug
 * counts. Every one of the 8 current files must appear exactly once in
 * `bySourceFile`, including the two orphaned ones and the non-array
 * diplomatic.json.
 *
 * Provenance is asserted as a COMPLETE MAP, not as a set of keys. A file
 * loaded twice keeps exactly one key while doubling its count, so
 * `bySourceFile.keys()` alone cannot detect double-loading — which is the
 * precise failure `excludeFiles` exists to prevent. Comparing the whole
 * filename → count map against DIRECTORY_EXPECTED_COUNTS enforces
 * exactly-once for all eight sources, generated ones included.
 */
describe.runIf(hasGeneratedDirectoryData)(
  'loadDirectorySnapshot — provenance (real data)',
  () => {
    it('loads every current directory file exactly once, with exact counts', async () => {
      const snap = await loadDirectorySnapshot();
      expect(Object.fromEntries([...snap.bySourceFile].sort())).toEqual(
        DIRECTORY_EXPECTED_COUNTS
      );
    });

    it('loads exactly 612 documents in total', async () => {
      const snap = await loadDirectorySnapshot();
      expect(snap.documents.length).toBe(612);
    });

    it('contributes no source file beyond the declared manifest', async () => {
      const snap = await loadDirectorySnapshot();
      expect([...snap.bySourceFile.keys()].sort()).toEqual(
        [...DIRECTORY_EXPECTED_FILES].sort()
      );
    });

    it('double-loading a source would be caught by the count map', async () => {
      // Guard on the guard: if excludeFiles were dropped, departments.json
      // would load through both the required and tolerant paths and report
      // 46, not 23.
      const snap = await loadDirectorySnapshot();
      expect(snap.bySourceFile.get('departments.json')).toBe(23);
      expect(snap.bySourceFile.get('executive.json')).toBe(38);
    });

    it('attributes every document to exactly one source file', async () => {
      const snap = await loadDirectorySnapshot();
      const summed = [...snap.bySourceFile.values()].reduce(
        (a: number, b: number) => a + b,
        0
      );
      expect(summed).toBe(snap.documents.length);
      expect(
        snap.documents.every(d => typeof d.__sourceFile === 'string')
      ).toBe(true);
      expect(
        // Type-only cast: the line above just proved every document's
        // __sourceFile is a string at runtime.
        snap.documents.every(d =>
          DIRECTORY_EXPECTED_FILES.includes(d.__sourceFile as string)
        )
      ).toBe(true);
    });

    it('preserves the pre-existing shapes: diplomatic.json contributes one document', async () => {
      const snap = await loadDirectorySnapshot();
      // diplomatic.json is an object keyed by entity type, not an array. The
      // tolerant loader wraps it as a single document. Pre-existing behavior —
      // asserted so this branch cannot change it by accident.
      expect(snap.bySourceFile.get('diplomatic.json')).toBe(1);
    });

    it('keeps indexing the two orphaned files the app does not read', async () => {
      const snap = await loadDirectorySnapshot();
      expect(snap.bySourceFile.get('house_members.json')).toBe(255);
      expect(snap.bySourceFile.get('party_list_representatives.json')).toBe(61);
    });

    it('reports complete for the real, intact repository', async () => {
      const snap = await loadDirectorySnapshot();
      expect(snap.complete).toBe(true);
      expect(snap.problems).toEqual([]);
      expect([...snap.loadedFiles].sort()).toEqual(
        [...DIRECTORY_EXPECTED_FILES].sort()
      );
    });

    it('every document carries type directory_item', async () => {
      const snap = await loadDirectorySnapshot();
      expect(snap.documents.every(d => d.type === 'directory_item')).toBe(true);
    });
  }
);

/**
 * REVISION — the injected-`dir` path must be proven, not assumed. Every
 * completeness test below feeds a fixture directory, so if the REQUIRED
 * sources were not rebased onto it those tests would silently be exercising
 * the real repository instead of the fixture.
 */
describe('loadDirectorySnapshot — injected fixture directory', () => {
  it('loads the required sources from the fixture dir, not the real repo', async () => {
    const dir = syntheticDirectoryDir(d => {
      fs.writeFileSync(
        path.join(d, 'departments.json'),
        JSON.stringify([
          { slug: 'fixture-department', office_name: 'FIXTURE DEPARTMENT' },
        ]),
        'utf8'
      );
    });
    const snap = await loadDirectorySnapshot({ dir });
    expect(snap.bySourceFile.get('departments.json')).toBe(1);
    expect(snap.documents.some(d => d.slug === 'fixture-department')).toBe(
      true
    );
    // Proof the rebase actually happened: no real-repo slug leaks in.
    expect(
      snap.documents.some(d => d.slug === 'department-of-budget-and-management')
    ).toBe(false);
  });

  it('reproduces the synthetic count map from an unmodified fixture', async () => {
    const snap = await loadDirectorySnapshot({ dir: syntheticDirectoryDir() });
    expect(Object.fromEntries([...snap.bySourceFile].sort())).toEqual(
      SYNTHETIC_DIRECTORY_COUNTS
    );
    expect(snap.complete).toBe(true);
  });

  it('fails closed when a REQUIRED file is missing from the fixture dir', async () => {
    const dir = syntheticDirectoryDir(d =>
      fs.rmSync(path.join(d, 'executive.json'))
    );
    // Required sources throw; they do not merely mark the snapshot incomplete.
    await expect(loadDirectorySnapshot({ dir })).rejects.toBeInstanceOf(
      FatalIndexingError
    );
  });

  it('fails closed when a REQUIRED file in the fixture dir violates its schema', async () => {
    const dir = syntheticDirectoryDir(d =>
      fs.writeFileSync(path.join(d, 'executive.json'), '[{"slug":"x"}]', 'utf8')
    );
    await expect(loadDirectorySnapshot({ dir })).rejects.toThrow(
      /does not satisfy/i
    );
  });

  it('validates fixture-dir required files against the REAL tracked schema', async () => {
    // schemaPath is never rebased — the schema is the contract and always
    // comes from the repository, never from the fixture copy.
    const [s] = DATA_SOURCES.filter(
      x => x.isFile && x.dataPath.endsWith('departments.json')
    );
    expect(s.schemaPath).toContain(
      path.join('src', 'data', 'directory', 'schema')
    );
  });
});

describe('loadDirectorySnapshot — completeness', () => {
  it('is incomplete when an expected tolerant file is missing', async () => {
    const snap = await loadDirectorySnapshot({
      dir: fixtureDirWithout('judicial.json'),
    });
    expect(snap.complete).toBe(false);
    expect(snap.problems.join(' ')).toMatch(/judicial\.json/);
  });

  it('is incomplete when an expected tolerant file is malformed JSON', async () => {
    const snap = await loadDirectorySnapshot({
      dir: fixtureDirWithMalformed('judicial.json'),
    });
    expect(snap.complete).toBe(false);
    expect(snap.problems.join(' ')).toMatch(/judicial\.json/);
    // Existing tolerant behavior is preserved: the other files still loaded.
    expect(snap.documents.length).toBeGreaterThan(0);
  });

  // NOTE — deviation from the task-8 brief's literal test code (documented in
  // the Task 8 report). A directory that is missing entirely, or exists but
  // is completely empty, is ALSO missing the two REQUIRED generated files
  // (departments.json, executive.json). Required sources fail closed by
  // throwing FatalIndexingError — the same behavior Step 1's "fails closed
  // when the file is missing" tests and the "fails closed when a REQUIRED
  // file is missing from the fixture dir" test above both pin. A snapshot
  // that merely reports `complete: false` here would be inconsistent with
  // every other required-file-missing case in this suite, so these two cases
  // are asserted as throwing too, rather than as returning an incomplete
  // snapshot.
  it('fails closed when the directory itself is missing', async () => {
    await expect(
      loadDirectorySnapshot({ dir: path.join(os.tmpdir(), 'not-here') })
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('fails closed when the directory contains zero expected files', async () => {
    await expect(
      loadDirectorySnapshot({
        dir: fs.mkdtempSync(path.join(os.tmpdir(), 'empty-')),
      })
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('is incomplete when an expected file is unreadable', async () => {
    const snap = await loadDirectorySnapshot({
      dir: fixtureDirWithUnreadable('judicial.json'),
    });
    expect(snap.complete).toBe(false);
  });
});

/**
 * REVISION — Sol finding 4. The authoritative uniqueness gate. It runs over
 * the COMPLETE loaded snapshot, so it catches a collision produced by an
 * isolated `--only=departments` sync against the committed executive.json —
 * something the sync-side gate structurally cannot see.
 */
describe('assertUniqueDirectorySlugs', () => {
  const snapOf = (docs: { slug: string; __sourceFile: string }[]) => ({
    documents: docs,
    bySourceFile: new Map(),
    expectedFiles: [],
    loadedFiles: [],
    complete: true,
    problems: [],
  });

  it.runIf(hasGeneratedDirectoryData)(
    'passes on the real repository snapshot',
    async () => {
      const snap = await loadDirectorySnapshot();
      expect(() => assertUniqueDirectorySlugs(snap)).not.toThrow();
    }
  );

  it('fails closed when a department and an executive office share a slug', () => {
    expect(() =>
      assertUniqueDirectorySlugs(
        snapOf([
          { slug: 'shared', __sourceFile: 'departments.json' },
          { slug: 'shared', __sourceFile: 'executive.json' },
        ])
      )
    ).toThrow(FatalIndexingError);
  });

  it('fails closed when a generated file collides with a local directory file', () => {
    expect(() =>
      assertUniqueDirectorySlugs(
        snapOf([
          { slug: 'shared', __sourceFile: 'departments.json' },
          { slug: 'shared', __sourceFile: 'constitutional.json' },
        ])
      )
    ).toThrow(/constitutional\.json/);
  });

  it('names every colliding slug and both source files', () => {
    expect(() =>
      assertUniqueDirectorySlugs(
        snapOf([
          { slug: 'a', __sourceFile: 'departments.json' },
          { slug: 'a', __sourceFile: 'executive.json' },
          { slug: 'b', __sourceFile: 'departments.json' },
          { slug: 'b', __sourceFile: 'judicial.json' },
        ])
      )
    ).toThrow(/a.*b/s);
  });

  /**
   * Measured: house_members.json contains one literally duplicated record
   * (DY, FAUSTINO "BOJIE" G. III — same name, district, contact), producing
   * the ONLY slug collision among 612 directory documents. It is intra-file
   * and pre-existing; failing on it would break indexing today for a data
   * defect this branch does not own. Cross-source collisions are the identity
   * risk this gate exists for.
   */
  it('tolerates a pre-existing intra-file duplicate', () => {
    expect(() =>
      assertUniqueDirectorySlugs(
        snapOf([
          { slug: 'dupe', __sourceFile: 'house_members.json' },
          { slug: 'dupe', __sourceFile: 'house_members.json' },
        ])
      )
    ).not.toThrow();
  });
});

/**
 * These tests MUST run on a clean checkout. The aggregate invariant is
 * load-bearing; a skipped test proves nothing. src/data/services/*.json and
 * the two generated directory files are gitignored, so the tests must not
 * touch real data — they build a COMPLETE synthetic source list and pass it
 * in, exactly as the existing `service` preflight tests already do with
 * makeServicesDir() + an explicit dataPath. There is no skip condition here.
 *
 * Zero-contact is not asserted with a spy: `client` is a module-level `const`
 * and is not exported, so `vi.spyOn(client, …)` would not compile. Requiring
 * the module never runs main() (guarded by require.main === module).
 * Ordering is asserted directly instead, which is the invariant that
 * actually matters.
 */
const DIRECTORY_SCHEMA_DIR = path.join(REPO_ROOT, 'src/data/directory/schema');

/** A single-file source fixture, e.g. websites.json. */
const makeJsonFile = (name: string, value: unknown) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meili-file-'));
  tempDirs.push(dir);
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(value), 'utf8');
  return file;
};

/**
 * The complete DATA_SOURCES shape, pointed entirely at fixtures. Mirrors
 * production ordering: service, the two required directory files, the
 * tolerant directory source, then website.
 */
const fixtureSources = (dirs: {
  services: string;
  directory: string;
  websites: string;
}) => [
  {
    dataType: 'service',
    dataPath: dirs.services,
    requireNonEmpty: true,
    schemaPath: REAL_SCHEMA_PATH,
  },
  {
    dataType: 'directory_item',
    dataPath: path.join(dirs.directory, 'departments.json'),
    isFile: true,
    requireNonEmpty: true,
    schemaPath: path.join(DIRECTORY_SCHEMA_DIR, 'departments.schema.json'),
  },
  {
    dataType: 'directory_item',
    dataPath: path.join(dirs.directory, 'executive.json'),
    isFile: true,
    requireNonEmpty: true,
    schemaPath: path.join(DIRECTORY_SCHEMA_DIR, 'executive.schema.json'),
  },
  {
    dataType: 'directory_item',
    dataPath: dirs.directory,
    excludeFiles: DIRECTORY_GENERATED_FILES,
    expectedFiles: DIRECTORY_TOLERANT_FILES,
  },
  { dataType: 'website', dataPath: dirs.websites, isFile: true },
];

const buildFixtureAggregate = async (
  mutateDirectory?: (dir: string) => void
) => {
  const directory = syntheticDirectoryDir(mutateDirectory);
  const sources = fixtureSources({
    services: makeServicesDir({ 'sample-category': [VALID_RECORD] }),
    directory,
    websites: makeJsonFile('websites.json', [
      { name: 'Sample Site', slug: 'sample-site', type: 'departments' },
    ]),
  });
  return {
    directory,
    sources,
    result: await assemblePreflightDocuments(sources, {
      directoryDir: directory,
    }),
  };
};

describe('preflight aggregate — directory documents enter through exactly one path', () => {
  it('contains exactly the synthetic directory document count', async () => {
    const { result } = await buildFixtureAggregate();
    const dir = result.allDocumentsToIndex.filter(
      d => d.type === 'directory_item'
    );
    const expectedTotal = Object.values(SYNTHETIC_DIRECTORY_COUNTS).reduce(
      (a: number, b: number) => a + b,
      0
    );
    expect(dir).toHaveLength(expectedTotal); // 16
  });

  it('does not duplicate directory documents via the generic loops', async () => {
    const { result } = await buildFixtureAggregate();
    const dir = result.allDocumentsToIndex.filter(
      d => d.type === 'directory_item'
    );
    // Per-source provenance over the AGGREGATE, not over the snapshot. A
    // double-load through the generic loops doubles every count here — this
    // is the assertion that fails if `&& !isDirectorySource(s)` is dropped.
    const counts: Record<string, number> = {};
    // Type-only cast: every document in `dir` came from
    // assemblePreflightDocuments(), which tags every document it loads with
    // __sourceFile — proven by the sibling provenance tests above.
    for (const d of dir) {
      const sourceFile = d.__sourceFile as string;
      counts[sourceFile] = (counts[sourceFile] ?? 0) + 1;
    }
    expect(counts).toEqual(SYNTHETIC_DIRECTORY_COUNTS);
  });

  it('does not omit directorySnapshot.documents from the aggregate', async () => {
    const { result } = await buildFixtureAggregate();
    const dirSlugs = new Set(
      result.allDocumentsToIndex
        .filter(d => d.type === 'directory_item')
        .map(d => d.slug)
    );
    expect(result.directorySnapshot.documents.length).toBeGreaterThan(0);
    for (const doc of result.directorySnapshot.documents) {
      expect(dirSlugs.has(doc.slug), `${doc.slug} missing from aggregate`).toBe(
        true
      );
    }
    // Both required files and a tolerant file are represented.
    expect(dirSlugs.has('dept-0')).toBe(true);
    expect(dirSlugs.has('exec-0')).toBe(true);
    expect(dirSlugs.has('const-0')).toBe(true);
  });

  it('still contains the non-directory sources', async () => {
    const { result } = await buildFixtureAggregate();
    expect(result.allDocumentsToIndex.some(d => d.type === 'service')).toBe(
      true
    );
    expect(result.allDocumentsToIndex.some(d => d.type === 'website')).toBe(
      true
    );
  });

  it('leaves non-directory documents untouched in count', async () => {
    const { result } = await buildFixtureAggregate();
    expect(
      result.allDocumentsToIndex.filter(d => d.type === 'service')
    ).toHaveLength(1);
    expect(
      result.allDocumentsToIndex.filter(d => d.type === 'website')
    ).toHaveLength(1);
  });

  /**
   * Precedence guard. addDocuments lets the LAST duplicate primary key win,
   * and the pre-existing directory↔website slug collisions currently resolve
   * to the website document. Directory documents must therefore precede
   * website documents in the aggregate.
   */
  it('places directory documents before website documents', async () => {
    const { result } = await buildFixtureAggregate();
    const docs = result.allDocumentsToIndex;
    const lastDirectory = docs.map(d => d.type).lastIndexOf('directory_item');
    const firstWebsite = docs.map(d => d.type).indexOf('website');
    expect(lastDirectory).toBeGreaterThan(-1);
    expect(firstWebsite).toBeGreaterThan(-1);
    expect(lastDirectory).toBeLessThan(firstWebsite);
  });

  it('places service documents before directory documents', async () => {
    const { result } = await buildFixtureAggregate();
    const docs = result.allDocumentsToIndex;
    const lastService = docs.map(d => d.type).lastIndexOf('service');
    const firstDirectory = docs.map(d => d.type).indexOf('directory_item');
    expect(lastService).toBeGreaterThan(-1);
    expect(lastService).toBeLessThan(firstDirectory);
  });

  it('propagates a required-source failure out of preflight', async () => {
    // A missing generated directory file is fatal, and it is fatal from the
    // aggregate entry point too — not only from the helper.
    await expect(
      buildFixtureAggregate(dir => fs.rmSync(path.join(dir, 'executive.json')))
    ).rejects.toBeInstanceOf(FatalIndexingError);
  });

  it('rejects a cross-source slug collision before returning an aggregate', async () => {
    await expect(
      buildFixtureAggregate(dir =>
        fs.writeFileSync(
          path.join(dir, 'judicial.json'),
          JSON.stringify([{ slug: 'dept-0', name: 'Colliding Court' }]),
          'utf8'
        )
      )
    ).rejects.toThrow(/more than one directory source/i);
  });

  it('excludes every directory source from both generic loops', () => {
    // Structural guard over the REAL DATA_SOURCES: if a future source is
    // added with dataType 'directory_item', it must go through
    // loadDirectorySnapshot.
    const dirSources = DATA_SOURCES.filter(
      s => s.dataType === 'directory_item'
    );
    expect(dirSources.length).toBeGreaterThan(0);
    const genericRequired = DATA_SOURCES.filter(
      s => s.requireNonEmpty && s.dataType !== 'directory_item'
    );
    const genericOptional = DATA_SOURCES.filter(
      s => !s.requireNonEmpty && s.dataType !== 'directory_item'
    );
    expect(genericRequired.some(s => s.dataType === 'directory_item')).toBe(
      false
    );
    expect(genericOptional.some(s => s.dataType === 'directory_item')).toBe(
      false
    );
  });
});

/**
 * Real-data tier. The invariant is already proven above on synthetic fixtures
 * that always run; this pins the concrete 612/DIRECTORY_EXPECTED_COUNTS
 * figures and can only run where the generated files exist.
 * `hasGeneratedDirectoryData` is the guard defined alongside the fixture
 * helpers above.
 */
describe.runIf(hasGeneratedDirectoryData)('real directory data', () => {
  it('loads 612 documents with the expected per-file counts', async () => {
    const snap = await loadDirectorySnapshot();
    expect(Object.fromEntries([...snap.bySourceFile].sort())).toEqual(
      DIRECTORY_EXPECTED_COUNTS
    );
    expect(snap.documents).toHaveLength(612);
    expect(snap.complete).toBe(true);
  });
});

/**
 * Fake index + fake waiter. The waiter stands in for waitForSuccess, which
 * closes over the module-level Meilisearch client and would otherwise be hit
 * for real. It resolves a succeeded task, exactly as the real one does.
 */
const fakeIndex = (indexed: { slug: string; type: string }[]) => {
  const state = {
    deleted: [] as string[],
    filters: [] as string[],
    getDocumentsCalls: 0,
    async getDocuments({
      filter,
      limit,
      offset,
    }: {
      filter: string;
      limit: number;
      offset: number;
    }) {
      state.getDocumentsCalls += 1;
      state.filters.push(filter);
      const rows = indexed.filter(d => d.type === filter.split('= ')[1].trim());
      return {
        results: rows.slice(offset, offset + limit),
        total: rows.length,
      };
    },
    deleteDocuments(slugs: string[]) {
      state.deleted.push(...slugs);
      return Promise.resolve({ taskUid: 42 });
    },
  };
  return state;
};

const fakeWaiter = () => {
  const awaited: { taskUid: number; label: string }[] = [];
  const waiter = async (
    taskPromise: Promise<{ taskUid: number }>,
    label: string
  ) => {
    const task = await taskPromise;
    awaited.push({ taskUid: task.taskUid, label });
    return { status: 'succeeded', taskUid: task.taskUid };
  };
  return { waiter, awaited };
};

const snap = (slugs: string[], complete = true) => ({
  documents: slugs.map(slug => ({ slug })),
  bySourceFile: new Map(),
  expectedFiles: [],
  loadedFiles: [],
  complete,
  problems: complete ? [] : ['judicial.json failed to parse'],
});

describe('reconcileStaleDirectoryDocuments', () => {
  it('deletes exactly the directory_item slugs missing from the current snapshot', async () => {
    const index = fakeIndex([
      { slug: 'department-of-x', type: 'directory_item' },
      { slug: 'department-of-retired', type: 'directory_item' },
      { slug: 'office-of-y', type: 'directory_item' },
    ]);
    const { waiter, awaited } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(
      index,
      snap(['department-of-x', 'office-of-y']),
      { waiter }
    );
    expect(index.deleted).toEqual(['department-of-retired']);
    expect(awaited).toEqual([
      { taskUid: 42, label: 'Stale directory document removal' },
    ]);
  });

  it("deletes a renamed record's old slug", async () => {
    const index = fakeIndex([{ slug: 'old-slug', type: 'directory_item' }]);
    const { waiter } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(index, snap(['new-slug']), {
      waiter,
    });
    expect(index.deleted).toEqual(['old-slug']);
  });

  it('only ever queries type = directory_item', async () => {
    const index = fakeIndex([{ slug: 'a', type: 'directory_item' }]);
    const { waiter } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(index, snap(['a']), { waiter });
    expect(index.filters.every(f => f === 'type = directory_item')).toBe(true);
  });

  it('never deletes a service or website document', async () => {
    const index = fakeIndex([
      { slug: 'some-service', type: 'service' },
      { slug: 'some-website', type: 'website' },
      { slug: 'a', type: 'directory_item' },
    ]);
    const { waiter } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(index, snap(['a']), { waiter });
    expect(index.deleted).toEqual([]);
  });

  it('does not delete tolerant directory datasets that are still present', async () => {
    const index = fakeIndex([
      { slug: 'department-of-x', type: 'directory_item' },
      { slug: 'civil-service-commission-csc', type: 'directory_item' },
    ]);
    const { waiter } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(
      index,
      snap(['department-of-x', 'civil-service-commission-csc']),
      { waiter }
    );
    expect(index.deleted).toEqual([]);
  });

  /**
   * The completeness guard. One malformed local directory file must stop the
   * deletion path entirely — no query, no delete, no waiter call.
   */
  it('runs no query, no deletion and no task wait on an incomplete snapshot', async () => {
    const index = fakeIndex([
      { slug: 'department-of-x', type: 'directory_item' },
      { slug: 'civil-service-commission-csc', type: 'directory_item' },
    ]);
    const { waiter, awaited } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(
      index,
      snap(['department-of-x'], /* complete */ false),
      { waiter }
    );
    expect(index.getDocumentsCalls).toBe(0);
    expect(index.deleted).toEqual([]);
    expect(awaited).toEqual([]);
  });

  it('is a no-op, with no task wait, when nothing is stale', async () => {
    const index = fakeIndex([{ slug: 'a', type: 'directory_item' }]);
    const { waiter, awaited } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(index, snap(['a']), { waiter });
    expect(index.deleted).toEqual([]);
    expect(awaited).toEqual([]);
  });

  it('defaults to the real waitForSuccess when none is injected', () => {
    // Signature guard: the waiter is optional, so production callers are
    // unchanged and only tests substitute it.
    expect(reconcileStaleDirectoryDocuments.length).toBe(2);
  });
});

/**
 * End-to-end of the completeness contract, at the loader level rather than
 * with a fake: a malformed tolerant file must produce an incomplete snapshot,
 * which is what gates the deletion path above.
 */
describe('malformed tolerant file blocks reconciliation', () => {
  it('yields an incomplete snapshot that still contains the other files documents', async () => {
    const snapshot = await loadDirectorySnapshot({
      dir: fixtureDirWithMalformed('judicial.json'),
    });
    expect(snapshot.complete).toBe(false);
    // Existing tolerant contract preserved: indexing may still proceed.
    expect(snapshot.documents.length).toBeGreaterThan(0);

    const index = fakeIndex([{ slug: 'anything', type: 'directory_item' }]);
    const { waiter, awaited } = fakeWaiter();
    await reconcileStaleDirectoryDocuments(index, snapshot, { waiter });
    expect(index.getDocumentsCalls).toBe(0);
    expect(index.deleted).toEqual([]);
    expect(awaited).toEqual([]);
  });
});
