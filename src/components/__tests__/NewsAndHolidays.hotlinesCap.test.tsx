import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${JSON.stringify(opts)}` : key,
  }),
}));

vi.mock('../../lib/news', () => ({
  fetchNewsList: vi.fn().mockResolvedValue({
    articles: [],
    pagination: {
      total: 0,
      count: 0,
      perPage: 6,
      currentPage: 1,
      totalPages: 1,
    },
  }),
  fetchNewsArticle: vi.fn().mockResolvedValue(null),
  formatNewsDateLong: () => '',
}));

const row = (n: number) => ({
  name: `Hotline ${n}`,
  category: 'Emergency',
  numbers: [`10${n}`],
  description: `d${n}`,
});

vi.mock('../../data/cms', () => ({
  criticalHotlines: [1, 2, 3, 4, 5, 6].map(row),
}));

const NewsAndHolidays = (await import('../v2/home/NewsAndHolidays')).default;

describe('<NewsAndHolidays /> hotline row cap', () => {
  it('renders the first five rows and omits the sixth', () => {
    render(
      <MemoryRouter>
        <NewsAndHolidays />
      </MemoryRouter>
    );
    for (const n of [1, 2, 3, 4, 5]) {
      expect(screen.getByText(`Hotline ${n}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('Hotline 6')).not.toBeInTheDocument();
  });
});
