import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Categories from '../v2/home/Categories';

const { FIXTURE_CATEGORIES, FIXTURE_SERVICES } = vi.hoisted(() => ({
  FIXTURE_CATEGORIES: [
    {
      category: 'Health',
      slug: 'health',
      subcategories: [
        { name: 'Financial Assistance', slug: 'financial-assistance' },
      ],
    },
    {
      category: 'Business and Trade',
      slug: 'business-trade',
      subcategories: [
        { name: 'Business Registration', slug: 'business-registration' },
      ],
    },
    {
      category: 'Uncategorized',
      slug: 'uncategorized',
      subcategories: [{ name: 'Uncategorized', slug: 'uncategorized' }],
    },
  ],
  FIXTURE_SERVICES: {
    health: [{}, {}],
    'business-trade': [{}],
    uncategorized: [{}, {}, {}],
  },
}));

vi.mock('../../data/cms', () => ({
  serviceCategories: { categories: FIXTURE_CATEGORIES },
  services: FIXTURE_SERVICES,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key} ${JSON.stringify(opts)}` : key,
  }),
}));

const renderCategories = () =>
  render(
    <MemoryRouter>
      <Categories />
    </MemoryRouter>
  );

const browsable = FIXTURE_CATEGORIES.filter(c => c.slug !== 'uncategorized');

describe('<Categories />', () => {
  it('renders synchronously from the taxonomy — no fetch, no skeleton', () => {
    renderCategories();
    expect(screen.queryByTestId('categories-skeleton')).not.toBeInTheDocument();
    expect(screen.getByText(browsable[0].category)).toBeInTheDocument();
  });

  it('excludes uncategorized and caps the grid at 12', () => {
    renderCategories();
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(Math.min(browsable.length, 12));
    expect(screen.queryByText(/uncategorized/i)).not.toBeInTheDocument();
  });

  it('links each card to its category filter', () => {
    renderCategories();
    expect(
      screen.getByRole('link', { name: new RegExp(browsable[0].category, 'i') })
    ).toHaveAttribute('href', `/services?category=${browsable[0].slug}`);
  });

  it('sums the metadata count from the accessor service map', () => {
    // Independently recomputed here: `> 0` would pass even if the component
    // counted something else entirely.
    const shown = browsable.slice(0, 12);
    const expectedTotal = shown.reduce(
      (sum, c) =>
        sum +
        (FIXTURE_SERVICES[c.slug as keyof typeof FIXTURE_SERVICES]?.length ??
          0),
      0
    );
    expect(expectedTotal).toBeGreaterThan(0);

    renderCategories();
    const meta = screen.getByText(/categories\.meta/);
    const counts = JSON.parse(
      meta.textContent!.replace('categories.meta ', '')
    );
    expect(counts.count).toBe(expectedTotal);
    expect(counts.domains).toBe(shown.length);
  });
});
