/**
 * PayloadClient — lightweight Payload CMS REST API wrapper
 * Implements the same find() interface as the Payload local SDK
 * so export modules can be used without installing Payload as a dependency.
 */

export interface FindOptions {
  collection: string;
  limit?: number;
  sort?: string;
  depth?: number;
  where?: Record<string, unknown>;
  page?: number;
}

export interface FindResult<T = Record<string, unknown>> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
}

export class PayloadClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  async find<T = Record<string, unknown>>(
    options: FindOptions
  ): Promise<FindResult<T>> {
    const params = new URLSearchParams();

    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.sort) params.set('sort', options.sort);
    if (options.depth !== undefined) params.set('depth', String(options.depth));
    if (options.page !== undefined) params.set('page', String(options.page));
    if (options.where) params.set('where', JSON.stringify(options.where));

    const url = `${this.baseUrl}/api/${options.collection}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `users API-Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `CMS API error: ${response.status} ${response.statusText} — GET ${url}`
      );
    }

    return response.json() as Promise<FindResult<T>>;
  }
}
