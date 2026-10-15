import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import executiveOffices from '../executive.json';
import { executiveHeads } from '../executive-heads';

const heads = Object.values(executiveHeads);

describe('executive heads', () => {
  it.each(heads)('$slug cites only sources that exist', head => {
    const cites = [
      head.ledeCite,
      ...head.keyFacts.map(f => f.cite),
      ...head.role.map(r => r.cite),
      ...head.profile.map(f => f.cite),
      ...head.career.map(c => c.cite),
    ].flat();
    for (const n of cites) {
      expect(Number.isInteger(n) && n >= 1 && n <= head.sources.length).toBe(
        true
      );
    }
    // Every source is cited at least once.
    expect(new Set(cites).size).toBe(head.sources.length);
  });

  it.each(heads)('$slug lists each source URL once', head => {
    const urls = head.sources.map(s => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it.each(heads)('$slug links to an existing office directory', head => {
    expect(executiveOffices.map(o => o.slug)).toContain(head.officeSlug);
  });

  it.each(heads)('$slug portrait files are in public/', head => {
    for (const src of [head.portrait.src, head.portrait.thumb]) {
      expect(existsSync(path.join(process.cwd(), 'public', src))).toBe(true);
    }
  });

  it('pairs the President and Vice President with each other', () => {
    expect(executiveHeads.president.counterpart).toBe('vice-president');
    expect(executiveHeads['vice-president'].counterpart).toBe('president');
  });
});
