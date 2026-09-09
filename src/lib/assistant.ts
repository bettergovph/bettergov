// Types for our service data
export interface ServiceItem {
  service: string;
  url: string;
  id: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
  subcategory: {
    name: string;
    slug: string;
  };
}

/** Escape user input before interpolating into `new RegExp(...)`. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Civic Assistant Logic
 * Performs client-side intent mapping and fuzzy search across curated JSON datasets.
 */
export class CivicEngine {
  private data: ServiceItem[] = [];

  // ponytail: optional seed for unit tests; production uses initialize()
  constructor(initialData: ServiceItem[] = []) {
    this.data = initialData;
  }

  async initialize() {
    // We focus on a curated set of core categories, not the full taxonomy.
    const categories = [
      'passport-travel',
      'certificates-ids',
      'health',
      'social-services',
      'business-trade',
    ];

    // Deferred so importing this module never touches the generated CMS
    // data — only calling initialize() does.
    const { services } = await import('../data/cms');
    this.data = categories.flatMap(cat => services[cat] ?? []);
  }

  query(input: string): ServiceItem[] {
    if (!input || input.length < 2) return [];

    const searchTerms = input.toLowerCase().split(' ');

    return this.data
      .map(item => {
        let score = 0;
        const target =
          `${item.service} ${item.category.name} ${item.subcategory.name}`.toLowerCase();

        searchTerms.forEach(term => {
          if (!term || !target.includes(term)) return;

          score += 1;
          // Exact word match bonus (escape so "(", "+", etc. cannot break RegExp)
          if (new RegExp(`\\b${escapeRegExp(term)}\\b`).test(target)) {
            score += 2;
          }
        });

        return { item, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(result => result.item);
  }
}

export const civicEngine = new CivicEngine();
