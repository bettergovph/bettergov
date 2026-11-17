import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildNewsListUrl,
  fetchNewsArticle,
  fetchNewsList,
  formatNewsDate,
  getNewsCategory,
  getNewsCategoryBySlug,
  htmlToExcerpt,
  parseEgovDate,
  readingMinutes,
  sanitizeNewsHtml,
} from '../news';

const listResponse = {
  status: 200,
  message: 'OK',
  data: {
    news: [
      {
        id: 6078,
        description: 'Gov’t offices in NCR to implement alternative work',
        image: 'https://egov-cdn.e.gov.ph/file/core_assets/x.jpeg',
        category_id: 1,
        redirect_url: 'https://e.gov.ph/news',
        author: 'PCO',
        avatar: 'https://egov-cdn.e.gov.ph/file/core_assets/a.jpeg',
        publisher: {
          id: 1,
          name: 'PCO',
          photo: 'https://egov-cdn.e.gov.ph/file/core_assets/a.jpeg',
        },
        featured: 0,
        video_url: null,
        publish_date: 'Aug 14, 2026 12:00:00 AM',
        created_at: 'Aug 14, 2026 04:51:05 PM',
        date_diff_human: '3 days ago',
      },
      {
        id: 6077,
        description: 'Memorandum Circular No. 126 s. 2026',
        image: null,
        category_id: 6,
        redirect_url: null,
        author: 'PCO',
        avatar: null,
        publisher: null,
        featured: 1,
        video_url: null,
        publish_date: 'Aug 14, 2026 12:00:00 AM',
        created_at: 'Aug 14, 2026 04:50:16 PM',
        date_diff_human: '3 days ago',
      },
    ],
    meta: {
      pagination: {
        total: 6040,
        count: 2,
        per_page: 12,
        current_page: 1,
        total_pages: 504,
      },
    },
  },
};

const mockFetchOnce = (body: unknown, ok = true, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    })
  );
};

describe('news.ts', () => {
  beforeEach(() => {
    // fetchWithCache memoises by URL, so every test needs a distinct one.
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getNewsCategory', () => {
    it('maps the confirmed category ids', () => {
      expect(getNewsCategory(1).label).toBe('News');
      expect(getNewsCategory(6).label).toBe('Circular');
    });

    it('falls back for ids the API has not documented', () => {
      expect(getNewsCategory(99)).toEqual({
        id: 99,
        slug: 'category-99',
        label: 'Update',
      });
    });
  });

  describe('getNewsCategoryBySlug', () => {
    it('resolves a known slug and rejects everything else', () => {
      expect(getNewsCategoryBySlug('circular')?.id).toBe(6);
      expect(getNewsCategoryBySlug('all')).toBeNull();
      expect(getNewsCategoryBySlug(null)).toBeNull();
    });
  });

  describe('parseEgovDate', () => {
    it('parses the API date format without shifting the day', () => {
      const date = parseEgovDate('Aug 14, 2026 12:00:00 AM');
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(7);
      expect(date?.getDate()).toBe(14);
      expect(date?.getHours()).toBe(0);
    });

    it('handles PM times and noon', () => {
      expect(parseEgovDate('Aug 14, 2026 04:51:05 PM')?.getHours()).toBe(16);
      expect(parseEgovDate('Aug 14, 2026 12:30:00 PM')?.getHours()).toBe(12);
    });

    it('accepts a date with no time component', () => {
      expect(parseEgovDate('January 3, 2025')?.getMonth()).toBe(0);
    });

    it('returns null for junk', () => {
      expect(parseEgovDate('')).toBeNull();
      expect(parseEgovDate(null)).toBeNull();
      expect(parseEgovDate('not a date')).toBeNull();
      expect(parseEgovDate('Xxx 14, 2026')).toBeNull();
    });
  });

  describe('formatNewsDate', () => {
    it('renders a compact date and tolerates null', () => {
      expect(formatNewsDate(new Date(2026, 7, 14))).toMatch(/14/);
      expect(formatNewsDate(new Date(2026, 7, 14))).toMatch(/Aug/);
      expect(formatNewsDate(null)).toBe('');
    });
  });

  describe('sanitizeNewsHtml', () => {
    it('keeps ordinary article markup', () => {
      const html = sanitizeNewsHtml(
        '<p>Malacañang issued <strong>MC 126</strong>.</p><ul><li>One</li></ul>'
      );
      expect(html).toContain('<p>');
      expect(html).toContain('<strong>MC 126</strong>');
      expect(html).toContain('<li>One</li>');
    });

    it('drops scripts and event handlers', () => {
      const html = sanitizeNewsHtml(
        '<p onclick="steal()">Hi</p><script>alert(1)</script><img src=x onerror="alert(1)">'
      );
      expect(html).not.toContain('script');
      expect(html).not.toContain('onclick');
      expect(html).not.toContain('onerror');
      expect(html).toContain('Hi');
    });

    it('strips javascript: URLs', () => {
      const html = sanitizeNewsHtml('<a href="javascript:alert(1)">Click</a>');
      expect(html).not.toContain('javascript:');
    });

    it('removes the source CMS share widgets', () => {
      const html = sanitizeNewsHtml(
        '<p>Body</p><div class="addtoany_share_save_container"><div class="a2a_kit"><a href="https://pco.gov.ph/#facebook">Facebook</a></div></div>'
      );
      expect(html).toContain('Body');
      expect(html).not.toContain('Facebook');
    });

    it('removes the off-site related-articles rail', () => {
      const html = sanitizeNewsHtml(
        '<p>Body</p><div class="related-news row"><h4>Related</h4><ul class="related"><li><a href="https://pco.gov.ph/x">Some other headline</a></li></ul></div>'
      );
      expect(html).toContain('Body');
      expect(html).not.toContain('Related');
      expect(html).not.toContain('Some other headline');
    });

    it('keeps the download list — a circular is its PDF', () => {
      const html = sanitizeNewsHtml(
        '<ul class="download-media"><li><a href="https://pco.gov.ph/mc126.pdf">Full Transcript</a></li></ul>'
      );
      expect(html).toContain('Full Transcript');
      expect(html).toContain('mc126.pdf');
    });

    it('hardens outbound links', () => {
      const html = sanitizeNewsHtml(
        '<a href="https://www.officialgazette.gov.ph/mc-126">MC 126</a>'
      );
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer nofollow"');
    });

    it('returns an empty string for empty input', () => {
      expect(sanitizeNewsHtml(null)).toBe('');
      expect(sanitizeNewsHtml('')).toBe('');
    });
  });

  describe('htmlToExcerpt', () => {
    it('flattens markup to text', () => {
      expect(htmlToExcerpt('<p>Hello <strong>world</strong></p>')).toBe(
        'Hello world'
      );
    });

    it('truncates on a word boundary', () => {
      const excerpt = htmlToExcerpt(`<p>${'word '.repeat(80)}</p>`, 60);
      expect(excerpt.length).toBeLessThanOrEqual(61);
      expect(excerpt.endsWith('…')).toBe(true);
      expect(excerpt).not.toContain('wor…');
    });
  });

  describe('readingMinutes', () => {
    it('rounds to whole minutes at 220wpm', () => {
      expect(readingMinutes(`<p>${'word '.repeat(220)}</p>`)).toBe(1);
      expect(readingMinutes(`<p>${'word '.repeat(660)}</p>`)).toBe(3);
    });

    it('never reports a zero-minute read for real text', () => {
      expect(readingMinutes('<p>Three short words</p>')).toBe(1);
    });

    it('reports 0 for an empty body', () => {
      expect(readingMinutes('')).toBe(0);
      expect(readingMinutes('<p></p>')).toBe(0);
    });
  });

  describe('buildNewsListUrl', () => {
    it('builds a paged URL', () => {
      expect(buildNewsListUrl({ page: 3, perPage: 12 })).toBe(
        'https://ws.e.gov.ph/pub/news?page=3&per_page=12'
      );
    });

    it('adds the category filter only when given', () => {
      expect(buildNewsListUrl({ page: 1, perPage: 12, categoryId: 6 })).toBe(
        'https://ws.e.gov.ph/pub/news?page=1&per_page=12&category_id=6'
      );
      expect(
        buildNewsListUrl({ page: 1, perPage: 12, categoryId: null })
      ).not.toContain('category_id');
    });

    it('clamps the page to at least 1', () => {
      expect(buildNewsListUrl({ page: 0, perPage: 12 })).toContain('page=1');
      expect(buildNewsListUrl({ page: -5, perPage: 12 })).toContain('page=1');
    });
  });

  describe('fetchNewsList', () => {
    it('normalises articles and pagination', async () => {
      mockFetchOnce(listResponse);
      const { articles, pagination } = await fetchNewsList({
        page: 1,
        perPage: 12,
      });

      expect(pagination).toEqual({
        total: 6040,
        count: 2,
        perPage: 12,
        currentPage: 1,
        totalPages: 504,
      });

      expect(articles[0].title).toBe(
        'Gov’t offices in NCR to implement alternative work'
      );
      expect(articles[0].category.label).toBe('News');
      expect(articles[0].publisher).toBe('PCO');
      expect(articles[0].publishedAt?.getDate()).toBe(14);
      expect(articles[0].featured).toBe(false);

      expect(articles[1].category.label).toBe('Circular');
      expect(articles[1].imageUrl).toBeNull();
      expect(articles[1].publisher).toBeNull();
      expect(articles[1].featured).toBe(true);
    });

    it('throws when the payload is not shaped as expected', async () => {
      mockFetchOnce({ status: 200, data: {} });
      await expect(fetchNewsList({ page: 42, perPage: 7 })).rejects.toThrow(
        /Unexpected response/
      );
    });
  });

  describe('fetchNewsArticle', () => {
    it('sanitises the body and derives an excerpt', async () => {
      mockFetchOnce({
        status: 200,
        message: 'OK',
        data: {
          ...listResponse.data.news[0],
          id: 6078,
          body: '<p>Malacañang issued Memorandum Circular No. 126 on Friday, directing government offices to shift to alternative work arrangements.</p><script>alert(1)</script>',
        },
      });

      const article = await fetchNewsArticle(6078);
      expect(article.bodyHtml).toContain(
        'Malacañang issued Memorandum Circular No. 126'
      );
      expect(article.bodyHtml).not.toContain('script');
      expect(article.excerpt).toBe(
        'Malacañang issued Memorandum Circular No. 126 on Friday, directing government offices to shift to alternative work arrangements.'
      );
      expect(article.readingMinutes).toBe(1);
    });

    it('drops an excerpt too thin to summarise anything', async () => {
      mockFetchOnce({
        status: 200,
        message: 'OK',
        data: {
          ...listResponse.data.news[1],
          id: 6077,
          // A circular's whole body: a link to the PDF, nothing to preview.
          body: '<ul class="download-media"><li><a href="https://pco.gov.ph/mc126.pdf">Full Transcript</a></li></ul>',
        },
      });

      const article = await fetchNewsArticle(6077);
      expect(article.excerpt).toBe('');
      expect(article.bodyHtml).toContain('Full Transcript');
    });

    it('throws when the API returns no article', async () => {
      mockFetchOnce({ status: 400, message: 'Bad Request' });
      await expect(fetchNewsArticle(99999999)).rejects.toThrow(
        /Article not found/
      );
    });
  });
});
