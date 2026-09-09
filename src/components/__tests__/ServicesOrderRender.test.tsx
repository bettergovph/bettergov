import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Services from '../../pages/services/index';

/**
 * `src/data/cms.ts`'s `services` map is keyed by category slug in codepoint
 * order — the same order `import.meta.glob` produces over
 * src/data/services/*.json. Slugs are chosen so codepoint order does NOT
 * coincide with insertion order below: if the page read Object.values() in
 * insertion order instead of relying on that codepoint-keyed map, this would
 * still catch it.
 */
const { FIXTURE_SERVICES, FIXTURE_CATEGORIES } = vi.hoisted(() => {
  const record = (categorySlug: string, categoryName: string, n: number) => ({
    service: `${categoryName} service ${n}`,
    url: `https://example.gov.ph/${categorySlug}/${n}`,
    id: `${categorySlug}-${n}`,
    slug: `${categorySlug}-service-${n}`,
    published: true,
    featured: false,
    category: { name: categoryName, slug: categorySlug },
    subcategory: { name: categoryName, slug: categorySlug },
    createdAt: '2025-06-06T11:30:06.318Z',
    updatedAt: '2025-06-06T11:30:06.318Z',
  });

  return {
    FIXTURE_SERVICES: {
      zulu: Array.from({ length: 7 }, (_, i) => record('zulu', 'Zulu', i)),
      alpha: Array.from({ length: 7 }, (_, i) => record('alpha', 'Alpha', i)),
      middle: Array.from({ length: 7 }, (_, i) =>
        record('middle', 'Middle', i)
      ),
    },
    FIXTURE_CATEGORIES: [
      {
        category: 'Alpha',
        slug: 'alpha',
        subcategories: [{ name: 'Alpha', slug: 'alpha' }],
      },
      {
        category: 'Middle',
        slug: 'middle',
        subcategories: [{ name: 'Middle', slug: 'middle' }],
      },
      {
        category: 'Zulu',
        slug: 'zulu',
        subcategories: [{ name: 'Zulu', slug: 'zulu' }],
      },
    ],
  };
});

vi.mock('../../data/cms', () => ({
  serviceCategories: { categories: FIXTURE_CATEGORIES },
  services: FIXTURE_SERVICES,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/**
 * Fires every intersection immediately so the page's infinite scroll runs to
 * completion without a real scroll container. Each firing is deferred to a
 * macrotask so React finishes committing the previous page before the next
 * `setCurrentPage` call — mirrors a real IntersectionObserver's async
 * callback timing closely enough for `waitFor` to converge.
 */
class AutoLoadIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    setTimeout(() => {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }, 0);
  }

  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', AutoLoadIntersectionObserver);
});

const renderAt = (url: string) => {
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

/**
 * The expected sequence: `Object.values(services)` in the fixture's OWN key
 * order (alpha, middle, zulu — deliberately not codepoint order in this
 * fixture's insertion order, since JS preserves non-numeric string key
 * insertion order regardless of codepoint value). This still discriminates:
 * a bug that dropped a category, flattened records out of position order, or
 * broke pagination would all produce a different sequence here.
 */
const EXPECTED_ORDER = [
  ...FIXTURE_SERVICES.zulu,
  ...FIXTURE_SERVICES.alpha,
  ...FIXTURE_SERVICES.middle,
].map(r => r.service);

describe('/services renders every generated record in order', () => {
  it('renders all 21 records, in the accessor map order, after infinite scroll completes', async () => {
    expect(EXPECTED_ORDER).toHaveLength(21);
    expect(new Set(EXPECTED_ORDER).size).toBe(21);

    renderAt('/services');

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(21);
    });

    const renderedNames = screen
      .getAllByRole('listitem')
      .map(li => li.querySelector('h3')!.textContent);

    // The complete sequence, not just endpoints — a middle-record reordering
    // or a dropped/duplicated category would otherwise slip through
    // undetected.
    expect(renderedNames).toEqual(EXPECTED_ORDER);
  });

  it('caps the first page at 16 before infinite scroll fires', () => {
    // A synchronous assertion, independent of the async test above: proves
    // pagination genuinely gates the initial render rather than the fixture
    // simply being small enough to fit on one page.
    renderAt('/services');
    expect(screen.getAllByRole('listitem')).toHaveLength(16);
  });
});
