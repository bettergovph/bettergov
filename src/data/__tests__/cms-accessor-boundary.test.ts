import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ACCESSOR = 'src/data/cms.ts';

/**
 * Every path a build-time-generated CMS dataset can live at: the two
 * single-file datasets, and ANY .json path under the services directory —
 * a glob (`data/services/*.json`), a template literal
 * (`` data/services/${cat}.json ``), or a direct import of one specific
 * generated file (`data/services/health.json`) are all violations alike.
 * The negative lookahead excludes services/schema/** — that's a tracked
 * contract, not generated data.
 */
const GENERATED_PATH_PATTERN =
  /service_categories\.json|critical_hotlines\.json|data\/services\/(?!schema\/)\S*\.json/;

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');

function sourceFiles(dir: string): string[] {
  return fs
    .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap(entry => {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['__tests__', 'node_modules', 'dist'].includes(entry.name)) {
          return [];
        }
        return sourceFiles(rel);
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) return [];
      if (/\.test\.(ts|tsx)$/.test(entry.name)) return [];
      return [rel];
    });
}

const files = sourceFiles('src').map(file => ({
  path: file,
  code: stripComments(fs.readFileSync(path.join(ROOT, file), 'utf8')),
}));

describe('CMS accessor boundary', () => {
  it('scans more than a handful of files, including the accessor itself', () => {
    expect(files.length).toBeGreaterThan(20);
    expect(files.some(f => f.path === ACCESSOR)).toBe(true);
  });

  it('is the only module in src/ that references a generated CMS path', () => {
    const violations = files
      .filter(f => f.path !== ACCESSOR)
      .filter(f => GENERATED_PATH_PATTERN.test(f.code))
      .map(f => f.path);

    expect(violations).toEqual([]);
  });

  it('routes generated directory data through the accessor only', () => {
    const DIRECTORY_JSON_PATTERN =
      /from\s+['"].*data\/directory\/(departments|executive)\.json['"]/;
    const offenders = files
      .filter(f => f.path !== ACCESSOR)
      .filter(f => DIRECTORY_JSON_PATTERN.test(f.code))
      .map(f => f.path);

    expect(offenders).toEqual([]);
  });

  describe('GENERATED_PATH_PATTERN — bite tests', () => {
    it.each([
      ["import x from '../../data/service_categories.json';"],
      ["import x from '../../data/critical_hotlines.json';"],
      ["import.meta.glob('../../data/services/*.json', { eager: true });"],
      // A direct, concrete import — not a glob — is exactly what slipped
      // past the previous pattern, which only matched a literal "*".
      ["import health from '../../data/services/health.json';"],
      ['await import(`../data/services/${cat}.json`);'],
    ])('matches %s', code => {
      expect(GENERATED_PATH_PATTERN.test(code)).toBe(true);
    });

    it('does NOT match src/data/services/schema/** — that is tracked, not generated', () => {
      expect(
        GENERATED_PATH_PATTERN.test(
          "import schema from '../../data/services/schema/services.schema.json';"
        )
      ).toBe(false);
    });
  });
});
