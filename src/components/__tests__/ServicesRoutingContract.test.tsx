import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Services from '../../pages/services/index';
import certificatesIds from '../../data/services/certificates-ids.json';
import businessTrade from '../../data/services/business-trade.json';
import education from '../../data/services/education.json';
import health from '../../data/services/health.json';

const { FIXTURE_CATEGORIES } = vi.hoisted(() => ({
  FIXTURE_CATEGORIES: [
    {
      category: 'Certificates and IDs',
      slug: 'certificates-ids',
      subcategories: [
        { name: 'ID', slug: 'id' },
        { name: 'Certificates', slug: 'certificates' },
      ],
    },
    {
      category: 'Business and Trade',
      slug: 'business-trade',
      subcategories: [
        {
          name: 'Business Registration, Certificates and Compliance',
          slug: 'business-registration',
        },
      ],
    },
    {
      category: 'Education',
      slug: 'education',
      subcategories: [{ name: 'Education', slug: 'education' }],
    },
    {
      category: 'Health',
      slug: 'health',
      subcategories: [{ name: 'Health', slug: 'health' }],
    },
  ],
}));

vi.mock('../../data/cms', () => ({
  serviceCategories: { categories: FIXTURE_CATEGORIES },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeAll(() => {
  // jsdom has no IntersectionObserver; /services builds one for infinite
  // scroll on mount.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

const renderAt = (url: string) => {
  // The react-router nuqs adapter reads query state from `window.location`,
  // not from MemoryRouter's virtual history — so the real jsdom URL must be
  // set too, or every param resolves to its default ('all').
  window.history.pushState({}, '', url);
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <NuqsAdapter>
          <Services />
        </NuqsAdapter>
      </MemoryRouter>
    </HelmetProvider>
  );
};

type Record_ = {
  service: string;
  category: { slug: string };
  subcategory: { slug: string };
};

const allRecords = [
  ...certificatesIds,
  ...businessTrade,
  ...education,
  ...health,
] as Record_[];

const expected = (category: string, subcategory?: string) =>
  allRecords.filter(
    r =>
      r.category.slug === category &&
      (subcategory ? r.subcategory.slug === subcategory : true)
  );

describe("Hero URL routing contract against today's /services", () => {
  // TEMPORARY (migration inventory class D): characterizes local filtering.
  // Rewrite when /services becomes CMS-backed.

  it.each([
    ['certificates-ids', 'id'],
    ['certificates-ids', 'certificates'],
    ['business-trade', 'business-registration'],
  ])(
    'resolves ?category=%s&subcategory=%s to a non-empty, correctly-scoped set',
    (category, subcategory) => {
      const matches = expected(category, subcategory);

      // The taxonomy must know the pair, scoped to its parent — this is the
      // exact lookup /services performs.
      const parent = FIXTURE_CATEGORIES.find(c => c.slug === category);
      expect(parent).toBeDefined();
      expect(parent!.subcategories.some(s => s.slug === subcategory)).toBe(
        true
      );

      // Every record the filter returns belongs to the intended pair, and
      // there is at least one — an unknown subcategory would silently widen
      // to the whole category instead.
      expect(matches.length).toBeGreaterThan(0);
      for (const r of matches) {
        expect(r.category.slug).toBe(category);
        expect(r.subcategory.slug).toBe(subcategory);
      }
      expect(matches.length).toBeLessThan(expected(category).length);
    }
  );

  it.each([
    ['certificates-ids'],
    ['business-trade'],
    ['education'],
    ['health'],
  ])('resolves ?category=%s to a non-empty set', category => {
    expect(expected(category).length).toBeGreaterThan(0);
  });

  it.each([
    ['certificates-ids', 'id'],
    ['certificates-ids', 'certificates'],
    ['business-trade', 'business-registration'],
  ])(
    'renders results for the Hero chip URL ?category=%s&subcategory=%s in the real page',
    async (category, subcategory) => {
      renderAt(`/services?category=${category}&subcategory=${subcategory}`);

      const matches = expected(category, subcategory);
      await waitFor(() => {
        expect(screen.getByText(matches[0].service)).toBeInTheDocument();
      });

      // A record from the same category but a different subcategory must
      // NOT appear — proving the subcategory was applied, not silently
      // dropped.
      const otherSub = expected(category).find(
        r => r.subcategory.slug !== subcategory
      );
      expect(otherSub).toBeDefined();
      expect(screen.queryByText(otherSub!.service)).not.toBeInTheDocument();
    }
  );

  it.each([
    ['certificates-ids'],
    ['business-trade'],
    ['education'],
    ['health'],
  ])(
    'renders results for the Hero category-tile URL ?category=%s in the real page',
    async category => {
      renderAt(`/services?category=${category}`);

      const matches = expected(category);
      await waitFor(() => {
        expect(screen.getByText(matches[0].service)).toBeInTheDocument();
      });

      // A record from a different category must NOT appear — proving the
      // category filter was applied, not just "show everything". Picked
      // from businessTrade specifically (falling back to certificatesIds
      // when that IS the category under test): the real page's own
      // unfiltered `allServices` imports businessTrade first, so if the
      // filter were silently dropped this record would land on page one
      // and the negative assertion would still be meaningful.
      const other = (
        category === 'business-trade' ? certificatesIds : businessTrade
      )[0] as Record_;
      expect(screen.queryByText(other.service)).not.toBeInTheDocument();
    }
  );
});
