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

export async function askAI(
  question: string,
  contextData: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const aiModel = 'openrouter/owl-alpha';

  if (!apiKey) {
    return 'AI assistant is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.';
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: `You are a helpful civic assistant for a Philippine government services website.

              Answer ONLY using the provided context data.
              Do not use any external knowledge or make up information.
              If the context data does not contain information relevant to the question, say:
              "I could not find information related to your request."

              Summarize the available data naturally and conversationally.
              Be concise but helpful. NOTE: make the response easy and readable to user and 
              include proper line spacing`,
            },
            {
              role: 'user',
              content: `Context:
                ${JSON.stringify(contextData, null, 2)}

                Question:
                ${question}`,
            },
          ],
        }),
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('OpenRouter API error:', result.error);
      return 'Sorry, I encountered an error processing your request.';
    }

    return (
      result.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response.'
    );
  } catch (error) {
    console.error('Failed to query AI:', error);
    return 'Sorry, I encountered an error connecting to the AI service.';
  }
}
