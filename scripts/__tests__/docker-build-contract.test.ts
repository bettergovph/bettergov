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

const instructions = dockerfile
  .split('\n')
  .filter(line => !/^\s*#/.test(line))
  .join('\n');

describe('Dockerfile — no stage depends on TalaCMS', () => {
  it('never mounts, declares or exports TalaCMS credentials', () => {
    expect(instructions).not.toMatch(/talacms/i);
    expect(instructions).not.toMatch(/--mount=type=secret/);
  });

  it('never runs the CMS fetch — the data is committed', () => {
    expect(instructions).not.toContain('cms:fetch');
    expect(instructions).not.toContain('sync:talacms');
  });
});

describe('Dockerfile — deployable `builder` stage', () => {
  it('runs the full production build as its only RUN instruction', () => {
    const builder = stageBlock('builder');
    expect(builder.match(/^RUN .*$/gm)).toEqual(['RUN npm run build']);
  });
});

describe('Dockerfile — CI `build-app` stage', () => {
  const buildApp = stageBlock('build-app');

  it('runs only the build:app command', () => {
    expect(buildApp).toMatch(/npm run build:app/);
    expect(buildApp).not.toMatch(/npm run build\b(?!:app)/);
  });
});

describe('Dockerfile — production runtime image', () => {
  it('only copies the built dist output from `builder`', () => {
    const production = stageBlock('production');
    expect(production).toMatch(/COPY --from=builder \/app\/dist/);
    expect(production).not.toMatch(/RUN /);
  });
});
