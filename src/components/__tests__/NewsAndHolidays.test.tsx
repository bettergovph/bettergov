import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewsAndHolidays from '../v2/home/NewsAndHolidays';
import { fetchNewsList, fetchNewsArticle } from '../../lib/news';
import {
  NewsArticle,
  NewsArticleDetail,
  NewsListResult,
} from '../../types/news';
const { FIXTURE_HOTLINES } = vi.hoisted(() => ({
  FIXTURE_HOTLINES: [
    {
      name: 'National Emergency Hotline',
      category: 'Emergency',
      numbers: ['911'],
      description: 'Nationwide emergency hotline.',
    },
    {
      name: 'PNP Emergency',
      category: 'Security',
      numbers: ['117'],
      description: 'Police emergency hotline.',
    },
    {
      name: 'Red Cross',
      category: 'Emergency',
      numbers: ['143', '790-2300'],
      description: 'Red Cross emergency hotline.',
    },
    {
      name: 'Mental Health Crisis Line',
      category: 'Social Services',
      numbers: ['1553'],
      description: 'Mental health crisis hotline.',
    },
  ],
}));

vi.mock('../../data/cms', () => ({
  criticalHotlines: FIXTURE_HOTLINES,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('../../lib/news', () => ({
  fetchNewsList: vi.fn(),
  fetchNewsArticle: vi.fn(),
  formatNewsDateLong: (date: Date | null) => (date ? date.toISOString() : ''),
}));

/** NewsArticle has many required fields; only id/title/category matter here. */
const newsArticle = (id: number, title: string): NewsArticle => ({
  id,
  title,
  imageUrl: null,
  category: { id: 1, slug: 'news', label: 'News' },
  author: null,
  publisher: null,
  publisherPhoto: null,
  publishedAt: new Date('2026-09-01T00:00:00Z'),
  relativeLabel: null,
  featured: false,
  videoUrl: null,
  sourceUrl: null,
});

const newsResult = (articles: NewsArticle[]): NewsListResult => ({
  articles,
  pagination: {
    total: articles.length,
    count: articles.length,
    perPage: 6,
    currentPage: 1,
    totalPages: 1,
  },
});

const newsDetail = (id: number, title: string): NewsArticleDetail => ({
  ...newsArticle(id, title),
  bodyHtml: '<p>Full body.</p>',
  excerpt: 'A distinctive opening sentence for the lead article.',
  readingMinutes: 7,
});

const renderSection = () =>
  render(
    <MemoryRouter>
      <NewsAndHolidays />
    </MemoryRouter>
  );

describe('<NewsAndHolidays /> news column enrichment', () => {
  it('enriches the selected lead and renders its excerpt and read time', async () => {
    const lead = newsArticle(42, 'Lead story');
    vi.mocked(fetchNewsList).mockResolvedValue(
      newsResult([lead, newsArticle(43, 'Second story')])
    );
    vi.mocked(fetchNewsArticle).mockResolvedValue(newsDetail(42, 'Lead story'));

    renderSection();

    await waitFor(() => {
      expect(
        screen.getByText('A distinctive opening sentence for the lead article.')
      ).toBeInTheDocument();
    });

    // The detail request must target the lead the column actually chose.
    expect(vi.mocked(fetchNewsArticle)).toHaveBeenCalledWith(42);
    // Read time is rendered through the interpolating t() mock.
    expect(screen.getByText(/"count":7/)).toBeInTheDocument();
  });

  it('still renders the news column when enrichment fails', async () => {
    vi.mocked(fetchNewsList).mockResolvedValue(
      newsResult([newsArticle(42, 'Lead story')])
    );
    vi.mocked(fetchNewsArticle).mockRejectedValue(new Error('detail is down'));

    renderSection();

    await waitFor(() => {
      expect(screen.getByText('Lead story')).toBeInTheDocument();
    });
  });
});

const criticalRows = FIXTURE_HOTLINES;

describe('<NewsAndHolidays /> hotlines card', () => {
  beforeEach(() => {
    vi.mocked(fetchNewsList).mockResolvedValue(
      newsResult([newsArticle(1, 'A')])
    );
    vi.mocked(fetchNewsArticle).mockResolvedValue(null);
  });

  it('renders synchronously from the committed JSON — no skeleton, no fetcher', () => {
    renderSection();
    expect(screen.queryByTestId('hotlines-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText(criticalRows[0].name)).toBeInTheDocument();
  });

  it('renders each label with its first number', () => {
    renderSection();
    for (const row of criticalRows.slice(0, 5)) {
      expect(screen.getByText(row.name)).toBeInTheDocument();
      expect(screen.getByText(row.numbers[0])).toBeInTheDocument();
    }
  });

  it('shows only the primary number, not the rest of the array', () => {
    const multi = criticalRows.find(r => r.numbers.length > 1);
    expect(multi).toBeDefined();
    renderSection();
    expect(screen.queryByText(multi!.numbers[1])).not.toBeInTheDocument();
  });

  it('accents only the first row', () => {
    renderSection();
    expect(screen.getByText(criticalRows[0].numbers[0]).className).toContain(
      'text-ed-red'
    );
    expect(
      screen.getByText(criticalRows[1].numbers[0]).className
    ).not.toContain('text-ed-red');
  });

  it('renders every committed row today (four), all of them within the cap', () => {
    renderSection();
    for (const row of criticalRows) {
      expect(screen.getByText(row.name)).toBeInTheDocument();
    }
  });

  it('still renders the hotlines when the news column fails, and shows the news failure state', async () => {
    vi.mocked(fetchNewsList).mockRejectedValue(new Error('news is down'));
    renderSection();
    await waitFor(() => {
      expect(screen.getByText(criticalRows[0].name)).toBeInTheDocument();
    });
    // The two columns fail independently: hotlines rendering doesn't imply
    // the news column recovered — it should show its "coming soon" notice
    // (the skeleton/coming-soon/content branches are mutually exclusive, so
    // this also proves the skeleton is no longer showing).
    expect(screen.getByText(/newsComingSoon\.title/)).toBeInTheDocument();
  });
});
