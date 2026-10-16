import type { SearchClient } from 'instantsearch.js';
import type { SitePage } from './sitePages';

/**
 * Site search merges GOV.PH's own pages (see sitePages.ts) into the
 * Meilisearch results, client-side: the index only holds services, agency
 * websites and legislators, so a search for "hotlines" or "passport guide"
 * found nothing on this site itself.
 *
 * Matching pages come first, then the index's results, paginated as one
 * list. With no query, the default browse listing stays the index's own,
 * unless the Type filter selects a type that site pages have.
 */

const INDEX_NAME = 'bettergov';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'mga',
  'ng',
  'sa',
]);

/** Name matches count most; a word only in the description, least. */
const FIELDS = [
  ['name', 4],
  ['keywords', 3],
  ['section', 1],
  ['description', 1],
] as const;

const TYPE_ORDER: Record<SitePage['type'], number> = {
  page: 0,
  guide: 1,
  directory_item: 2,
};

const WORD = /[\p{L}\p{N}]+/gu;

/** Lowercase without diacritics, one output character per input letter. */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const words = (s: string | undefined) => (s ? (fold(s).match(WORD) ?? []) : []);

export function queryTerms(query: string): string[] {
  const terms = words(query);
  const meaningful = terms.filter(t => !STOP_WORDS.has(t));
  return meaningful.length ? meaningful : terms;
}

/**
 * How many leading characters of `word` the term matches, or 0. A term
 * matches the words it begins ("weath" → weather), and a plural term
 * matches its singular ("hotlines" → hotline).
 */
function matchLength(term: string, word: string): number {
  if (word.startsWith(term)) return term.length;
  if (term.length > 3 && term.endsWith('s')) {
    const singular = term.slice(0, -1);
    if (word === singular) return singular.length;
  }
  return 0;
}

type Indexed = { page: SitePage; fields: [string[], number][] };

const prepare = (pages: SitePage[]): Indexed[] =>
  pages.map(page => ({
    page,
    fields: FIELDS.map(([key, weight]) => [words(page[key]), weight]),
  }));

function rank(indexed: Indexed[], terms: string[]): SitePage[] {
  const scored: { page: SitePage; score: number }[] = [];
  for (const { page, fields } of indexed) {
    let score = 0;
    for (const term of terms) {
      let best = 0;
      for (const [fieldWords, weight] of fields) {
        for (const word of fieldWords) {
          const len = matchLength(term, word);
          // A whole-word match edges out a prefix match of the same field.
          if (len)
            best = Math.max(best, len === word.length ? weight + 0.5 : weight);
        }
      }
      if (!best) {
        score = 0;
        break;
      }
      score += best;
    }
    if (score) scored.push({ page, score });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        TYPE_ORDER[a.page.type] - TYPE_ORDER[b.page.type] ||
        a.page.name.length - b.page.name.length ||
        a.page.name.localeCompare(b.page.name)
    )
    .map(s => s.page);
}

/** Pages matching every meaningful word of the query, best first. */
export function matchSitePages(query: string, pages: SitePage[]): SitePage[] {
  const terms = queryTerms(query);
  return terms.length ? rank(prepare(pages), terms) : [];
}

/**
 * The text with each matched word prefix wrapped in the highlight tags, in
 * the shape InstantSearch's Highlight and Snippet widgets read. The text
 * stays unescaped: InstantSearch escapes hits itself.
 */
export function highlightText(
  text: string,
  terms: string[],
  preTag: string,
  postTag: string
) {
  const matchedWords = new Set<string>();
  let value = '';
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const word = m[0];
    const folded = fold(word);
    const term = terms.find(t => matchLength(t, folded));
    if (!term) continue;
    matchedWords.add(term);
    // Map the folded prefix length back onto the original characters, which
    // may include combining marks that fold() drops.
    let foldedCount = 0;
    let cut = 0;
    const target = matchLength(term, folded);
    while (cut < word.length && foldedCount < target) {
      foldedCount += fold(word[cut]).length;
      cut += 1;
    }
    const start = m.index ?? 0;
    value +=
      text.slice(last, start) +
      preTag +
      word.slice(0, cut) +
      postTag +
      word.slice(cut);
    last = start + word.length;
  }
  value += text.slice(last);
  const matchLevel =
    matchedWords.size === 0
      ? 'none'
      : matchedWords.size === terms.length
        ? 'full'
        : 'partial';
  return { value, matchLevel, matchedWords: [...matchedWords] };
}

/* -------------------------------------------------------------------------- */
/*  Search client wrapper                                                      */
/* -------------------------------------------------------------------------- */

type Params = Record<string, unknown>;
type Request = { indexName: string; params?: Params };
type Hit = Record<string, unknown>;
type Result = {
  hits: Hit[];
  nbHits: number;
  facets?: Record<string, Record<string, number>>;
  [key: string]: unknown;
};
type MultiSearch = (requests: Request[]) => Promise<{ results: Result[] }>;

type FacetTest = { attribute: string; value: string };

/** InstantSearch's facetFilters as AND-ed groups of OR-ed attribute:value. */
function facetGroups(facetFilters: unknown): FacetTest[][] {
  const list = Array.isArray(facetFilters)
    ? facetFilters
    : facetFilters
      ? [facetFilters]
      : [];
  return list.map(group =>
    (Array.isArray(group) ? group : [group]).map(entry => {
      const text = String(entry);
      const at = text.indexOf(':');
      return { attribute: text.slice(0, at), value: text.slice(at + 1) };
    })
  );
}

const passes = (page: SitePage, groups: FacetTest[][]) =>
  groups.every(group =>
    group.some(
      ({ attribute, value }) =>
        (page as unknown as Record<string, unknown>)[attribute] === value
    )
  );

const integer = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : fallback;

function withLocalTypeCounts(
  facets: Result['facets'],
  requested: unknown,
  pages: SitePage[]
): Result['facets'] {
  const wanted = Array.isArray(requested) ? requested : [requested];
  if (!wanted.includes('type') && !wanted.includes('*')) return facets;
  const type = { ...(facets?.type ?? {}) };
  for (const page of pages) type[page.type] = (type[page.type] ?? 0) + 1;
  return { ...facets, type };
}

/**
 * `loadPages` runs on the first search, not at import: every page module
 * is imported at startup, and most visits never search.
 */
export function withSitePages(
  client: SearchClient,
  loadPages: () => SitePage[]
): SearchClient {
  let site:
    | {
        pages: SitePage[];
        indexed: Indexed[];
        siteTypes: Set<string>;
        directorySlugs: Set<string | undefined>;
      }
    | undefined;
  const load = () => {
    if (!site) {
      const pages = loadPages();
      site = {
        pages,
        indexed: prepare(pages),
        siteTypes: new Set(pages.map(p => p.type)),
        directorySlugs: new Set(
          pages.filter(p => p.type === 'directory_item').map(p => p.slug)
        ),
      };
    }
    return site;
  };
  const remoteSearch = (client.search as unknown as MultiSearch).bind(client);

  async function search(requests: Request[]) {
    const plans = requests.map(request => planRequest(request));
    const remote = plans.flatMap(plan => plan.remote);
    const { results } = remote.length
      ? await remoteSearch(remote)
      : { results: [] as Result[] };
    let next = 0;
    return {
      results: plans.map(plan => {
        const own = results.slice(next, next + plan.remote.length);
        next += plan.remote.length;
        return plan.build(own);
      }),
    };
  }

  function planRequest(request: Request): {
    remote: Request[];
    build: (results: Result[]) => Result;
  } {
    if (request.indexName !== INDEX_NAME) {
      return { remote: [request], build: ([result]) => result };
    }
    const { pages, indexed, siteTypes, directorySlugs } = load();
    const params = request.params ?? {};
    const query = String(params.query ?? '').trim();
    const terms = queryTerms(query);
    const groups = facetGroups(params.facetFilters);
    const pool = query ? (terms.length ? rank(indexed, terms) : []) : pages;
    const matching = pool.filter(page => passes(page, groups));
    const typeGroup = groups.find(group =>
      group.every(test => test.attribute === 'type')
    );
    // The browse listing (no query) stays the index's own unless the Type
    // filter asks for something site pages have.
    const listed =
      query || typeGroup?.some(test => siteTypes.has(test.value))
        ? matching
        : [];
    const facets = (result: Result) =>
      withLocalTypeCounts(result.facets, params.facets, matching);

    const hitsPerPage = integer(params.hitsPerPage, 20);
    if (hitsPerPage === 0) {
      return {
        remote: [request],
        build: ([result]) => ({ ...result, facets: facets(result) }),
      };
    }

    // One list: site pages first, then the index. Work out which slice of
    // the index this page needs and which index pages contain it.
    const page = integer(params.page, 0);
    const start = page * hitsPerPage;
    const local = listed.slice(start, start + hitsPerPage);
    const need = hitsPerPage - local.length;
    const remoteStart = Math.max(0, start - listed.length);
    const first = Math.floor(remoteStart / hitsPerPage);
    const last = need
      ? Math.floor((remoteStart + need - 1) / hitsPerPage)
      : first;
    const remote: Request[] = need
      ? Array.from({ length: last - first + 1 }, (_, i) => ({
          ...request,
          params: { ...params, page: first + i },
        }))
      : // Only the total and facets are needed from the index.
        [{ ...request, params: { ...params, page: 0, hitsPerPage: 0 } }];

    const preTag = String(params.highlightPreTag ?? '__ais-highlight__');
    const postTag = String(params.highlightPostTag ?? '__/ais-highlight__');
    const toHit = (site: SitePage): Hit => {
      const name = highlightText(site.name, terms, preTag, postTag);
      const description = site.description
        ? highlightText(site.description, terms, preTag, postTag)
        : undefined;
      return {
        objectID: site.objectID,
        type: site.type,
        name: site.name,
        description: site.description,
        url: site.url,
        section: site.section,
        slug: site.slug,
        _highlightResult: description ? { name, description } : { name },
        ...(description ? { _snippetResult: { description } } : {}),
      };
    };

    return {
      remote,
      build: results => {
        const offset = remoteStart - first * hitsPerPage;
        const remoteHits = need
          ? results
              .flatMap(r => r.hits)
              .slice(offset, offset + need)
              // A directory entry the site already lists (a chamber, a
              // GOCC) would otherwise appear twice.
              .filter(
                hit =>
                  !(
                    hit.type === 'directory_item' &&
                    directorySlugs.has(hit.slug as string)
                  )
              )
          : [];
        const nbHits = listed.length + (results[0]?.nbHits ?? 0);
        return {
          ...results[0],
          hits: [...local.map(toHit), ...remoteHits],
          nbHits,
          page,
          hitsPerPage,
          nbPages: Math.ceil(nbHits / hitsPerPage),
          facets: facets(results[0]),
        };
      },
    };
  }

  return { ...client, search } as unknown as SearchClient;
}
