import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { prepare, commitFiles, readJson, readServiceRecords } from '../write';

const REPO_ROOT = process.cwd();
// service_categories.json is generated at build time and not guaranteed to
// exist in a fresh checkout, so `prepare`/`commitFiles` are exercised here
// against a synthetic fixture instead of reading it from disk.
// philippines_hotlines.json stays committed and is safe to read directly.
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
      path: 'src/data/service_categories.json',
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
      [
        'src/data/service_categories.json',
        CATEGORIES_SCHEMA,
        CATEGORIES_FIXTURE,
      ],
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
        path: 'src/data/service_categories.json',
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

describe('readServiceRecords', () => {
  it('reads every committed service record with its category and subcategory slugs', () => {
    const records = readServiceRecords();
    expect(records.length).toBeGreaterThan(100);
    for (const r of records.slice(0, 25)) {
      expect(typeof r.category.slug).toBe('string');
      expect(typeof r.subcategory.slug).toBe('string');
    }
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
