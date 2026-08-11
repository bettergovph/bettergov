import { describe, expect, it } from 'vitest';
import { ENTRY_POINTS, INTRO, linkKind } from '../entryPoints';

/**
 * The page's promise is "every way in, easiest first". These invariants are
 * that promise, expressed as tests: the order is the content, so it cannot be
 * left to whoever edits the array next.
 */
describe('linkKind', () => {
  it('classifies a site-relative path as internal', () => {
    expect(linkKind('/discord')).toBe('internal');
  });

  it('classifies a mailto: href as email', () => {
    expect(linkKind('mailto:volunteers@bettergov.ph')).toBe('email');
  });

  it('classifies an absolute URL as external', () => {
    expect(linkKind('https://github.com/bettergovph/bettergov')).toBe(
      'external'
    );
  });
});

describe('ENTRY_POINTS', () => {
  it('is ordered by commitment, lowest first', () => {
    const commitments = ENTRY_POINTS.map(entry => entry.commitment);

    expect(commitments).toEqual([...commitments].sort((a, b) => a - b));
  });

  it('has a unique id per entry', () => {
    const ids = ENTRY_POINTS.map(entry => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('routes every action somewhere resolvable', () => {
    for (const entry of ENTRY_POINTS) {
      expect(linkKind(entry.href), entry.id).toBeDefined();
      if (entry.alt) expect(linkKind(entry.alt.href), entry.id).toBeDefined();
    }
  });

  it('offers the volunteers mailing address as its own entry point', () => {
    const email = ENTRY_POINTS.find(
      entry => entry.href === 'mailto:volunteers@bettergov.ph'
    );

    expect(email).toBeDefined();
  });

  it('carries no em dashes in copy the reader sees', () => {
    const copy = [
      INTRO.eyebrow,
      INTRO.heading,
      INTRO.standfirst,
      ...ENTRY_POINTS.flatMap(entry => [
        entry.modeLabel,
        entry.who,
        entry.action,
        entry.note ?? '',
        entry.alt?.action ?? '',
      ]),
    ].join(' ');

    expect(copy).not.toContain('—');
  });
});
