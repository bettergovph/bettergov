import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// This is a CommonJS script (see scripts/index_meilisearch.cjs); requiring
// it does not run main() — see the require.main === module guard at the
// bottom of that file — so this never contacts Meilisearch.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- .cjs script has no ESM build to import
const indexMeilisearch = require('../index_meilisearch.cjs');
const { FatalIndexingError, loadRequiredDocuments } = indexMeilisearch;

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
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts/index_meilisearch.cjs'),
      'utf8'
    );
    const mainBody = source.slice(source.indexOf('async function main()'));

    const preflightIndex = mainBody.indexOf(
      'loadRequiredDocuments(dataSource)'
    );
    const firstMeilisearchCallIndex = mainBody.indexOf('client.health()');

    expect(preflightIndex).toBeGreaterThan(-1);
    expect(firstMeilisearchCallIndex).toBeGreaterThan(-1);
    expect(preflightIndex).toBeLessThan(firstMeilisearchCallIndex);
  });
});
