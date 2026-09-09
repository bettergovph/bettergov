import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/**
 * The single files a checkout only ever gets from `npm run
 * sync:talacms`. A fresh clone, and every PR/fork CI checkout, never has
 * them.
 */
const GENERATED_FILES = [
  'src/data/service_categories.json',
  'src/data/critical_hotlines.json',
  'src/data/directory/departments.json',
  'src/data/directory/executive.json',
  'src/data/directory/constitutional.json',
  'src/data/directory/legislative.json',
  'src/data/directory/diplomatic.json',
];

/** Rewritten by build:app itself (write-ver-to-json.ts) — restore it after. */
const BUILD_TOUCHED_FILES = ['src/version.json'];

const SERVICES_DIR = path.join(ROOT, 'src/data/services');

/**
 * The generated top-level src/data/services/*.json files — same rule as
 * GENERATED_FILES above, just a directory instead of a single path.
 * src/data/services/schema/** (the tracked contract) is never touched.
 */
const listGeneratedServiceFiles = () =>
  fs
    .readdirSync(SERVICES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(SERVICES_DIR, f));

const LGU_DIR = path.join(ROOT, 'src/data/directory/lgu');

/**
 * The generated top-level src/data/directory/lgu/*.json region files — same
 * rule as GENERATED_FILES/listGeneratedServiceFiles above, just another
 * directory. src/data/directory/lgu/schema/** and
 * src/data/directory/lgu/__fixtures__/** (the tracked contract and its
 * pre-migration fixtures) are never touched.
 */
const listGeneratedLguFiles = () =>
  fs
    .readdirSync(LGU_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(LGU_DIR, f));

describe('secret-free build:app on a clean (never-synced) checkout', () => {
  it('runs the exact PR-CI build command (`npm run build:app`) successfully with all generated CMS files absent', () => {
    const backups = new Map<string, Buffer>();
    for (const rel of [...GENERATED_FILES, ...BUILD_TOUCHED_FILES]) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) backups.set(rel, fs.readFileSync(abs));
    }
    for (const rel of GENERATED_FILES) {
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs)) fs.rmSync(abs);
    }

    const serviceFiles = listGeneratedServiceFiles();
    for (const abs of serviceFiles) backups.set(abs, fs.readFileSync(abs));
    for (const abs of serviceFiles) fs.rmSync(abs);

    const lguFiles = listGeneratedLguFiles();
    for (const abs of lguFiles) backups.set(abs, fs.readFileSync(abs));
    for (const abs of lguFiles) fs.rmSync(abs);

    try {
      // This is the exact command the Dockerfile's `build-app` stage runs
      // (see build-test.yml's `build_image` job, target: build-app). It
      // must succeed without TalaCMS credentials and without any of the
      // three generated datasets — a string-inspection test of
      // package.json cannot prove this; only actually running the command
      // can.
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
        const target = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
        fs.writeFileSync(target, content);
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

describe('generate:metadata fails closed without the generated directory data', () => {
  it('exits non-zero and names the missing file, instead of silently emitting a truncated sitemap/llms.txt', () => {
    // Observed behavior (Task 10 investigation): generate-llms-txt.js and
    // generate-sitemap.js both read departments.json/executive.json via a
    // loadData() wrapped in try/catch that calls process.exit(1) on any
    // read/parse failure — so a missing generated directory file already
    // fails the whole `generate:metadata` step loudly. This pins that
    // behavior so a future refactor of loadData() cannot regress it back
    // into silently writing a sitemap/llms.txt missing every
    // department/executive URL.
    const generatedDirectoryFiles = [
      'src/data/directory/departments.json',
      'src/data/directory/executive.json',
      'src/data/directory/constitutional.json',
      'src/data/directory/legislative.json',
    ].map(rel => path.join(ROOT, rel));

    const backups = new Map<string, Buffer>();
    for (const abs of generatedDirectoryFiles) {
      if (fs.existsSync(abs)) backups.set(abs, fs.readFileSync(abs));
    }
    for (const abs of generatedDirectoryFiles) {
      if (fs.existsSync(abs)) fs.rmSync(abs);
    }

    try {
      let threw = false;
      let output = '';
      try {
        execSync('npm run generate:metadata', {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 60_000,
        });
      } catch (error) {
        threw = true;
        const e = error as {
          status?: number;
          stdout?: Buffer;
          stderr?: Buffer;
        };
        expect(e.status).not.toBe(0);
        output = [e.stdout?.toString(), e.stderr?.toString()]
          .filter(Boolean)
          .join('\n');
      }
      expect(threw).toBe(true);
      expect(output).toMatch(/departments\.json/);
      expect(output).toMatch(/ENOENT|Error loading data/);
    } finally {
      for (const [abs, content] of backups) fs.writeFileSync(abs, content);
    }
  }, 60_000);

  it('names the missing constitutional file specifically', () => {
    // generate-sitemap.js and generate-llms-txt.js both read
    // constitutional.json through the same loadData() wrapper, which
    // process.exit(1)s on any read/parse failure. Pin that, so a refactor
    // cannot regress into silently emitting a sitemap missing every
    // /government/constitutional/<slug> URL.
    //
    // loadData() reads service_categories.json and departments.json BEFORE
    // constitutional.json (see the field order in both scripts). Both are
    // themselves build-generated and gitignored, so on a true clean checkout
    // (or any environment without a prior `cms:fetch`) they are ALSO absent —
    // loadData() would then throw on whichever of those it reaches first, and
    // the failure output would never mention constitutional.json at all. Pin
    // both as valid, schema-satisfying stand-ins so this test isolates the
    // constitutional.json failure regardless of ambient sync state, rather
    // than depending on files this test never arranged.
    const constitutionalPath = path.join(
      ROOT,
      'src/data/directory/constitutional.json'
    );
    const prerequisites = new Map<string, string>([
      [
        path.join(ROOT, 'src/data/service_categories.json'),
        JSON.stringify({ categories: [] }),
      ],
      [path.join(ROOT, 'src/data/directory/departments.json'), '[]'],
    ]);

    const backups = new Map<string, Buffer | null>();
    for (const abs of [constitutionalPath, ...prerequisites.keys()]) {
      backups.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs) : null);
    }

    fs.rmSync(constitutionalPath, { force: true });
    for (const [abs, content] of prerequisites) {
      fs.writeFileSync(abs, content);
    }

    try {
      let threw = false;
      let output = '';
      try {
        execSync('npm run generate:metadata', {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 60_000,
        });
      } catch (error) {
        threw = true;
        const e = error as {
          status?: number;
          stdout?: Buffer;
          stderr?: Buffer;
        };
        expect(e.status).not.toBe(0);
        output = [e.stdout?.toString(), e.stderr?.toString()]
          .filter(Boolean)
          .join('\n');
      }
      expect(threw).toBe(true);
      expect(output).toMatch(/constitutional\.json/);
    } finally {
      for (const [abs, content] of backups) {
        if (content === null) fs.rmSync(abs, { force: true });
        else fs.writeFileSync(abs, content);
      }
    }
  }, 60_000);

  it('names the missing legislative file specifically', () => {
    // generate-sitemap.js and generate-llms-txt.js both read legislative.json
    // through the same loadData() wrapper, which process.exit(1)s on any
    // read/parse failure. Pin that, so a refactor cannot regress into
    // silently emitting a sitemap missing both /government/legislative/<slug>
    // URLs.
    //
    // loadData() reads service_categories.json, departments.json and
    // constitutional.json BEFORE legislative.json (see the field order in
    // both scripts). All three are themselves build-generated and gitignored,
    // so on a clean checkout loadData() would throw on whichever it reaches
    // first and never mention legislative.json. Pin all three as valid,
    // schema-satisfying stand-ins so this test isolates the legislative.json
    // failure regardless of ambient sync state.
    const legislativePath = path.join(
      ROOT,
      'src/data/directory/legislative.json'
    );
    const prerequisites = new Map<string, string>([
      [
        path.join(ROOT, 'src/data/service_categories.json'),
        JSON.stringify({ categories: [] }),
      ],
      [path.join(ROOT, 'src/data/directory/departments.json'), '[]'],
      [path.join(ROOT, 'src/data/directory/constitutional.json'), '[]'],
    ]);

    const backups = new Map<string, Buffer | null>();
    for (const abs of [legislativePath, ...prerequisites.keys()]) {
      backups.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs) : null);
    }

    fs.rmSync(legislativePath, { force: true });
    for (const [abs, content] of prerequisites) {
      fs.writeFileSync(abs, content);
    }

    try {
      let threw = false;
      let output = '';
      try {
        execSync('npm run generate:metadata', {
          cwd: ROOT,
          stdio: 'pipe',
          timeout: 60_000,
        });
      } catch (error) {
        threw = true;
        const e = error as {
          status?: number;
          stdout?: Buffer;
          stderr?: Buffer;
        };
        expect(e.status).not.toBe(0);
        output = [e.stdout?.toString(), e.stderr?.toString()]
          .filter(Boolean)
          .join('\n');
      }
      expect(threw).toBe(true);
      expect(output).toMatch(/legislative\.json/);
    } finally {
      for (const [abs, content] of backups) {
        if (content === null) fs.rmSync(abs, { force: true });
        else fs.writeFileSync(abs, content);
      }
    }
  }, 60_000);
});
