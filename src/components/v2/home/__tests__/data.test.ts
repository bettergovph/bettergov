import { describe, expect, it } from 'vitest';
import { findGuide } from '../../../../pages/guides/data';
import { ALSO_TRENDING, FEATURED_TRENDING } from '../data';

describe('home "Most requested" cards', () => {
  it('link only to guides that exist', () => {
    const ids = [
      'passport', // the featured story
      ...[...FEATURED_TRENDING, ...ALSO_TRENDING].flatMap(s =>
        s.guide ? [s.guide] : []
      ),
    ];
    expect(ids.length).toBe(8);
    for (const id of ids) expect(findGuide(id), id).toBeDefined();
  });
});
