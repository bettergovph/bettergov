import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/**
 * The two files a checkout only ever gets from `npm run sync:talacms`. A
 * fresh clone, and every PR/fork CI checkout, never has them.
 */
const GENERATED_FILES = [
  'src/data/service_categories.json',
  'src/data/critical_hotlines.json',
];

/** Rewritten by build:app itself (write-ver-to-json.ts) — restore it after. */
const BUILD_TOUCHED_FILES = ['src/version.json'];

describe('secret-free build:app on a clean (never-synced) checkout', () => {
  it('runs the exact PR-CI build command (`npm run build:app`) successfully with both generated CMS files absent', () => {
    const backups = new Map<string, Buffer>();
    for (const rel of [...GENERATED_FILES, ...BUILD_TOUCHED_FILES]) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) backups.set(rel, fs.readFileSync(abs));
    }
    for (const rel of GENERATED_FILES) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) fs.rmSync(abs);
    }

    try {
      // This is the exact command the Dockerfile's `build-app` stage runs
      // (see build-test.yml's `build_image` job, target: build-app). It
      // must succeed without TalaCMS credentials and without either
      // generated file — a string-inspection test of package.json cannot
      // prove this; only actually running the command can.
      execSync('npm run build:app', {
        cwd: ROOT,
        stdio: 'pipe',
        timeout: 120_000,
      });
    } catch (error) {
      const e = error as { stdout?: Buffer; stderr?: Buffer };
      throw new Error(
        [
          'npm run build:app failed on a clean (never-synced) checkout.',
          e.stdout?.toString(),
          e.stderr?.toString(),
        ]
          .filter(Boolean)
          .join('\n')
      );
    } finally {
      for (const [rel, content] of backups) {
        fs.writeFileSync(path.join(ROOT, rel), content);
      }
    }
  }, 120_000);

  it('does not run generate:metadata, which requires the generated taxonomy', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts['build:app']).not.toContain('generate:metadata');
    // The full production build still generates metadata, but the CMS fetch
    // that produces service_categories.json now runs as a separate,
    // preceding pre-build step (`npm run cms:fetch`), not inside `build`.
    expect(pkg.scripts.build).not.toContain('cms:fetch');
    expect(pkg.scripts.build).not.toContain('sync:talacms');
    expect(pkg.scripts.build).toMatch(/generate:metadata.*build:app/);
  });
});
