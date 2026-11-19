import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const trackedFiles = execFileSync('git', ['ls-files', 'src/data'], {
  encoding: 'utf8',
}).split('\n');

/**
 * A fresh clone must build and render the services directory without
 * TalaCMS credentials, so the data is committed rather than fetched at
 * build time.
 */
describe('services, categories and critical hotlines are committed', () => {
  it('tracks service_categories.json and critical_hotlines.json', () => {
    expect(trackedFiles).toContain('src/data/service_categories.json');
    expect(trackedFiles).toContain('src/data/critical_hotlines.json');
  });

  it('tracks one src/data/services/*.json file per taxonomy category', () => {
    const { categories } = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'src/data/service_categories.json'),
        'utf8'
      )
    ) as { categories: { slug: string }[] };
    const trackedTopLevelServiceFiles = trackedFiles
      .filter(f => /^src\/data\/services\/[^/]+\.json$/.test(f))
      .sort();

    expect(categories.length).toBeGreaterThan(0);
    expect(trackedTopLevelServiceFiles).toEqual(
      categories.map(c => `src/data/services/${c.slug}.json`).sort()
    );
  });

  it('still tracks the schemas the data must satisfy', () => {
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
});
