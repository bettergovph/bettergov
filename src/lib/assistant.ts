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

/**
 * Civic Assistant Logic
 * Performs client-side intent mapping and fuzzy search across curated JSON datasets.
 */
export class CivicEngine {
  private data: ServiceItem[] = [];

  constructor() {}

  async initialize() {
    try {
      // In a real app, we'd fetch these or import them.
      // For this prototype, we'll focus on the core categories.
      const categories = [
        'passport-travel',
        'certificates-ids',
        'health',
        'social-services',
        'business-trade',
      ];

      const datasets = await Promise.all(
        categories.map(async cat => {
          try {
            const module = await import(`../data/services/${cat}.json`);
            return module.default as ServiceItem[];
          } catch (e) {
            console.error(`Failed to load category: ${cat}`, e);
            return [];
          }
        })
      );

      this.data = datasets.flat();
    } catch (error) {
      console.error('CivicEngine initialization failed:', error);
    }
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
          if (target.includes(term)) {
            score += 1;
            // Exact word match bonus
            if (new RegExp(`\\b${term}\\b`).test(target)) score += 2;
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
