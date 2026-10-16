import { describe, expect, it } from 'vitest';
import {
  resolveHitLink,
  typeFacetLabel,
  typeFlagLabel,
} from '../searchResults';

describe('search type labels', () => {
  it('names the sidebar types Website, Directory, Service and Guides', () => {
    expect(
      ['website', 'directory_item', 'service', 'guide'].map(typeFacetLabel)
    ).toEqual(['Website', 'Directory', 'Service', 'Guides']);
  });

  it('names GOV.PH’s own pages "Page"', () => {
    expect(typeFacetLabel('page')).toBe('Page');
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

describe('resolveHitLink', () => {
  it('opens a page on this site in place', () => {
    expect(resolveHitLink({ url: '/data/weather' })).toEqual({
      href: '/data/weather',
      external: false,
    });
  });

  it('opens a service on the agency’s own site in a new tab', () => {
    expect(
      resolveHitLink({
        type: 'service',
        url: 'https://www.pagasa.dost.gov.ph/',
      })
    ).toEqual({ href: 'https://www.pagasa.dost.gov.ph/', external: true });
  });
});
