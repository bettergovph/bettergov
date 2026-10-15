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
});
