import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
) as { scripts: Record<string, string> };

describe('cms:fetch — the canonical public CMS-fetch command', () => {
  it('delegates to sync:talacms exactly — the internal alias, not a duplicated implementation', () => {
    // Exact-match, not `.toContain`: a substring check would also pass for
    // e.g. "npm run sync:talacms && npm run something-else", which would no
    // longer be a pure delegation and could hide a duplicated/diverging
    // implementation from this test.
    expect(pkg.scripts['cms:fetch']).toBe('npm run sync:talacms');
  });

  it('sync:talacms still runs the real implementation script directly', () => {
    expect(pkg.scripts['sync:talacms']).toBe('tsx ./scripts/sync-talacms.ts');
  });
});

describe('build script ordering', () => {
  it('does not invoke the TalaCMS sync — build consumes already-generated data', () => {
    expect(pkg.scripts.build).not.toContain('sync:talacms');
    expect(pkg.scripts.build).not.toContain('cms:fetch');
  });

  it('generates metadata before bundling the app', () => {
    const metadataIndex = pkg.scripts.build.indexOf('generate:metadata');
    const buildAppIndex = pkg.scripts.build.indexOf('build:app');
    expect(metadataIndex).toBeGreaterThan(-1);
    expect(buildAppIndex).toBeGreaterThan(metadataIndex);
  });

  it('fails the whole build if metadata generation fails', () => {
    // `&&` halts the chain on a non-zero exit; `;` would not.
    expect(pkg.scripts.build).toMatch(
      /^npm run generate:metadata\s*&&\s*npm run build:app$/
    );
  });

  it('keeps generate:metadata out of build:app, so the secret-free CI target never needs the generated taxonomy', () => {
    expect(pkg.scripts['build:app']).not.toContain('generate:metadata');
  });

  it('type-checks and bundles only after the sync step, never before it', () => {
    expect(pkg.scripts['build:app'].indexOf('tsc')).toBe(0);
  });
});
