import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', 'src/data'], {
  encoding: 'utf8',
}).split('\n');

describe('generated CMS output is never committed', () => {
  it('does not track service_categories.json or critical_hotlines.json', () => {
    expect(trackedFiles).not.toContain('src/data/service_categories.json');
    expect(trackedFiles).not.toContain('src/data/critical_hotlines.json');
  });

  it('does not track any top-level src/data/services/*.json file', () => {
    const trackedTopLevelServiceFiles = trackedFiles.filter(f =>
      /^src\/data\/services\/[^/]+\.json$/.test(f)
    );
    expect(trackedTopLevelServiceFiles).toEqual([]);
  });

  it('does not track the generated directory files', () => {
    expect(trackedFiles).not.toContain('src/data/directory/departments.json');
    expect(trackedFiles).not.toContain('src/data/directory/executive.json');
    expect(trackedFiles).not.toContain(
      'src/data/directory/constitutional.json'
    );
  });

  it('still tracks the constitutional schema and its pre-migration fixture', () => {
    expect(trackedFiles).toContain(
      'src/data/directory/schema/constitutional.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/directory/__fixtures__/constitutional.expected.json'
    );
  });

  it('still tracks the directory files that stay local', () => {
    // Judicial, legislative, diplomatic and the two orphaned member files are
    // deliberately NOT migrated — pin that so a future sweep cannot silently
    // gitignore them.
    for (const f of [
      'src/data/directory/judicial.json',
      'src/data/directory/legislative.json',
      'src/data/directory/diplomatic.json',
      'src/data/directory/house_members.json',
      'src/data/directory/party_list_representatives.json',
    ]) {
      expect(trackedFiles).toContain(f);
    }
  });

  it('still tracks the schemas that are the generated data’s contract', () => {
    expect(trackedFiles).toContain(
      'src/data/schema/service_categories.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/schema/critical_hotlines.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/schema/philippines_hotlines.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/services/schema/services.schema.json'
    );
  });

  it('still tracks src/data/directory/schema/** and __fixtures__/**', () => {
    const trackedDirectorySchemaFiles = trackedFiles.filter(f =>
      f.startsWith('src/data/directory/schema/')
    );
    const trackedDirectoryFixtureFiles = trackedFiles.filter(f =>
      f.startsWith('src/data/directory/__fixtures__/')
    );
    expect(trackedDirectorySchemaFiles.length).toBeGreaterThan(0);
    expect(trackedDirectoryFixtureFiles.length).toBeGreaterThan(0);
  });
});
