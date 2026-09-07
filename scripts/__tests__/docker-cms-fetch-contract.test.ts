import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const dockerfile = fs.readFileSync(
  path.join(process.cwd(), 'Dockerfile'),
  'utf8'
);

/**
 * Isolates one `FROM ... AS <name>` stage's instructions, up to (not
 * including) the next `FROM` line or end of file — comment-only lines
 * stripped, since a prose comment mentioning a command name (e.g. this
 * stage's own doc comment describing the *next* stage) must never satisfy
 * or fail an assertion meant for actual instructions. A focused structural
 * assertion on just this block is far less brittle than snapshotting the
 * whole Dockerfile, while still failing if the stage's real behavior
 * regresses.
 */
function stageBlock(name: string): string {
  const lines = dockerfile.split('\n');
  let current: string | null = null;
  const stages = new Map<string, string[]>();
  for (const line of lines) {
    const fromMatch = line.match(/^FROM\s+\S+(?:\s+AS\s+(\S+))?/i);
    if (fromMatch) {
      current = fromMatch[1] ?? null;
      if (current) stages.set(current, []);
      continue;
    }
    if (current && !/^\s*#/.test(line)) {
      stages.get(current)!.push(line);
    }
  }
  const found = stages.get(name);
  if (!found) throw new Error(`stage "${name}" not found in Dockerfile`);
  return found.join('\n');
}

describe('Dockerfile — deployable `builder` stage CMS-fetch contract', () => {
  const builder = stageBlock('builder');

  it('requires the TalaCMS URL and token as BuildKit secrets, not ARG/ENV', () => {
    expect(builder).toMatch(
      /--mount=type=secret,id=talacms_api_url,required=true/
    );
    expect(builder).toMatch(
      /--mount=type=secret,id=talacms_api_token,required=true/
    );
    // No credential ever assigned via a baked ARG/ENV instruction.
    expect(builder).not.toMatch(/^\s*(ARG|ENV)\s+TALACMS_/m);
  });

  it('runs cms:fetch strictly before build, chained with && so a failure is fail-fast', () => {
    const fetchIndex = builder.indexOf('npm run cms:fetch');
    const buildIndex = builder.indexOf('npm run build');
    expect(fetchIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeGreaterThan(fetchIndex);

    // Everything between the two commands must be `&&` (and line
    // continuations), never `;` or `||` — a `;`-joined chain would run
    // `build` even after `cms:fetch` failed, defeating the fail-closed
    // contract this Dockerfile depends on.
    const between = builder.slice(
      fetchIndex + 'npm run cms:fetch'.length,
      buildIndex
    );
    expect(between).toMatch(/^\s*&&\s*(?:\\\s*\n\s*)?$/);
  });

  it('is a single RUN instruction — the secret mount only covers this one step', () => {
    expect(builder.match(/^RUN /gm)?.length).toBe(1);
  });

  it('wires each mounted secret file to its correspondingly-named env var — not removed, swapped, or mistyped', () => {
    // Each assertion pins the exact secret-file -> env-var pairing
    // scripts/talacms/client.ts reads (TALACMS_API_URL, TALACMS_API_TOKEN).
    // Removing an export, swapping which file feeds which var, or using the
    // wrong variable name all fail this without needing a full-file diff.
    expect(builder).toMatch(
      /export\s+TALACMS_API_URL="\$\(cat \/run\/secrets\/talacms_api_url\)"/
    );
    expect(builder).toMatch(
      /export\s+TALACMS_API_TOKEN="\$\(cat \/run\/secrets\/talacms_api_token\)"/
    );

    // Explicit swap check: the url secret must never feed the token var,
    // and vice versa — a pure "both pairings exist somewhere" check above
    // would not catch a transposition between the two `export` lines.
    expect(builder).not.toMatch(
      /TALACMS_API_TOKEN="\$\(cat \/run\/secrets\/talacms_api_url\)"/
    );
    expect(builder).not.toMatch(
      /TALACMS_API_URL="\$\(cat \/run\/secrets\/talacms_api_token\)"/
    );
  });
});

describe('Dockerfile — secret-free `build-app` stage stays isolated from the CMS secrets', () => {
  const buildApp = stageBlock('build-app');

  it('never mounts or references the TalaCMS secrets', () => {
    expect(buildApp).not.toContain('talacms_api_url');
    expect(buildApp).not.toContain('talacms_api_token');
    expect(buildApp).not.toContain('cms:fetch');
  });

  it('runs only the secret-free build:app command', () => {
    expect(buildApp).toMatch(/npm run build:app/);
    expect(buildApp).not.toMatch(/npm run build\b(?!:app)/);
  });
});

describe('Dockerfile — production runtime image never touches the builder secrets', () => {
  it('only copies the built dist output from `builder`, nothing secret-scoped', () => {
    const production = stageBlock('production');
    expect(production).toMatch(/COPY --from=builder \/app\/dist/);
    expect(production).not.toContain('talacms');
    expect(production).not.toMatch(/RUN /);
  });
});
