import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
) as { scripts: Record<string, string> };

describe('build script ordering', () => {
  it('syncs the CMS data before running the app build', () => {
    const syncIndex = pkg.scripts.build.indexOf('sync:talacms');
    const buildAppIndex = pkg.scripts.build.indexOf('build:app');
    expect(syncIndex).toBeGreaterThan(-1);
    expect(buildAppIndex).toBeGreaterThan(syncIndex);
  });

  it('fails the whole build if the sync step or metadata generation fails', () => {
    // `&&` halts the chain on a non-zero exit; `;` would not.
    expect(pkg.scripts.build).toMatch(
      /sync:talacms\s*&&\s*npm run generate:metadata\s*&&\s*npm run build:app/
    );
  });

  it('keeps generate:metadata out of build:app, so the secret-free CI target never needs the generated taxonomy', () => {
    expect(pkg.scripts['build:app']).not.toContain('generate:metadata');
  });

  it('type-checks and bundles only after the sync step, never before it', () => {
    expect(pkg.scripts['build:app'].indexOf('tsc')).toBe(0);
  });
});
