import { describe, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = process.cwd();

/**
 * Deliberately minimal, schema-valid fixtures — just enough for
 * generate:metadata to run. Their content is irrelevant; this test asserts
 * on `npm run build`'s exit code and network behavior, not on output data.
 */
const FIXTURE_CATEGORIES = {
  categories: [
    {
      category: 'Health',
      slug: 'health',
      subcategories: [{ name: 'General', slug: 'general' }],
    },
  ],
};
const FIXTURE_HOTLINES = [
  {
    name: 'National Emergency Hotline',
    category: 'Emergency',
    numbers: ['911'],
    description: 'National emergency response hotline',
  },
];

const MANAGED_FILES = [
  'src/data/service_categories.json',
  'src/data/critical_hotlines.json',
  'public/sitemap.xml',
  'public/llms.txt',
  'src/version.json',
];

describe('npm run build — execution-level network boundary', () => {
  it('succeeds without TalaCMS credentials, proving build never contacts TalaCMS — would fail if cms:fetch were reintroduced into the build chain', () => {
    // A string check on package.json (see build-order.test.ts) cannot prove
    // this transitively: it would pass even if `build` called some other
    // script that itself shells out to sync-talacms.ts. Actually running
    // `npm run build` with credentials unreachable is the only thing that
    // proves no TalaCMS network path is on the critical path — the
    // sync-talacms.ts client validates config *before* any fetch call, so
    // a credential-free run that still succeeds means no such call was
    // ever attempted, deterministically and without touching the network.
    const backups = new Map<string, Buffer>();
    for (const rel of MANAGED_FILES) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) backups.set(rel, fs.readFileSync(abs));
    }

    fs.writeFileSync(
      path.join(ROOT, 'src/data/service_categories.json'),
      JSON.stringify(FIXTURE_CATEGORIES)
    );
    fs.writeFileSync(
      path.join(ROOT, 'src/data/critical_hotlines.json'),
      JSON.stringify(FIXTURE_HOTLINES)
    );

    const env = { ...process.env };
    delete env.TALACMS_API_URL;
    delete env.TALACMS_API_TOKEN;
    delete env.TALACMS_ENVIRONMENT;
    env.DOTENV_CONFIG_PATH = path.join(
      os.tmpdir(),
      'build-network-boundary-test-no-such-file.env'
    );

    try {
      execSync('npm run build', {
        cwd: ROOT,
        env,
        stdio: 'pipe',
        timeout: 120_000,
      });
    } catch (error) {
      const e = error as { stdout?: Buffer; stderr?: Buffer };
      throw new Error(
        [
          'npm run build failed without TalaCMS credentials. If this is ' +
            'because `build` now runs cms:fetch/sync:talacms again, that ' +
            'reintroduces an implicit TalaCMS network dependency into ' +
            '`npm run build` and must be reverted.',
          e.stdout?.toString(),
          e.stderr?.toString(),
        ]
          .filter(Boolean)
          .join('\n')
      );
    } finally {
      for (const rel of MANAGED_FILES) {
        const abs = path.join(ROOT, rel);
        const original = backups.get(rel);
        if (original) {
          fs.writeFileSync(abs, original);
        } else if (fs.existsSync(abs)) {
          fs.rmSync(abs);
        }
      }
    }
  }, 120_000);
});
