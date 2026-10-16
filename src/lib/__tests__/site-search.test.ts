import { describe, expect, it, vi } from 'vitest';
import type { SearchClient } from 'instantsearch.js';
import { buildSitePages, type SitePage } from '../sitePages';
import { highlightText, matchSitePages, withSitePages } from '../siteSearch';

const PRE = '__ais-highlight__';
const POST = '__/ais-highlight__';

const page = (
  name: string,
  url: string,
  type: SitePage['type'] = 'page',
  extra: Partial<SitePage> = {}
): SitePage => ({ objectID: `${type}:${url}`, type, name, url, ...extra });

describe('matchSitePages', () => {
  const pages = [
    page('Hotlines', '/philippines/hotlines'),
    page('Weather', '/data/weather', 'page', {
      description: 'Live conditions from PAGASA.',
    }),
    page('Disaster and Weather', '/services?category=disaster-weather'),
    page(
      'Department of Education',
      '/government/departments/deped',
      'directory_item',
      {
        keywords: 'DepEd',
      }
    ),
    page('Parañaque City', '/government/local/ncr'),
  ];
  const names = (query: string) =>
    matchSitePages(query, pages).map(p => p.name);

  it('requires every meaningful word and puts the closest name first', () => {
    expect(names('weather')).toEqual(['Weather', 'Disaster and Weather']);
    expect(names('weather pagasa')).toEqual(['Weather']);
    expect(names('department of education')).toEqual([
      'Department of Education',
    ]);
  });

  it('matches word prefixes, plurals, acronyms and unaccented spellings', () => {
    expect(names('weath')).toContain('Weather');
    expect(names('hotlines')).toEqual(['Hotlines']);
    expect(names('deped')).toEqual(['Department of Education']);
    expect(names('paranaque')).toEqual(['Parañaque City']);
  });

  it('matches nothing for an empty or punctuation-only query', () => {
    expect(names('')).toEqual([]);
    expect(names(' — ')).toEqual([]);
  });
});

describe('highlightText', () => {
  it('wraps the matched part of each word, keeping the original spelling', () => {
    expect(highlightText('Parañaque City', ['parana'], PRE, POST)).toEqual({
      value: `${PRE}Paraña${POST}que City`,
      matchLevel: 'full',
      matchedWords: ['parana'],
    });
  });

  it('reports a partial match when only some words are found', () => {
    const result = highlightText('Hotlines', ['hotline', 'manila'], PRE, POST);
    expect(result.value).toBe(`${PRE}Hotline${POST}s`);
    expect(result.matchLevel).toBe('partial');
  });
});

/* -------------------------------------------------------------------------- */

type Req = { indexName: string; params?: Record<string, unknown> };

/** A stand-in for the Meilisearch index: 10 services, paged like the real one. */
function fakeIndex(
  docs = Array.from({ length: 10 }, (_, i) => ({
    objectID: `svc-${i}`,
    type: 'service',
    slug: `svc-${i}`,
  })) as Record<string, unknown>[]
) {
  const search = vi.fn(async (requests: Req[]) => ({
    results: requests.map(({ params = {} }) => {
      const groups = (params.facetFilters as string[][] | undefined) ?? [];
      const matching = docs.filter(doc =>
        groups.every(group =>
          group.some(entry => {
            const [attribute, value] = entry.split(':');
            return doc[attribute] === value;
          })
        )
      );
      const hitsPerPage = (params.hitsPerPage as number | undefined) ?? 20;
      const pageNo = (params.page as number | undefined) ?? 0;
      const type: Record<string, number> = {};
      for (const doc of matching) {
        type[doc.type as string] = (type[doc.type as string] ?? 0) + 1;
      }
      return {
        hits: matching.slice(pageNo * hitsPerPage, (pageNo + 1) * hitsPerPage),
        nbHits: matching.length,
        page: pageNo,
        hitsPerPage,
        facets: { type },
      };
    }),
  }));
  return { search, client: { search } as unknown as SearchClient };
}

const sitePages = [
  page('Weather', '/data/weather'),
  page('Weather guide', '/guides/weather', 'guide'),
  page(
    'Senate of the Philippines',
    '/government/legislative/senate',
    'directory_item',
    {
      slug: 'senate',
    }
  ),
];

async function run(
  client: SearchClient,
  params: Record<string, unknown>,
  indexName = 'bettergov'
) {
  const { results } = await (
    client.search as unknown as (
      r: Req[]
    ) => Promise<{ results: Record<string, unknown>[] }>
  )([{ indexName, params }]);
  return results[0] as {
    hits: Record<string, unknown>[];
    nbHits: number;
    nbPages: number;
    page: number;
    facets: { type: Record<string, number> };
  };
}

const ids = (hits: Record<string, unknown>[]) => hits.map(h => h.objectID);

describe('withSitePages', () => {
  it('lists matching site pages first, then the index, as one paged list', async () => {
    const index = fakeIndex();
    const client = withSitePages(index.client, () => sitePages);
    const params = { query: 'weather', hitsPerPage: 3, facets: ['type'] };

    const first = await run(client, { ...params, page: 0 });
    expect(ids(first.hits)).toEqual([
      'page:/data/weather',
      'guide:/guides/weather',
      'svc-0',
    ]);
    expect(first.nbHits).toBe(12);
    expect(first.nbPages).toBe(4);

    // Page 2 starts one index hit in, which straddles index pages 1 and 2.
    const second = await run(client, { ...params, page: 1 });
    expect(ids(second.hits)).toEqual(['svc-1', 'svc-2', 'svc-3']);
    expect(
      index.search.mock.calls.at(-1)?.[0].map(r => r.params?.page)
    ).toEqual([0, 1]);
  });

  it('highlights site pages with the request’s tags', async () => {
    const client = withSitePages(fakeIndex().client, () => sitePages);
    const { hits } = await run(client, {
      query: 'weath',
      highlightPreTag: PRE,
      highlightPostTag: POST,
    });
    expect(hits[0]._highlightResult).toEqual({
      name: {
        value: `${PRE}Weath${POST}er`,
        matchLevel: 'full',
        matchedWords: ['weath'],
      },
    });
  });

  it('adds site pages to the Type counts but keeps the no-query listing the index’s own', async () => {
    const client = withSitePages(fakeIndex().client, () => sitePages);
    const browse = await run(client, { query: '', facets: ['type'] });
    expect(ids(browse.hits)).toHaveLength(10);
    expect(browse.hits.every(h => h.type === 'service')).toBe(true);
    expect(browse.facets.type).toEqual({
      service: 10,
      page: 1,
      guide: 1,
      directory_item: 1,
    });
  });

  it('lists only site pages when the Type filter selects their type', async () => {
    const client = withSitePages(fakeIndex().client, () => sitePages);
    const guides = await run(client, {
      query: '',
      facetFilters: [['type:guide']],
    });
    expect(ids(guides.hits)).toEqual(['guide:/guides/weather']);
    expect(guides.nbHits).toBe(1);
  });

  it('leaves site pages out when a filter they cannot satisfy is on', async () => {
    const client = withSitePages(fakeIndex().client, () => sitePages);
    const filtered = await run(client, {
      query: 'weather',
      facetFilters: [['category.name:Health']],
    });
    expect(filtered.hits).toEqual([]);
  });

  it('drops an index directory entry the site already lists', async () => {
    const index = fakeIndex([
      { objectID: 'senate', type: 'directory_item', slug: 'senate' },
      { objectID: 'house', type: 'directory_item', slug: 'house' },
    ]);
    const client = withSitePages(index.client, () => sitePages);
    const { hits } = await run(client, { query: 'senate' });
    expect(ids(hits)).toEqual([
      'directory_item:/government/legislative/senate',
      'house',
    ]);
  });

  it('passes other indexes through untouched', async () => {
    const index = fakeIndex();
    const client = withSitePages(index.client, () => sitePages);
    const result = await run(client, { query: 'weather' }, 'contractors');
    expect(ids(result.hits)).toHaveLength(10);
    expect(index.search).toHaveBeenCalledWith([
      { indexName: 'contractors', params: { query: 'weather' } },
    ]);
  });
});

describe('buildSitePages', () => {
  const pages = buildSitePages();
  const top = (query: string) => matchSitePages(query, pages)[0]?.url;

  it('has one entry per object ID and per page URL', () => {
    expect(new Set(pages.map(p => p.objectID)).size).toBe(pages.length);
    const urls = pages.filter(p => p.type === 'page').map(p => p.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('finds the pages people search for by name', () => {
    expect(top('weather')).toBe('/data/weather');
    expect(top('hotlines')).toBe('/philippines/hotlines');
    expect(top('deped')).toBe(
      '/government/departments/department-of-education'
    );
    expect(matchSitePages('passport', pages).map(p => p.url)).toContain(
      '/guides/passport'
    );
  });

  it('links only to paths on this site', () => {
    expect(pages.every(p => p.url.startsWith('/'))).toBe(true);
  });
});
