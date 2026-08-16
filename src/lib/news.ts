import DOMPurify from 'dompurify';
import { fetchWithCache } from './api';
import {
  EgovNewsDetailItem,
  EgovNewsDetailResponse,
  EgovNewsItem,
  EgovNewsListResponse,
  EgovPagination,
  NewsArticle,
  NewsArticleDetail,
  NewsCategory,
  NewsListResult,
  NewsPagination,
} from '../types/news';

const NEWS_API_BASE = 'https://ws.e.gov.ph/pub/news';

/** Listings change through the day; article bodies effectively never do. */
const LIST_CACHE_MS = 5 * 60 * 1000;
const DETAIL_CACHE_MS = 6 * 60 * 60 * 1000;

export const DEFAULT_NEWS_PER_PAGE = 12;

/**
 * The API exposes categories as bare numeric ids with no lookup endpoint, so
 * the labels live here.
 *
 * Ids 1 (News) and 6 (Circular) are confirmed. Ids 2, 3 and 4 were inferred
 * from the content of their items — if e.gov.ph ever publishes the real
 * names, this map is the only place that needs changing.
 */
export const NEWS_CATEGORIES: NewsCategory[] = [
  { id: 1, slug: 'news', label: 'News' },
  { id: 6, slug: 'circular', label: 'Circular' },
  { id: 3, slug: 'press-release', label: 'Press Release' },
  { id: 4, slug: 'features', label: 'Features' },
  { id: 2, slug: 'speeches', label: 'Speeches' },
];

/** Shown for any category id the API starts returning that we don't know. */
const unknownCategory = (id: number): NewsCategory => ({
  id,
  slug: `category-${id}`,
  label: 'Update',
});

export const getNewsCategory = (id: number): NewsCategory =>
  NEWS_CATEGORIES.find(c => c.id === id) ?? unknownCategory(id);

export const getNewsCategoryBySlug = (
  slug: string | null | undefined
): NewsCategory | null => NEWS_CATEGORIES.find(c => c.slug === slug) ?? null;

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const EGOV_DATE_RE =
  /^([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM))?$/i;

/**
 * Parse the API's `"Aug 14, 2026 12:00:00 AM"` format.
 *
 * Built as a local-time Date from the literal parts so the day we render is
 * always the day the API sent — no timezone shifting a midnight timestamp
 * onto the previous date.
 */
export const parseEgovDate = (
  value: string | null | undefined
): Date | null => {
  if (!value) return null;

  const match = EGOV_DATE_RE.exec(value.trim());
  if (!match) return null;

  const [, monthName, day, year, hour, minute, second, meridiem] = match;
  const monthIndex = MONTHS.indexOf(monthName.slice(0, 3).toLowerCase());
  if (monthIndex === -1) return null;

  let hours = hour ? Number(hour) : 0;
  if (meridiem) {
    const isPm = meridiem.toUpperCase() === 'PM';
    if (hours === 12) hours = isPm ? 12 : 0;
    else if (isPm) hours += 12;
  }

  const date = new Date(
    Number(year),
    monthIndex,
    Number(day),
    hours,
    minute ? Number(minute) : 0,
    second ? Number(second) : 0
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatNewsDate = (date: Date | null): string =>
  date
    ? new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : '';

export const formatNewsDateLong = (date: Date | null): string =>
  date
    ? new Intl.DateTimeFormat('en-PH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date)
    : '';

/**
 * Chrome the source CMS bakes into every body and that we don't want.
 *
 * `.related-news` is its own related-articles rail — every entry links off to
 * pco.gov.ph, and leaving it in also poisons the excerpt, which would
 * otherwise open with the word "Related" and three unrelated headlines.
 * The `.download-media` list is kept: for a circular that PDF *is* the item.
 */
const JUNK_SELECTORS = [
  '.addtoany_share_save_container',
  '.a2a_kit',
  '.sharedaddy',
  '.related-news',
  'script',
  'style',
  'iframe',
  'form',
];

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'sup',
  'sub',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'span',
  'div',
];

const ALLOWED_ATTR = ['href', 'title', 'src', 'alt', 'width', 'height'];

let hooksRegistered = false;

const registerHooks = () => {
  if (hooksRegistered) return;
  hooksRegistered = true;

  // Every link in this body points off-site (pco.gov.ph, officialgazette…),
  // so open them in a new tab and never leak the referrer-opener pair.
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
    }
  });
};

/**
 * Strip the source CMS's share widgets and scripts, then sanitise.
 *
 * `DOMParser` builds an inert document — nothing runs and no subresource is
 * fetched — so it is safe to walk the untrusted markup before sanitising.
 */
export const sanitizeNewsHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return '';
  }

  registerHooks();

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(JUNK_SELECTORS.join(',')).forEach(el => el.remove());

  return DOMPurify.sanitize(doc.body.innerHTML, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel', 'loading'],
    // Keep the text of anything we drop rather than losing the sentence.
    KEEP_CONTENT: true,
  });
};

/** Flatten sanitised HTML to its text content. */
const htmlToText = (html: string): string => {
  if (!html || typeof document === 'undefined') return '';

  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
};

/** Average adult reading speed, in words per minute. */
const WORDS_PER_MINUTE = 220;

export const readingMinutes = (html: string): number => {
  const words = htmlToText(html).split(' ').filter(Boolean).length;
  return words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

/** Collapse sanitised HTML down to a plain-text preview. */
export const htmlToExcerpt = (html: string, maxLength = 200): string => {
  const text = htmlToText(html);
  if (!text) return '';

  if (text.length <= maxLength) return text;
  // Trim back to a word boundary so the ellipsis doesn't split a word.
  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
};

const normalizeArticle = (item: EgovNewsItem): NewsArticle => ({
  id: item.id,
  title: (item.description ?? '').trim(),
  imageUrl: item.image || null,
  category: getNewsCategory(item.category_id),
  author: item.author || null,
  publisher: item.publisher?.name || null,
  publisherPhoto: item.publisher?.photo || item.avatar || null,
  publishedAt: parseEgovDate(item.publish_date ?? item.created_at),
  relativeLabel: item.date_diff_human || null,
  featured: Boolean(item.featured),
  videoUrl: item.video_url || null,
  sourceUrl: item.redirect_url || null,
});

/**
 * Below this, whatever we extracted isn't a summary. A circular's body is
 * often just a link reading "Full Transcript" — better no excerpt at all than
 * a two-word meta description or a dropcap on a fragment.
 */
const MIN_EXCERPT_CHARS = 60;

const normalizeDetail = (item: EgovNewsDetailItem): NewsArticleDetail => {
  const bodyHtml = sanitizeNewsHtml(item.body);
  const excerpt = htmlToExcerpt(bodyHtml);

  return {
    ...normalizeArticle(item),
    bodyHtml,
    excerpt: excerpt.length >= MIN_EXCERPT_CHARS ? excerpt : '',
    readingMinutes: readingMinutes(bodyHtml),
  };
};

const normalizePagination = (
  pagination: Partial<EgovPagination>,
  fallbackPerPage: number
): NewsPagination => {
  const perPage =
    Number(pagination.per_page ?? fallbackPerPage) || fallbackPerPage;
  const total = Number(pagination.total ?? 0) || 0;

  return {
    total,
    count: Number(pagination.count ?? 0) || 0,
    perPage,
    currentPage: Number(pagination.current_page ?? 1) || 1,
    totalPages:
      Number(pagination.total_pages ?? 0) || Math.ceil(total / perPage) || 1,
  };
};

export interface FetchNewsListOptions {
  page?: number;
  perPage?: number;
  /** Filters server-side. Omit for every category. */
  categoryId?: number | null;
}

export const buildNewsListUrl = ({
  page = 1,
  perPage = DEFAULT_NEWS_PER_PAGE,
  categoryId = null,
}: FetchNewsListOptions = {}): string => {
  const params = new URLSearchParams({
    page: String(Math.max(1, Math.floor(page))),
    per_page: String(perPage),
  });
  if (categoryId != null) params.set('category_id', String(categoryId));
  return `${NEWS_API_BASE}?${params.toString()}`;
};

export const fetchNewsList = async (
  options: FetchNewsListOptions = {}
): Promise<NewsListResult> => {
  const perPage = options.perPage ?? DEFAULT_NEWS_PER_PAGE;
  const url = buildNewsListUrl({ ...options, perPage });
  const response = (await fetchWithCache(url, LIST_CACHE_MS)) as
    | EgovNewsListResponse
    | undefined;

  const news = response?.data?.news;
  if (!Array.isArray(news)) {
    throw new Error('Unexpected response from the e.gov.ph news API.');
  }

  return {
    articles: news.map(normalizeArticle),
    pagination: normalizePagination(
      response?.data?.meta?.pagination ?? {},
      perPage
    ),
  };
};

export const fetchNewsArticle = async (
  id: number | string
): Promise<NewsArticleDetail> => {
  const response = (await fetchWithCache(
    `${NEWS_API_BASE}/${encodeURIComponent(String(id))}`,
    DETAIL_CACHE_MS
  )) as EgovNewsDetailResponse | undefined;

  const article = response?.data;
  if (!article || typeof article.id !== 'number') {
    throw new Error('Article not found.');
  }

  return normalizeDetail(article);
};
