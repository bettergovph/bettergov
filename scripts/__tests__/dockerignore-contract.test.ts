import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal glob matcher covering just the pattern shapes this file's rules
 * actually use (`name`, `name.*`, `!name`) — enough to prove the ignore
 * rules exclude/allow the right files without shelling out to Docker's own
 * matcher or snapshotting the whole file.
 */
function matches(pattern: string, file: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const re = new RegExp(`^${escaped}$`);
  return re.test(file);
}

/** Docker evaluates `.dockerignore` rules in file order; last match wins. */
function isIgnored(rules: string[], file: string): boolean {
  let ignored = false;
  for (const raw of rules) {
    const rule = raw.trim();
    if (!rule || rule.startsWith('#')) continue;
    if (rule.startsWith('!')) {
      if (matches(rule.slice(1), file)) ignored = false;
    } else if (matches(rule, file)) {
      ignored = true;
    }
  }
  return ignored;
}

const rules = fs
  .readFileSync(path.join(process.cwd(), '.dockerignore'), 'utf8')
  .split('\n');

describe('.dockerignore — credential files never enter the Docker build context', () => {
  it.each([
    '.dev.vars',
    '.dev.vars.production',
    '.dev.vars.staging',
    '.dev.vars.local',
    '.env',
    '.env.local',
    '.env.production',
  ])('excludes %s', file => {
    expect(isIgnored(rules, file)).toBe(true);
  });

  it('still allows the tracked .env.example template through', () => {
    expect(isIgnored(rules, '.env.example')).toBe(false);
  });
});
