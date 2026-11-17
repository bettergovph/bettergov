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

  it('names BETTERGOV.PH’s own pages "Page"', () => {
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

describe('resolveHitLink for index entries without a URL', () => {
  it('opens an agency website, adding https:// when the index omits it', () => {
    expect(
      resolveHitLink({ type: 'website', website: 'www.ched.gov.ph' })
    ).toEqual({ href: 'https://www.ched.gov.ph', external: true });
    expect(
      resolveHitLink({ type: 'website', website: 'http://example.gov.ph' })
    ).toEqual({ href: 'http://example.gov.ph', external: true });
  });

  it('filters the members list to a legislator’s surname', () => {
    expect(
      resolveHitLink({
        type: 'directory_item',
        name: 'ABANTE, BIENVENIDO M., JR.',
        district: '6th District',
      }).href
    ).toBe('/government/legislative/house-members?q=Abante');
    expect(
      resolveHitLink({
        type: 'directory_item',
        name: 'DE LA CRUZ-ABAD, MARIA',
        party_list: 'SAMPLE',
      }).href
    ).toBe('/government/legislative/party-list-members?q=De%20La%20Cruz-Abad');
  });

  it('links chambers and office types to their BETTERGOV.PH pages', () => {
    const page = (hit: Record<string, unknown>) =>
      resolveHitLink({ type: 'directory_item', ...hit });
    expect(
      page({
        slug: 'senate-of-the-philippines-20th-congress',
        chamber: 'Senate',
      })
    ).toEqual({
      href: '/government/legislative/senate-of-the-philippines-20th-congress',
      external: false,
    });
    expect(
      page({
        office_type: 'Government-Owned And/Or -Controlled Corporations (GOCCs)',
      }).href
    ).toBe('/government/constitutional/goccs');
    expect(
      page({ office_type: 'State Universities and Colleges (SUCs)' }).href
    ).toBe('/government/constitutional/sucs');
  });

  it('prefers the directory page withSitePages found, and never links nowhere', () => {
    expect(
      resolveHitLink({
        type: 'website',
        siteUrl: '/government/departments/department-of-migrant-workers',
      }).href
    ).toBe('/government/departments/department-of-migrant-workers');
    expect(resolveHitLink({ type: 'website', name: 'Unknown office' })).toEqual(
      {
        href: '/government',
        external: false,
      }
    );
  });
});
