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
    expect(trackedFiles).not.toContain('src/data/directory/legislative.json');
  });

  it('does not track any top-level src/data/directory/lgu/*.json region file', () => {
    const trackedTopLevelLguFiles = trackedFiles.filter(f =>
      /^src\/data\/directory\/lgu\/[^/]+\.json$/.test(f)
    );
    expect(trackedTopLevelLguFiles).toEqual([]);
  });

  it('still tracks the LGU schema and all 19 pre-migration fixtures', () => {
    expect(trackedFiles).toContain(
      'src/data/directory/lgu/schema/lgu-region.schema.json'
    );
    const trackedLguFixtureFiles = trackedFiles.filter(f =>
      f.startsWith('src/data/directory/lgu/__fixtures__/')
    );
    expect(trackedLguFixtureFiles.sort()).toEqual(
      [
        'bangsamoro-autonomous-region-in-muslim-mindanao',
        'cordillera-administrative-region',
        'mimaropa-region',
        'national-capital-region',
        'negros-island-region',
        'region-i-ilocos-region',
        'region-ii-cagayan-valley',
        'region-iii-central-luzon',
        'region-iva-calabarzon',
        'region-ix-zamboanga-peninsula',
        'region-v-bicol-region',
        'region-vi-western-visayas',
        'region-vii-central-visayas',
        'region-viii-eastern-visayas',
        'region-x-northern-mindanao',
        'region-xi-davao-region',
        'region-xii-soccsksargen',
        'region-xiiicaraga',
        'special-geographic-area',
      ]
        .map(
          slug => `src/data/directory/lgu/__fixtures__/${slug}.expected.json`
        )
        .sort()
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

  it('still tracks the legislative schema and its pre-migration fixture', () => {
    expect(trackedFiles).toContain(
      'src/data/directory/schema/legislative.schema.json'
    );
    expect(trackedFiles).toContain(
      'src/data/directory/__fixtures__/legislative.expected.json'
    );
  });

  it('still tracks the directory files that stay local', () => {
    // Judicial, diplomatic and the two orphaned member files are deliberately
    // NOT migrated — pin that so a future sweep cannot silently gitignore
    // them. legislative.json moved to the generated set; the two orphaned
    // member files did NOT follow it, and are now a second, hand-maintained
    // copy of content the CMS owns. Recorded, deliberately not resolved here.
    for (const f of [
      'src/data/directory/judicial.json',
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
