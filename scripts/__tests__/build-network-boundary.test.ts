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
 *
 * generate-llms-txt.js and generate-sitemap.js (both run by
 * generate:metadata, which `build` runs before `build:app`) read
 * departments/executive/constitutional/legislative/diplomatic via
 * `fs.readFileSync`, so those also need stub files or `npm run build` fails
 * on ENOENT before ever reaching the TalaCMS boundary this test is
 * checking. diplomatic.json is included here (unlike when this comment was
 * first written) because it is now CMS-generated and gitignored too — a
 * clean checkout has no committed copy for it to fall back on. LGU isn't
 * included: it's read only through `import.meta.glob` in src/data/cms.ts,
 * which Vite resolves at bundle time without executing the module — the
 * module's own missing-data guard only throws when a browser loads an LGU
 * page at runtime, not during `npm run build` (verified empirically: build
 * succeeds with zero files under src/data/directory/lgu/).
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
const FIXTURE_DEPARTMENTS = [
  { slug: 'test-department', office_name: 'Test Department' },
];
const FIXTURE_EXECUTIVE = [{ slug: 'test-office', office: 'Test Office' }];
const FIXTURE_CONSTITUTIONAL = [
  { slug: 'test-body', office_type: 'Test Type', name: 'Test Body' },
];
const FIXTURE_LEGISLATIVE = [
  { slug: 'test-chamber', branch: 'Legislative', chamber: 'Test Chamber' },
];
// Object-of-three-arrays contract, minimal but schema-valid: each group's
// required fields per src/data/directory/schema/diplomatic.schema.json.
const FIXTURE_DIPLOMATIC = {
  'Diplomatic Mission': [
    { slug: 'test-mission', country: 'TESTLAND', office_name: 'Test Embassy' },
  ],
  Consulate: [{ country: 'TESTLAND', office_name: 'Test Consulate' }],
  'International Organization': [{ organization_name: 'Test Organization' }],
};

const MANAGED_FILES = [
  'src/data/service_categories.json',
  'src/data/critical_hotlines.json',
  'src/data/directory/departments.json',
  'src/data/directory/executive.json',
  'src/data/directory/constitutional.json',
  'src/data/directory/legislative.json',
  'src/data/directory/diplomatic.json',
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
    fs.writeFileSync(
      path.join(ROOT, 'src/data/directory/departments.json'),
      JSON.stringify(FIXTURE_DEPARTMENTS)
    );
    fs.writeFileSync(
      path.join(ROOT, 'src/data/directory/executive.json'),
      JSON.stringify(FIXTURE_EXECUTIVE)
    );
    fs.writeFileSync(
      path.join(ROOT, 'src/data/directory/constitutional.json'),
      JSON.stringify(FIXTURE_CONSTITUTIONAL)
    );
    fs.writeFileSync(
      path.join(ROOT, 'src/data/directory/legislative.json'),
      JSON.stringify(FIXTURE_LEGISLATIVE)
    );
    fs.writeFileSync(
      path.join(ROOT, 'src/data/directory/diplomatic.json'),
      JSON.stringify(FIXTURE_DIPLOMATIC)
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
