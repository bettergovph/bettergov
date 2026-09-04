import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Service } from '../../types';

const DIR = path.join(process.cwd(), 'src/data/services');
const fileNames = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));

/** The exact mechanism src/pages/services/index.tsx uses. */
const globbed = import.meta.glob<{ default: Service[] }>('../services/*.json', {
  eager: true,
});

const globOrder = Object.entries(globbed)
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .flatMap(([, m]) => m.default);

/** An independent second mechanism, so this is a comparison, not a tautology. */
const fsOrder = [...fileNames]
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  .flatMap(
    f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Service[]
  );

describe('/services record order', () => {
  it('globs every committed service file', () => {
    expect(Object.keys(globbed)).toHaveLength(fileNames.length);
  });

  it('matches codepoint filename order over the COMPLETE id sequence', () => {
    // Endpoints alone would miss a middle-file reordering.
    expect(globOrder.map(s => s.id)).toEqual(fsOrder.map(s => s.id));
    expect(globOrder).toHaveLength(194);
  });

  it('sorts by codepoint, not locale — and the sort is not a no-op', () => {
    // Bite test: `localeCompare` is locale-sensitive about `-`, which would
    // make render order depend on the build environment.
    const paths = [
      '../services/transport-driving.json',
      '../services/tax.json',
      '../services/uncategorized.json',
    ];
    expect([...paths].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))).toEqual([
      '../services/tax.json',
      '../services/transport-driving.json',
      '../services/uncategorized.json',
    ]);
  });

  it('filters nothing out — every committed record is present', () => {
    expect(globOrder).toHaveLength(fsOrder.length);
  });
});
