import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/** Only the module that may talk to TalaCMS. */
const TALACMS_ALLOWLIST = ['scripts/talacms/client.ts'];
/**
 * Modules that may reference the queries/normalization (not the network).
 * `scripts/talacms/` is a directory prefix; `scripts/sync-talacms.ts` is a
 * single file and must match exactly — `startsWith` would also exempt a
 * similarly-named sibling like `scripts/sync-talacms.tsx`.
 */
const SYNC_TOOLING_DIR_PREFIXES = ['scripts/talacms/'];
const SYNC_TOOLING_EXACT_FILES = ['scripts/sync-talacms.ts'];

/**
 * Every executable extension in this repository. `scripts/` holds .js and
 * .cjs files today, so a TypeScript-only scan would leave the boundary
 * trivially bypassable.
 */
const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

interface SourceFile {
  path: string;
  code: string;
}

/** Strips comments so prose about the old architecture never trips a rule. */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');

const isSyncTooling = (file: string) =>
  SYNC_TOOLING_DIR_PREFIXES.some(prefix => file.startsWith(prefix)) ||
  SYNC_TOOLING_EXACT_FILES.includes(file);

/**
 * The approved boundary, as data. Every rule returns the files that break it.
 */
export function findViolations(files: SourceFile[]): string[] {
  const violations: string[] = [];

  for (const { path: file, code } of files) {
    const isApp = file.startsWith('src/') || file.startsWith('functions/');

    // 1. TALACMS_* credentials live in exactly one module.
    if (/TALACMS_[A-Z_]+/.test(code) && !TALACMS_ALLOWLIST.includes(file)) {
      violations.push(`${file}: references TALACMS_* outside the sync client`);
    }

    // 2. TalaCMS endpoints/hosts are constructed only by the sync tooling —
    //    this covers any script, not just application code. A `TALACMS_`
    //    env-var reference (rule 1's concern) is stripped from every file so
    //    it isn't double-reported. A `scripts/talacms/` import path is
    //    stripped only for application code, because rule 4 already scans
    //    application code for exactly that path — for any other script
    //    (outside src/ and functions/, and not itself sync tooling) rule 4
    //    does not apply, so the path text must still trip this rule; without
    //    that split, a non-app script could reach the sync client by
    //    importing it, since nothing else would ever flag it.
    const withoutEnvVarRefs = code.replace(/TALACMS_[A-Z_]+/g, '');
    const codeForHostRule = isApp
      ? withoutEnvVarRefs.replace(/scripts\/talacms\//g, '')
      : withoutEnvVarRefs;
    if (/talacms/i.test(codeForHostRule) && !isSyncTooling(file)) {
      violations.push(`${file}: references TalaCMS outside scripts/talacms/`);
    }

    // 3. No application module builds a /cms/ endpoint, under any name.
    if (isApp && /['"`][^'"`]*\/cms\/[^'"`]*['"`]/.test(code)) {
      violations.push(`${file}: constructs a /cms/ endpoint`);
    }

    // 4. No application module reaches into the sync tooling — by static
    //    import, side-effect import, dynamic import, or require().
    const importsScripts =
      /from\s+['"`][^'"`]*scripts\//.test(code) ||
      /import\s+['"`][^'"`]*scripts\//.test(code) ||
      /import\s*\(\s*['"`][^'"`]*scripts\//.test(code) ||
      /require\s*\(\s*['"`][^'"`]*scripts\//.test(code);
    if (isApp && importsScripts) {
      violations.push(`${file}: imports from scripts/`);
    }
  }

  return violations;
}

/**
 * Source modules only — never tests or `node_modules`/`dist`. `src/data`
 * holds mostly committed JSON, but also executable modules — navigation.ts,
 * news.ts, the flood_control loader scripts — that must be scanned like any
 * other application code; the extension filter below already excludes the
 * JSON, so there is no need to exclude the directory by name.
 */
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
      if (!SOURCE_EXTENSIONS.test(entry.name)) return [];
      if (/\.test\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) return [];
      return [rel];
    });
}

const files: SourceFile[] = [
  ...sourceFiles('src'),
  ...sourceFiles('functions'),
  ...sourceFiles('scripts'),
].map(file => ({
  path: file,
  code: stripComments(fs.readFileSync(path.join(ROOT, file), 'utf8')),
}));

describe('CMS access boundary', () => {
  it('scans application code AND every executable script, whatever its extension', () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files.some(f => f.path === 'scripts/talacms/client.ts')).toBe(true);
    // The repository's existing scripts are .js and .cjs — if these are not
    // scanned, rules 1 and 2 can be bypassed by editing any of them.
    expect(files.some(f => f.path.endsWith('.js'))).toBe(true);
    expect(files.some(f => f.path.endsWith('.cjs'))).toBe(true);
    expect(files.some(f => f.path === 'scripts/generate-sitemap.js')).toBe(
      true
    );
    // src/data holds mostly committed JSON, but also executable modules —
    // if the directory were excluded by name, a TALACMS_/talacms/`/cms/`
    // reference introduced in one of these would pass the guard silently.
    expect(files.some(f => f.path === 'src/data/navigation.ts')).toBe(true);
    expect(files.some(f => f.path === 'src/data/news.ts')).toBe(true);
    expect(
      files.some(f => f.path === 'src/data/flood_control/load_flood_control.js')
    ).toBe(true);
  });

  it('has no violations in the repository', () => {
    expect(findViolations(files)).toEqual([]);
  });

  it('keeps the deleted runtime CMS modules absent', () => {
    for (const deleted of [
      'src/lib/cms.ts',
      'functions/lib/talacms.ts',
      'functions/api/cms-categories.ts',
      'functions/api/cms-hotlines.ts',
    ]) {
      expect(fs.existsSync(path.join(ROOT, deleted))).toBe(false);
    }
  });

  it('leaves no CMS endpoint in Worker dispatch or manifests', () => {
    const router = fs.readFileSync(
      path.join(ROOT, 'functions/index.ts'),
      'utf8'
    );
    expect(router).not.toContain('/cms/');
    expect(router).not.toContain('cms-categories');
    expect(router).not.toContain('cms-hotlines');
  });

  describe('bite tests — the checker must reject each forbidden shape', () => {
    it('rejects TalaCMS transport introduced in another script', () => {
      expect(
        findViolations([
          {
            path: 'scripts/refresh-everything.ts',
            code: 'const url = process.env.TALACMS_API_URL; await fetch(url);',
          },
        ])
      ).toEqual([
        'scripts/refresh-everything.ts: references TALACMS_* outside the sync client',
      ]);
    });

    it('rejects a TalaCMS host named in a non-sync script', () => {
      expect(
        findViolations([
          {
            path: 'scripts/index_meilisearch.cjs.ts',
            code: "fetch('https://bettergov.talacms.com/cda/v1/graphql');",
          },
        ])
      ).toEqual([
        'scripts/index_meilisearch.cjs.ts: references TalaCMS outside scripts/talacms/',
      ]);
    });

    it('rejects TalaCMS credentials added to an existing JavaScript script', () => {
      expect(
        findViolations([
          {
            path: 'scripts/generate-sitemap.js',
            code: 'const u = process.env.TALACMS_API_URL;',
          },
        ])
      ).toEqual([
        'scripts/generate-sitemap.js: references TALACMS_* outside the sync client',
      ]);
    });

    it('rejects a CommonJS script reaching TalaCMS', () => {
      expect(
        findViolations([
          {
            path: 'scripts/index_meilisearch.cjs',
            code: "const r = require('node-fetch')('https://x.talacms.com/cda');",
          },
        ])
      ).toEqual([
        'scripts/index_meilisearch.cjs: references TalaCMS outside scripts/talacms/',
      ]);
    });

    it.each([
      ["import '../../scripts/talacms/client';", 'side-effect import'],
      [
        "const m = await import('../../scripts/talacms/client');",
        'dynamic import',
      ],
      [
        'const m = await import(`../../scripts/talacms/client`);',
        'template-literal dynamic import',
      ],
      ["const m = require('../../scripts/talacms/client');", 'require()'],
    ])('rejects an application module using %s', code => {
      expect(findViolations([{ path: 'src/lib/taxonomy.ts', code }])).toEqual([
        'src/lib/taxonomy.ts: imports from scripts/',
      ]);
    });

    it('rejects a renamed runtime proxy in application code', () => {
      expect(
        findViolations([
          {
            path: 'src/lib/content.ts',
            code: "export const load = () => fetch('https://api.bettergov.ph/cms/taxonomy');",
          },
        ])
      ).toEqual(['src/lib/content.ts: constructs a /cms/ endpoint']);
    });

    it('rejects a non-app, non-sync script importing the sync client — rule 4 only scans src/ and functions/', () => {
      // Reproduces the reported bypass: a script outside src/functions/ is
      // never scanned by rule 4, so only rule 2 stands between it and the
      // sync client. A path-adjacency-based exemption for "scripts/talacms/"
      // text would blind rule 2 to exactly this import.
      expect(
        findViolations([
          {
            path: 'scripts/refresh-everything.ts',
            code: "import '../scripts/talacms/client';",
          },
        ])
      ).toEqual([
        'scripts/refresh-everything.ts: references TalaCMS outside scripts/talacms/',
      ]);
    });

    it('rejects an application module importing the sync tooling', () => {
      expect(
        findViolations([
          {
            path: 'src/lib/taxonomy.ts',
            code: "import { buildCategories } from '../../scripts/talacms/categories';",
          },
        ])
      ).toEqual(['src/lib/taxonomy.ts: imports from scripts/']);
    });

    it('allows the sync client itself', () => {
      expect(
        findViolations([
          {
            path: 'scripts/talacms/client.ts',
            code: 'const url = process.env.TALACMS_API_URL; await fetch(url); // talacms',
          },
        ])
      ).toEqual([]);
    });

    it('rejects a similarly-prefixed sibling of the exact-file exemption — scripts/sync-talacms.tsx is not scripts/sync-talacms.ts', () => {
      // `scripts/sync-talacms.ts` is exempted from rule 2 by exact match, not
      // prefix — a `startsWith` check would also exempt this sibling file,
      // letting it reference a TalaCMS host without tripping rule 2. Uses a
      // hostname reference (not TALACMS_*) so rule 1's separate, always-exact
      // TALACMS_ALLOWLIST can't mask the bug this test targets.
      expect(
        findViolations([
          {
            path: 'scripts/sync-talacms.tsx',
            code: "fetch('https://x.talacms.com/cda');",
          },
        ])
      ).toEqual([
        'scripts/sync-talacms.tsx: references TalaCMS outside scripts/talacms/',
      ]);
    });
  });
});
