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

  it('leaves the documented mixed snapshot when a later rename fails, and cleans up temps', async () => {
    const first = makeTempFile('service_categories.json', 'OLD FIRST\n');
    const second = makeTempCopy(HOTLINES);
    const secondBefore = fs.readFileSync(second, 'utf8');

    let calls = 0;
    const flakyRename = (from: string, to: string) => {
      calls += 1;
      if (calls === 2) throw new Error('simulated rename failure');
      fs.renameSync(from, to);
    };

    await expect(
      commitFiles(
        [
          { path: first, text: 'FIRST WRITTEN\n', changed: true },
          { path: second, text: 'SECOND NOT WRITTEN\n', changed: true },
        ],
        { rename: flakyRename }
      )
    ).rejects.toThrow(/simulated rename failure/);

    // This asserts the documented limitation, not an atomicity guarantee:
    // the first file is new, the second is old.
    expect(fs.readFileSync(first, 'utf8')).toBe('FIRST WRITTEN\n');
    expect(fs.readFileSync(second, 'utf8')).toBe(secondBefore);

    for (const dir of [path.dirname(first), path.dirname(second)]) {
      expect(fs.readdirSync(dir).filter(f => f.endsWith('.tmp'))).toEqual([]);
    }
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
  it('returns the on-disk file set in codepoint order', () => {
    const names = readServiceFileNames();
    expect(names).toEqual(
      [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    );
    expect(names).toContain('business-trade.json');
    expect(names.every(n => n.endsWith('.json'))).toBe(true);
    expect(names).not.toContain('schema');
  });
});

describe('readServiceRecords', () => {
  it('reads every committed record with its display names', () => {
    const records = readServiceRecords();
    expect(records).toHaveLength(194);
    expect(
      records.every(
        r => r.category.name.length > 0 && r.subcategory.name.length > 0
      )
    ).toBe(true);
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
