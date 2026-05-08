import { describe, it, expect, beforeAll } from 'vitest';
import { onRequest } from './projects';
import type { Project } from '../types';

// Minimal mocks — projects.ts doesn't use env or ctx bindings
const env = {} as Parameters<typeof onRequest>[0]['env'];
const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

function makeContext(url: string) {
  return { request: new Request(url), env, ctx };
}

async function getJson(url: string) {
  const res = await onRequest(makeContext(url));
  const body = await res.json<{
    data: Project[];
    meta: Record<string, unknown>;
  }>();
  return { res, body };
}

// ─── Unit: response shape ─────────────────────────────────────────────────────

describe('GET /api/projects — response shape', () => {
  it('returns 200 with application/json content-type', async () => {
    const res = await onRequest(makeContext('http://localhost/api/projects'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('data is an array of project objects', async () => {
    const { body } = await getJson('http://localhost/api/projects');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('description');
    expect(first).toHaveProperty('repositoryUrls');
    expect(first).toHaveProperty('projectUrl');
    expect(first).toHaveProperty('status');
  });

  it('meta contains expected pagination fields', async () => {
    const { body } = await getJson('http://localhost/api/projects');
    const { meta } = body;
    expect(meta).toHaveProperty('total');
    expect(meta).toHaveProperty('page');
    expect(meta).toHaveProperty('limit');
    expect(meta).toHaveProperty('totalPages');
    expect(meta).toHaveProperty('hasNextPage');
    expect(meta).toHaveProperty('hasPrevPage');
  });
});

// ─── Unit: status filter ──────────────────────────────────────────────────────

describe('GET /api/projects — status filter', () => {
  it('returns only active projects when status=active', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?status=active'
    );
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((p: Project) => p.status === 'active')).toBe(true);
  });

  it('returns only development projects when status=development', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?status=development'
    );
    expect(body.data.every((p: Project) => p.status === 'development')).toBe(
      true
    );
  });

  it('returns only archived projects when status=archived', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?status=archived'
    );
    expect(body.data.every((p: Project) => p.status === 'archived')).toBe(true);
  });

  it('returns 400 for an invalid status value', async () => {
    const res = await onRequest(
      makeContext('http://localhost/api/projects?status=invalid')
    );
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/invalid status/i);
  });
});

// ─── Unit: search ─────────────────────────────────────────────────────────────

describe('GET /api/projects — search', () => {
  it('matches on title (case-insensitive)', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?search=BUDGET'
    );
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.every(
        (p: Project) =>
          p.title.toLowerCase().includes('budget') ||
          p.description.toLowerCase().includes('budget')
      )
    ).toBe(true);
  });

  it('matches on description (case-insensitive)', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?search=procurement'
    );
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.some((p: Project) =>
        p.description.toLowerCase().includes('procurement')
      )
    ).toBe(true);
  });

  it('returns empty data array for a search term with no matches', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?search=zzz-no-match-xyz'
    );
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('can combine search and status filters', async () => {
    const { body } = await getJson(
      'http://localhost/api/projects?search=budget&status=active'
    );
    expect(body.data.every((p: Project) => p.status === 'active')).toBe(true);
  });
});

// ─── Unit: pagination ─────────────────────────────────────────────────────────

describe('GET /api/projects — pagination', () => {
  let totalProjects: number;

  beforeAll(async () => {
    const { body } = await getJson('http://localhost/api/projects');
    totalProjects = body.meta.total as number;
  });

  it('defaults to page=1 and limit=20', async () => {
    const { body } = await getJson('http://localhost/api/projects');
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
  });

  it('respects a custom limit', async () => {
    const { body } = await getJson('http://localhost/api/projects?limit=5');
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.meta.limit).toBe(5);
  });

  it('respects a custom page', async () => {
    const { body: page1 } = await getJson(
      'http://localhost/api/projects?limit=3&page=1'
    );
    const { body: page2 } = await getJson(
      'http://localhost/api/projects?limit=3&page=2'
    );
    expect(page1.data[0].slug).not.toBe(page2.data[0]?.slug);
  });

  it('caps limit at 100', async () => {
    const { body } = await getJson('http://localhost/api/projects?limit=999');
    expect(body.meta.limit).toBe(100);
  });

  it('meta.total reflects unfiltered dataset size', async () => {
    const { body } = await getJson('http://localhost/api/projects?limit=1');
    expect(body.meta.total).toBe(totalProjects);
  });

  it('hasPrevPage is false on page 1', async () => {
    const { body } = await getJson('http://localhost/api/projects?page=1');
    expect(body.meta.hasPrevPage).toBe(false);
  });

  it('hasNextPage is true when results exceed one page', async () => {
    const { body } = await getJson('http://localhost/api/projects?limit=1');
    if (totalProjects > 1) {
      expect(body.meta.hasNextPage).toBe(true);
    }
  });

  it('clamps out-of-range page to last valid page', async () => {
    const { body } = await getJson('http://localhost/api/projects?page=9999');
    expect(body.meta.page).toBeLessThanOrEqual(body.meta.totalPages as number);
  });

  it('treats non-numeric page as 1', async () => {
    const { body } = await getJson('http://localhost/api/projects?page=abc');
    expect(body.meta.page).toBe(1);
  });

  it('treats non-numeric limit as 20', async () => {
    const { body } = await getJson('http://localhost/api/projects?limit=abc');
    expect(body.meta.limit).toBe(20);
  });
});
