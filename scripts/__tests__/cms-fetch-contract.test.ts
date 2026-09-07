import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = process.cwd();

describe('npm run cms:fetch — fails closed without credentials', () => {
  it('exits non-zero when TalaCMS credentials are absent', () => {
    // A nonexistent dotenv path, plus explicitly unset TALACMS_* vars,
    // guarantees this runs uncredentialed regardless of a real local .env.
    // This does not assert on src/data/*.json: other test files in this
    // suite run concurrently and legitimately add/remove those same
    // generated files, so asserting on them here would be racy.
    const env = { ...process.env };
    delete env.TALACMS_API_URL;
    delete env.TALACMS_API_TOKEN;
    delete env.TALACMS_ENVIRONMENT;
    env.DOTENV_CONFIG_PATH = path.join(
      os.tmpdir(),
      'cms-fetch-contract-test-no-such-file.env'
    );

    let threw = false;
    let stderr = '';
    try {
      execSync('npm run cms:fetch', {
        cwd: ROOT,
        env,
        stdio: 'pipe',
        timeout: 30_000,
      });
    } catch (error) {
      threw = true;
      stderr = (error as { stdout?: Buffer }).stdout?.toString() ?? '';
    }

    expect(threw).toBe(true);
    expect(stderr).toContain('TALACMS_API_URL is unset');
  }, 30_000);
});

describe('npm run build — never invokes the TalaCMS sync', () => {
  it('does not reference the sync command in its script definition', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts.build).not.toMatch(/sync:talacms|cms:fetch/);
  });
});
