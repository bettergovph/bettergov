/**
 * Types for the e.gov.ph public news API (https://ws.e.gov.ph/pub/news).
 *
 * The `Egov*` types mirror the wire format exactly — including its quirks,
 * such as `description` actually holding the headline. Everything downstream
 * should use the normalised `NewsArticle` / `NewsArticleDetail` shapes.
 */

export interface EgovPublisher {
  id: number;
  name: string;
  photo: string | null;
}

export interface EgovNewsItem {
  id: number;
  /** The headline. The API's naming, not ours. */
  description: string;
  image: string | null;
  category_id: number;
  redirect_url: string | null;
  author: string | null;
  avatar: string | null;
  publisher: EgovPublisher | null;
  featured: number;
  video_url: string | null;
  /** e.g. "Aug 14, 2026 12:00:00 AM" */
  publish_date: string | null;
  created_at: string | null;
  /** e.g. "3 days ago" */
  date_diff_human: string | null;
}

export interface EgovNewsDetailItem extends EgovNewsItem {
  /** Raw, unsanitised article HTML. */
  body: string | null;
}

export interface EgovPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface EgovNewsListResponse {
  status: number;
  message: string;
  data: {
    news: EgovNewsItem[];
    meta: { pagination: EgovPagination };
  };
}

export interface EgovNewsDetailResponse {
  status: number;
  message: string;
  data: EgovNewsDetailItem;
}

export interface NewsCategory {
  id: number;
  /** URL-safe identifier used in the `?category=` query param. */
  slug: string;
  label: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  imageUrl: string | null;
  category: NewsCategory;
  author: string | null;
  publisher: string | null;
  publisherPhoto: string | null;
  /** Null when the API sends a date we cannot parse. */
  publishedAt: Date | null;
  /** e.g. "3 days ago" — supplied by the API, may be absent. */
  relativeLabel: string | null;
  featured: boolean;
  videoUrl: string | null;
  /** Where the item lives on e.gov.ph, when the API provides it. */
  sourceUrl: string | null;
}

export interface NewsArticleDetail extends NewsArticle {
  /** Article HTML, already run through the sanitiser. Safe to render. */
  bodyHtml: string;
  /** Plain-text opening of the body, for meta descriptions and previews. */
  excerpt: string;
  /** Estimated read time in whole minutes; 0 when there is no body. */
  readingMinutes: number;
}

export interface NewsPagination {
  total: number;
  count: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

export interface NewsListResult {
  articles: NewsArticle[];
  pagination: NewsPagination;
}
