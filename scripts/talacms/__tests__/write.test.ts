import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  prepare,
  commitFiles,
  readJson,
  readServiceRecords,
  readServiceFileNames,
  parseServiceRecordsFile,
  readTaxonomy,
  parseTaxonomy,
  readJsonOrFail,
  removeStaleFiles,
  removeStaleServiceFiles,
  CommitFilesError,
} from '../write';

const REPO_ROOT = process.cwd();
// service_categories.json is generated at build time and not guaranteed to
// exist in a fresh checkout, so `prepare`/`commitFiles`/`readTaxonomy` are
// exercised here against a synthetic fixture instead of reading it from
// disk. philippines_hotlines.json stays committed and is safe to read
// directly.
const CATEGORIES_PATH = 'src/data/service_categories.json';
const CATEGORIES_SCHEMA = 'src/data/schema/service_categories.schema.json';
const CATEGORIES_FIXTURE = {
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
const HOTLINES = 'src/data/philippines_hotlines.json';

const tempDirs: string[] = [];
const makeTempFile = (basename: string, content: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-write-'));
  tempDirs.push(dir);
  const target = path.join(dir, basename);
  fs.writeFileSync(target, content, 'utf8');
  return target;
};
const makeTempCopy = (relPath: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-write-'));
  tempDirs.push(dir);
  const target = path.join(dir, path.basename(relPath));
  fs.copyFileSync(path.join(REPO_ROOT, relPath), target);
  return target;
};

/**
 * A synthetic services directory, entirely independent of the real
 * (generated, gitignored) src/data/services/*.json — so these tests pass
 * whether or not this checkout has ever been synced. `files` maps basename
 * (without .json) to its record array; a `schema` subdirectory is always
 * added alongside, to prove readServiceFileNames/readServiceRecords never
 * pick it up.
 */
const makeServicesDir = (files: Record<string, unknown[]>): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-services-'));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'schema'));
  fs.writeFileSync(
    path.join(dir, 'schema', 'services.schema.json'),
    '{}',
    'utf8'
  );
  for (const [name, records] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(dir, `${name}.json`),
      JSON.stringify(records),
      'utf8'
    );
  }
  return dir;
};

/**
 * Temporarily writes real content to the exact repo-relative path a function
 * under test hardcodes (readTaxonomy/readJsonOrFail don't take a path
 * parameter for the taxonomy), then restores whatever was there before —
 * absent, or a real synced file — even if the callback throws.
 */
const withRealFileAt = <T>(
  relPath: string,
  content: string,
  run: () => T
): T => {
  const target = path.join(REPO_ROOT, relPath);
  const existed = fs.existsSync(target);
  const before = existed ? fs.readFileSync(target, 'utf8') : null;
  fs.writeFileSync(target, content, 'utf8');
  try {
    return run();
  } finally {
    if (before === null) fs.rmSync(target);
    else fs.writeFileSync(target, before, 'utf8');
  }
};

afterEach(() => {
  while (tempDirs.length)
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe('prepare', () => {
  it('reports unchanged when the candidate equals the committed file', async () => {
    const data = readJson(HOTLINES);
    const prepared = await prepare({
      path: HOTLINES,
      schemaPath: 'src/data/schema/philippines_hotlines.schema.json',
      data,
    });
    expect(prepared.changed).toBe(false);
    expect(prepared.text).toBe(
      fs.readFileSync(path.join(REPO_ROOT, HOTLINES), 'utf8')
    );
  });

  it('is idempotent against the real hotlines file, whose arrays Prettier keeps inline', async () => {
    // JSON.stringify(data, null, 2) expands `"numbers": ["911"]` across three
    // lines; Prettier keeps it inline. Without canonicalization this test
    // fails and every dry-run would report perpetual drift.
    const data = readJson(HOTLINES);
    const prepared = await prepare({
      path: HOTLINES,
      schemaPath: 'src/data/schema/philippines_hotlines.schema.json',
      data,
    });
    expect(prepared.changed).toBe(false);
    expect(prepared.text).toContain('"numbers": ["911"]');
  });

  it('reports changed and ends with exactly one trailing newline', async () => {
    const data = structuredClone(CATEGORIES_FIXTURE);
    data.categories[0].category = 'Renamed For Test';
    const prepared = await prepare({
      path: CATEGORIES_PATH,
      schemaPath: CATEGORIES_SCHEMA,
      data,
    });
    expect(prepared.changed).toBe(true);
    expect(prepared.text.endsWith('}\n')).toBe(true);
    expect(prepared.text.endsWith('\n\n')).toBe(false);
  });

  it('produces text the repository Prettier accepts as already formatted', async () => {
    // The promise is that the pre-commit hook has nothing left to reformat.
    // prettier.check is the same judgement `prettier --check` makes.
    const prettier = await import('prettier');
    for (const [file, schema, data] of [
      [CATEGORIES_PATH, CATEGORIES_SCHEMA, CATEGORIES_FIXTURE],
      [
        HOTLINES,
        'src/data/schema/philippines_hotlines.schema.json',
        readJson(HOTLINES),
      ],
    ] as const) {
      const prepared = await prepare({ path: file, schemaPath: schema, data });
      const config = await prettier.resolveConfig(path.join(REPO_ROOT, file));
      await expect(
        prettier.check(prepared.text, {
          ...config,
          parser: 'json',
          filepath: path.join(REPO_ROOT, file),
        })
      ).resolves.toBe(true);
    }
  });

  it('rejects a candidate the checked-in schema refuses', async () => {
    await expect(
      prepare({
        path: CATEGORIES_PATH,
        schemaPath: CATEGORIES_SCHEMA,
        data: {
          categories: [
            { category: 'X', slug: 'x', subcategories: [], extra: 1 },
          ],
        },
      })
    ).rejects.toThrow(/schema/i);
  });
});

describe('commitFiles', () => {
  it('writes only changed files and leaves no temp files behind', async () => {
    const changedPath = makeTempFile(
      'service_categories.json',
      '{ "categories": [] }\n'
    );
    const untouchedPath = makeTempCopy(HOTLINES);
    const untouchedBefore = fs.readFileSync(untouchedPath, 'utf8');

    await commitFiles([
      { path: changedPath, text: '{ "categories": [] }\n', changed: true },
      { path: untouchedPath, text: 'THIS MUST NOT BE WRITTEN', changed: false },
    ]);

    expect(fs.readFileSync(changedPath, 'utf8')).toBe('{ "categories": [] }\n');
    expect(fs.readFileSync(untouchedPath, 'utf8')).toBe(untouchedBefore);

    const leftovers = fs
      .readdirSync(path.dirname(changedPath))
      .filter(f => f.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });

  it('rolls back an already-renamed file when a later rename fails, and cleans up temps', async () => {
    const first = makeTempFile('service_categories.json', 'OLD FIRST\n');
    const second = makeTempCopy(HOTLINES);
    const secondBefore = fs.readFileSync(second, 'utf8');

    let calls = 0;
    const flakyRename = (from: string, to: string) => {
      calls += 1;
      if (calls === 2) throw new Error('simulated rename failure');
      fs.renameSync(from, to);
    };

    let caught: unknown;
    try {
      await commitFiles(
        [
          { path: first, text: 'FIRST WRITTEN\n', changed: true },
          { path: second, text: 'SECOND NOT WRITTEN\n', changed: true },
        ],
        { rename: flakyRename }
      );
    } catch (error) {
      caught = error;
    }

    // A later rename's failure rolls back every file this batch already
    // renamed — the first file must be restored to its pre-batch content,
    // not left holding the new one. No mixed old/new snapshot survives.
    expect(fs.readFileSync(first, 'utf8')).toBe('OLD FIRST\n');
    expect(fs.readFileSync(second, 'utf8')).toBe(secondBefore);

    for (const dir of [path.dirname(first), path.dirname(second)]) {
      expect(fs.readdirSync(dir).filter(f => f.endsWith('.tmp'))).toEqual([]);
    }

    // run() must only ever report a clean rollback when commitFiles has
    // actually confirmed one — assert the structured signal it confirms on.
    expect(caught).toBeInstanceOf(CommitFilesError);
    const err = caught as CommitFilesError;
    expect(err.rollbackComplete).toBe(true);
    expect(err.incompleteRollbackPaths).toEqual([]);
    expect(err.message).toMatch(/simulated rename failure/);
    expect(err.message).toMatch(/fully rolled back/);
  });

  it('surfaces an INCOMPLETE rollback, rather than swallowing it, when a restoration itself fails', async () => {
    // Two pre-existing files: the first's forward rename succeeds (so it
    // becomes eligible for rollback), the second's forward rename fails
    // (triggering rollback of the first) — and then the first's OWN
    // restoration rename also fails. This must never be silently absorbed:
    // commitFiles must surface it as an explicitly incomplete rollback,
    // naming the affected path, rather than reporting a clean one it never
    // achieved.
    const first = makeTempFile('service_categories.json', 'OLD FIRST\n');
    const second = makeTempCopy(HOTLINES);
    const secondBefore = fs.readFileSync(second, 'utf8');

    let calls = 0;
    const flakyRename = (from: string, to: string) => {
      calls += 1;
      if (calls === 1) {
        fs.renameSync(from, to); // forward rename of `first` succeeds
        return;
      }
      if (calls === 2) throw new Error('simulated forward rename failure');
      // call 3: the restoration rename for `first`, during rollback
      throw new Error('simulated restoration rename failure');
    };

    let caught: unknown;
    try {
      await commitFiles(
        [
          { path: first, text: 'FIRST WRITTEN\n', changed: true },
          { path: second, text: 'SECOND NOT WRITTEN\n', changed: true },
        ],
        { rename: flakyRename }
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(CommitFilesError);
    const err = caught as CommitFilesError;
    expect(err.rollbackComplete).toBe(false);
    expect(err.incompleteRollbackPaths).toEqual([first]);
    expect(err.message).toMatch(/incomplete/i);
    expect(err.message).toContain(first);

    // The restoration genuinely failed: `first` is left holding the NEW
    // content from this failed batch, not restored to its pre-batch state —
    // exactly the state the thrown error must tell the caller about.
    expect(fs.readFileSync(first, 'utf8')).toBe('FIRST WRITTEN\n');
    expect(fs.readFileSync(second, 'utf8')).toBe(secondBefore);

    // The restore-temp file for the failed restoration must still be
    // cleaned up, not left behind as litter.
    expect(
      fs.readdirSync(path.dirname(first)).filter(f => f.endsWith('.tmp'))
    ).toEqual([]);
  });

  it('deletes a brand-new file on rollback, rather than leaving it behind', async () => {
    // The target for `brandNew` never existed before this batch — rollback
    // must delete it, not try to "restore" content that was never there.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-write-'));
    tempDirs.push(dir);
    const brandNew = path.join(dir, 'new-region.json');
    const existing = makeTempFile('service_categories.json', 'OLD\n');

    let calls = 0;
    const flakyRename = (from: string, to: string) => {
      calls += 1;
      if (calls === 2) throw new Error('simulated rename failure');
      fs.renameSync(from, to);
    };

    await expect(
      commitFiles(
        [
          { path: brandNew, text: 'NEW REGION\n', changed: true },
          { path: existing, text: 'NOT WRITTEN\n', changed: true },
        ],
        { rename: flakyRename }
      )
    ).rejects.toThrow(/simulated rename failure/);

    expect(fs.existsSync(brandNew)).toBe(false);
    expect(fs.readFileSync(existing, 'utf8')).toBe('OLD\n');
  });

  it('rolls back every already-renamed file in a large (LGU-shaped) multi-file batch', async () => {
    // Mirrors the shape of a real LGU sync: many files in one commitFiles
    // call, a mix of pre-existing and brand-new targets, and a failure partway
    // through — every file the batch already touched must come back exactly
    // as it was, and every never-reached file must be untouched.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-write-'));
    tempDirs.push(dir);

    const existingPaths = Array.from({ length: 3 }, (_, i) => {
      const p = path.join(dir, `region-${i}.json`);
      fs.writeFileSync(p, `OLD ${i}\n`, 'utf8');
      return p;
    });
    const brandNewPaths = Array.from({ length: 2 }, (_, i) =>
      path.join(dir, `new-region-${i}.json`)
    );
    const files = [
      { path: existingPaths[0], text: 'NEW 0\n', changed: true },
      { path: brandNewPaths[0], text: 'NEW-NEW 0\n', changed: true },
      { path: existingPaths[1], text: 'NEW 1\n', changed: true },
      { path: brandNewPaths[1], text: 'NEW-NEW 1\n', changed: true },
      { path: existingPaths[2], text: 'NEW 2\n', changed: true }, // this rename is the one that fails
    ];

    let calls = 0;
    const flakyRename = (from: string, to: string) => {
      calls += 1;
      if (calls === 5) throw new Error('simulated rename failure on file 5');
      fs.renameSync(from, to);
    };

    await expect(commitFiles(files, { rename: flakyRename })).rejects.toThrow(
      /simulated rename failure on file 5/
    );

    expect(fs.readFileSync(existingPaths[0], 'utf8')).toBe('OLD 0\n');
    expect(fs.readFileSync(existingPaths[1], 'utf8')).toBe('OLD 1\n');
    expect(fs.readFileSync(existingPaths[2], 'utf8')).toBe('OLD 2\n');
    expect(fs.existsSync(brandNewPaths[0])).toBe(false);
    expect(fs.existsSync(brandNewPaths[1])).toBe(false);
    expect(fs.readdirSync(dir).filter(f => f.endsWith('.tmp'))).toEqual([]);
  });

  it('cleans up a partially written temp file and leaves destinations untouched', async () => {
    const target = makeTempFile('service_categories.json', 'OLD CONTENT\n');
    const before = fs.readFileSync(target, 'utf8');

    // Writes some bytes, then fails — exactly what a disk-full write does.
    // Registering the temp path only *after* a successful write would strand
    // this file, so this test fails against that ordering.
    const partialWrite = (temp: string, text: string) => {
      fs.writeFileSync(temp, text.slice(0, 5), 'utf8');
      throw new Error('ENOSPC: simulated');
    };

    await expect(
      commitFiles([{ path: target, text: 'NEW CONTENT\n', changed: true }], {
        write: partialWrite,
      })
    ).rejects.toThrow(/ENOSPC/);

    expect(fs.readFileSync(target, 'utf8')).toBe(before);
    expect(
      fs.readdirSync(path.dirname(target)).filter(f => f.endsWith('.tmp'))
    ).toEqual([]);
  });
});

const validRecord = {
  service: 'Apply for a Trademark',
  url: 'https://example.gov.ph/',
  id: 'abc',
  slug: 'apply-for-a-trademark',
  published: true,
  featured: false,
  category: { name: 'Business and Trade', slug: 'business-trade' },
  subcategory: { name: 'Business Registration', slug: 'business-registration' },
  createdAt: '2025-06-06T11:30:06.318Z',
  updatedAt: '2025-06-06T11:30:06.318Z',
};

describe('parseServiceRecordsFile', () => {
  it('keeps the display names the name-agreement gate needs', () => {
    expect(parseServiceRecordsFile('health.json', [validRecord])).toEqual([
      {
        category: { name: 'Business and Trade', slug: 'business-trade' },
        subcategory: {
          name: 'Business Registration',
          slug: 'business-registration',
        },
      },
    ]);
  });

  it('accepts an empty file — a category with zero records is legitimate', () => {
    expect(parseServiceRecordsFile('brand-new.json', [])).toEqual([]);
  });

  it.each([
    ['not an array', {}],
    ['a missing category name', [{ ...validRecord, category: { slug: 'x' } }]],
    [
      'a blank subcategory name',
      [
        {
          ...validRecord,
          subcategory: { name: '', slug: 'business-registration' },
        },
      ],
    ],
    [
      'a slug that breaks the schema pattern',
      [{ ...validRecord, category: { name: 'X', slug: 'Not A Slug' } }],
    ],
  ])('fails with a prefixed error, not a TypeError, on %s', (_label, value) => {
    expect(() => parseServiceRecordsFile('health.json', value)).toThrow(
      /^\[sync:services\] committed src\/data\/services\/health\.json is malformed/
    );
  });
});

describe('readServiceFileNames', () => {
  it('returns the on-disk file set in codepoint order, excluding schema/', () => {
    const dir = makeServicesDir({
      'transport-driving': [],
      tax: [],
      uncategorized: [],
    });
    const names = readServiceFileNames(dir);
    expect(names).toEqual([
      'tax.json',
      'transport-driving.json',
      'uncategorized.json',
    ]);
    expect(names.every(n => n.endsWith('.json'))).toBe(true);
    expect(names).not.toContain('schema');
  });

  it('never touches src/data/services/schema — structurally excluded, not by convention', () => {
    // A directory entry never ends in ".json", so the schema/ subdirectory
    // itself cannot pass the filter regardless of what it's named. Asserted
    // directly rather than trusted, since stale-file cleanup relies on it.
    const dir = makeServicesDir({ health: [] });
    expect(fs.statSync(path.join(dir, 'schema')).isDirectory()).toBe(true);
    expect(readServiceFileNames(dir)).toEqual(['health.json']);
  });
});

describe('readServiceRecords', () => {
  it('reads every generated record with its display names', () => {
    const dir = makeServicesDir({
      health: [
        { ...validRecord, category: { name: 'Health', slug: 'health' } },
      ],
      tax: [validRecord, validRecord],
    });
    const records = readServiceRecords(dir);
    expect(records).toHaveLength(3);
    expect(
      records.every(
        r => r.category.name.length > 0 && r.subcategory.name.length > 0
      )
    ).toBe(true);
  });

  it('fails closed when no generated service files exist yet — never fabricates an empty result', () => {
    // Zero files here is ambiguous between "never synced" and "TalaCMS has
    // no services", and the caller (--only=categories name-agreement) would
    // otherwise read that silence as "no conflicts" and pass a rename it
    // exists to catch.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-services-empty-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, 'schema'));
    expect(() => readServiceRecords(dir)).toThrow(
      /^\[sync:services\] no generated service files found under .+ — run a full sync first/
    );
  });

  it('fails closed when files exist but contain zero records combined — file count alone is not enough', () => {
    // One or more files can each individually parse as valid, empty arrays —
    // e.g. a corrupted or partially-regenerated snapshot — and file-count
    // alone would wrongly accept that as "has data".
    const dir = makeServicesDir({ health: [], tax: [] });
    expect(() => readServiceRecords(dir)).toThrow(
      /^\[sync:services\] generated service files under .+ contain zero records combined — run a full sync first/
    );
  });
});

const taxonomyWith = (categories: unknown[]) => ({ categories });
const cat = (over: Record<string, unknown> = {}) => ({
  category: 'Health',
  slug: 'health',
  subcategories: [
    { name: 'Financial Assistance', slug: 'financial-assistance' },
  ],
  ...over,
});

describe('parseTaxonomy', () => {
  it('accepts a well-formed taxonomy unchanged', () => {
    const value = taxonomyWith([cat()]);
    expect(parseTaxonomy(value)).toEqual(value);
  });

  it('accepts subcategory slugs that repeat across different parents', () => {
    // `financial-assistance` legitimately appears under five parents.
    expect(() =>
      parseTaxonomy(
        taxonomyWith([cat(), cat({ category: 'Education', slug: 'education' })])
      )
    ).not.toThrow();
  });

  it.each([
    ['an empty categories array', taxonomyWith([])],
    ['a missing categories key', {}],
    ['an unknown root key', { ...taxonomyWith([cat()]), extra: 1 }],
    ['an unknown category key', taxonomyWith([cat({ position: 0 })])],
    [
      'an unknown subcategory key',
      taxonomyWith([
        cat({ subcategories: [{ name: 'X', slug: 'x', position: 0 }] }),
      ]),
    ],
    [
      'a category with no subcategories',
      taxonomyWith([cat({ subcategories: [] })]),
    ],
    ['a blank category display name', taxonomyWith([cat({ category: '  ' })])],
    [
      'a blank subcategory display name',
      taxonomyWith([cat({ subcategories: [{ name: '  ', slug: 'x' }] })]),
    ],
    [
      'a category slug breaking the pattern',
      taxonomyWith([cat({ slug: 'Not A Slug' })]),
    ],
    ['a duplicate category slug', taxonomyWith([cat(), cat()])],
    [
      'a duplicate subcategory slug under one parent',
      taxonomyWith([
        cat({
          subcategories: [
            { name: 'A', slug: 'dup' },
            { name: 'B', slug: 'dup' },
          ],
        }),
      ]),
    ],
    ['a completely malformed value', 'nope'],
  ])('fails closed with a prefixed error on %s', (_label, value) => {
    expect(() => parseTaxonomy(value)).toThrow(/^\[sync:services\] /);
  });
});

describe('readTaxonomy', () => {
  it('reads and validates whatever is at src/data/service_categories.json', () => {
    // Generated at build time, not guaranteed to exist in this checkout —
    // exercised against a temporary real file at readTaxonomy's hardcoded
    // path rather than depending on one already being synced.
    withRealFileAt(CATEGORIES_PATH, JSON.stringify(CATEGORIES_FIXTURE), () => {
      expect(readTaxonomy()).toEqual(CATEGORIES_FIXTURE);
    });
  });
});

describe('readJsonOrFail', () => {
  it('converts a read/parse failure into a prefixed error, not a raw SyntaxError or ENOENT', () => {
    // readTaxonomy() calls this with the real committed path; a bogus path
    // exercises the exact same catch clause without touching that file.
    expect(() => readJsonOrFail('src/data/does-not-exist.json')).toThrow(
      /^\[sync:services\] committed src\/data\/does-not-exist\.json is not valid JSON$/
    );
  });

  it('reads real JSON unchanged when it parses fine', () => {
    withRealFileAt(CATEGORIES_PATH, JSON.stringify(CATEGORIES_FIXTURE), () => {
      expect(readJsonOrFail(CATEGORIES_PATH)).toEqual(
        expect.objectContaining({ categories: expect.any(Array) })
      );
    });
  });

  it('converts syntactically invalid JSON content into a prefixed error, not a raw SyntaxError', () => {
    // Distinct from the missing-file case above: the file exists and is
    // readable, but its content does not parse — the exact shape a
    // hand-edited or truncated service_categories.json would take.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-taxonomy-'));
    tempDirs.push(dir);
    const badFile = path.join(dir, 'not-json.json');
    fs.writeFileSync(badFile, '{ this is not valid JSON', 'utf8');

    expect(() => readJsonOrFail(badFile)).toThrow(
      new RegExp(
        `^\\[sync:services\\] committed .*not-json\\.json is not valid JSON$`
      )
    );
  });
});

describe('removeStaleServiceFiles', () => {
  it('deletes only files absent from the generated set, and logs each removal', () => {
    const dir = makeServicesDir({ health: [], 'old-category': [] });
    const logged: string[] = [];
    const { removed, failed } = removeStaleServiceFiles(
      ['health.json', 'old-category.json'],
      ['health.json'],
      {
        dir,
        unlink: target => fs.unlinkSync(target),
        log: message => logged.push(message),
      }
    );

    expect(removed).toEqual(['old-category.json']);
    expect(failed).toEqual([]);
    expect(fs.existsSync(path.join(dir, 'old-category.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'health.json'))).toBe(true);
    expect(logged.some(l => l.includes('removed stale'))).toBe(true);
    expect(logged.some(l => l.includes('old-category.json'))).toBe(true);
  });

  it('never touches src/data/services/schema — it is structurally never in the before/generated lists', () => {
    const dir = makeServicesDir({ health: [] });
    removeStaleServiceFiles(['health.json'], [], {
      dir,
      unlink: target => fs.unlinkSync(target),
      log: () => {},
    });
    expect(fs.statSync(path.join(dir, 'schema')).isDirectory()).toBe(true);
  });

  it('does nothing, and reports nothing, when the sets already match', () => {
    const unlink = () => {
      throw new Error('must not be called');
    };
    const { removed, failed } = removeStaleServiceFiles(
      ['health.json'],
      ['health.json'],
      { unlink, log: () => {} }
    );
    expect(removed).toEqual([]);
    expect(failed).toEqual([]);
  });

  it('is best-effort: one failed deletion does not stop the rest, and is reported, not swallowed', () => {
    const logged: string[] = [];
    const { removed, failed } = removeStaleServiceFiles(
      ['a.json', 'b.json', 'c.json'],
      [],
      {
        unlink: target => {
          if (target.endsWith('b.json')) throw new Error('EACCES: simulated');
          // a.json and c.json "succeed" without touching real disk.
        },
        log: message => logged.push(message),
      }
    );
    expect(removed).toEqual(['a.json', 'c.json']);
    expect(failed).toEqual(['b.json']);
    expect(logged.some(l => l.includes('✖') && l.includes('b.json'))).toBe(
      true
    );
  });

  it('adding a new generated file never counts as stale', () => {
    const { removed } = removeStaleServiceFiles(
      ['health.json'],
      ['health.json', 'brand-new.json'],
      { unlink: () => {}, log: () => {} }
    );
    expect(removed).toEqual([]);
  });
});

describe('removeStaleFiles', () => {
  it('deletes only files absent from the generated set when given a custom dir', () => {
    const dir = makeServicesDir({ health: [], 'old-category': [] });
    const logged: string[] = [];
    const { removed, failed } = removeStaleFiles(
      dir,
      ['health.json', 'old-category.json'],
      ['health.json'],
      {
        unlink: target => fs.unlinkSync(target),
        log: message => logged.push(message),
      }
    );

    expect(removed).toEqual(['old-category.json']);
    expect(failed).toEqual([]);
    expect(fs.existsSync(path.join(dir, 'old-category.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'health.json'))).toBe(true);
    expect(logged.some(l => l.includes('removed stale'))).toBe(true);
    expect(logged.some(l => l.includes('old-category.json'))).toBe(true);
  });

  it('never touches schema subdirectories in the target dir', () => {
    const dir = makeServicesDir({ health: [] });
    removeStaleFiles(dir, ['health.json'], [], {
      unlink: target => fs.unlinkSync(target),
      log: () => {},
    });
    expect(fs.statSync(path.join(dir, 'schema')).isDirectory()).toBe(true);
  });

  it('does nothing when the sets already match', () => {
    const unlink = () => {
      throw new Error('must not be called');
    };
    const dir = makeServicesDir({ health: [] });
    const { removed, failed } = removeStaleFiles(
      dir,
      ['health.json'],
      ['health.json'],
      { unlink, log: () => {} }
    );
    expect(removed).toEqual([]);
    expect(failed).toEqual([]);
  });

  it('is best-effort: one failed deletion does not stop the rest', () => {
    const logged: string[] = [];
    const dir = makeServicesDir({ a: [], b: [], c: [] });
    const { removed, failed } = removeStaleFiles(
      dir,
      ['a.json', 'b.json', 'c.json'],
      [],
      {
        unlink: target => {
          if (target.endsWith('b.json')) throw new Error('EACCES: simulated');
        },
        log: message => logged.push(message),
      }
    );
    expect(removed).toEqual(['a.json', 'c.json']);
    expect(failed).toEqual(['b.json']);
    expect(logged.some(l => l.includes('✖') && l.includes('b.json'))).toBe(
      true
    );
  });

  it('sorts stale files in codepoint order before deletion', () => {
    const dir = makeServicesDir({
      zebra: [],
      alpha: [],
      beta: [],
      gamma: [],
    });
    const unlinkOrder: string[] = [];
    removeStaleFiles(
      dir,
      ['zebra.json', 'alpha.json', 'beta.json', 'gamma.json'],
      [],
      {
        unlink: target => {
          unlinkOrder.push(path.basename(target));
        },
        log: () => {},
      }
    );
    expect(unlinkOrder).toEqual([
      'alpha.json',
      'beta.json',
      'gamma.json',
      'zebra.json',
    ]);
  });
});
