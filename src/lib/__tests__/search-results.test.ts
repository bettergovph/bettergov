import { describe, expect, it } from 'vitest';
import { typeFacetLabel, typeFlagLabel } from '../searchResults';

describe('search type labels', () => {
  it('names the sidebar types Website, Directory, Service and Guides', () => {
    expect(
      ['website', 'directory_item', 'service', 'guide'].map(typeFacetLabel)
    ).toEqual(['Website', 'Directory', 'Service', 'Guides']);
  });

  it('uses the singular on a single result', () => {
    expect(typeFlagLabel('guide')).toBe('Guide');
    expect(typeFlagLabel('directory_item')).toBe('Directory');
  });

  it('humanizes a type it has no name for instead of showing the raw key', () => {
    expect(typeFacetLabel('flood_control_project')).toBe(
      'Flood control project'
    );
  });
});
