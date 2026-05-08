/**
 * Live integration tests for GET /api/projects.
 *
 * These tests start a real Wrangler dev server (same runtime as production)
 * and make actual HTTP requests against it. Run with:
 *
 *   npm run test:functions:live
 *
 * Requires no external services — the projects endpoint only serves bundled
 * JSON data.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { Unstable_DevWorker } from 'wrangler';

let worker: Unstable_DevWorker;
let baseUrl: string;

beforeAll(async () => {
  worker = await unstable_dev('./functions/index.ts', {
    experimental: { disableExperimentalWarning: true },
    logLevel: 'error',
    config: 'wrangler.test.jsonc',
  });
  baseUrl = `http://${worker.address}:${worker.port}`;
});

afterAll(async () => {
  await worker?.stop();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function get(path: string) {
  return fetch(`${baseUrl}${path}`);
}

async function getJson(path: string) {
  const res = await get(path);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await res.json()) as any;
  return { res, body };
}

// ─── Health & routing ─────────────────────────────────────────────────────────

describe('Live — routing', () => {
  it('GET /api/projects returns 200', async () => {
    const res = await get('/api/projects');
    expect(res.status).toBe(200);
  });

  it('GET /api/status lists projects as an available function', async () => {
    const { body } = await getJson('/api/status');
    expect(body.functions).toContain('projects');
    const projectsEndpoint = body.endpoints.find(
      (e: { path: string }) => e.path === '/api/projects'
    );
    expect(projectsEndpoint).toBeDefined();
  });

  it('unknown route returns 404 with /api/projects in availableEndpoints', async () => {
    const { res, body } = await getJson('/api/not-found');
    expect(res.status).toBe(404);
    expect(body.availableEndpoints).toContain('/api/projects');
  });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────

describe('Live — CORS headers', () => {
  it('GET response includes Access-Control-Allow-Origin: *', async () => {
    const res = await get('/api/projects');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('OPTIONS preflight returns 200 with CORS headers', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, { method: 'OPTIONS' });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toContain('GET');
  });
});

// ─── Response shape ───────────────────────────────────────────────────────────

describe('Live — response shape', () => {
  it('returns application/json content-type', async () => {
    const res = await get('/api/projects');
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('body has data array and meta object', async () => {
    const { body } = await getJson('/api/projects');
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.meta).toBe('object');
  });

  it('every project has all required fields with correct types', async () => {
    const { body } = await getJson('/api/projects');
    for (const project of body.data) {
      expect(typeof project.slug).toBe('string');
      expect(typeof project.title).toBe('string');
      expect(typeof project.description).toBe('string');
      expect(Array.isArray(project.repositoryUrls)).toBe(true);
      expect(project.projectUrl).toMatch(/^https:\/\//);
      expect(['active', 'development', 'archived']).toContain(project.status);
    }
  });

  it('meta contains correct pagination fields', async () => {
    const { body } = await getJson('/api/projects');
    expect(typeof body.meta.total).toBe('number');
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
    expect(typeof body.meta.totalPages).toBe('number');
    expect(typeof body.meta.hasNextPage).toBe('boolean');
    expect(typeof body.meta.hasPrevPage).toBe('boolean');
  });
});

// ─── Filtering ────────────────────────────────────────────────────────────────

describe('Live — status filter', () => {
  it('?status=active returns only active projects', async () => {
    const { body } = await getJson('/api/projects?status=active');
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.every((p: { status: string }) => p.status === 'active')
    ).toBe(true);
  });

  it('?status=invalid returns 400 with error message', async () => {
    const { res, body } = await getJson('/api/projects?status=invalid');
    expect(res.status).toBe(400);
    expect(typeof body.error).toBe('string');
    expect(body.error).toMatch(/invalid status/i);
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('Live — search', () => {
  it('?search=hotlines matches the Hotlines project by title', async () => {
    const { body } = await getJson('/api/projects?search=hotlines');
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.some(
        (p: { title: string; description: string }) =>
          p.title.toLowerCase().includes('hotlines') ||
          p.description.toLowerCase().includes('hotlines')
      )
    ).toBe(true);
  });

  it('?search=budget returns budget-related projects', async () => {
    const { body } = await getJson('/api/projects?search=budget');
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.every(
        (p: { title: string; description: string }) =>
          p.title.toLowerCase().includes('budget') ||
          p.description.toLowerCase().includes('budget')
      )
    ).toBe(true);
  });

  it('?search=<no-match> returns empty data and total=0', async () => {
    const { body } = await getJson('/api/projects?search=zzz-nomatch-xyz');
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('search is case-insensitive', async () => {
    const { body: lower } = await getJson('/api/projects?search=budget');
    const { body: upper } = await getJson('/api/projects?search=BUDGET');
    expect(lower.meta.total).toBe(upper.meta.total);
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Live — pagination', () => {
  it('?limit=3 returns at most 3 results', async () => {
    const { body } = await getJson('/api/projects?limit=3');
    expect(body.data.length).toBeLessThanOrEqual(3);
    expect(body.meta.limit).toBe(3);
  });

  it('?page=2&limit=3 returns a different slice than page=1', async () => {
    const { body: p1 } = await getJson('/api/projects?page=1&limit=3');
    const { body: p2 } = await getJson('/api/projects?page=2&limit=3');
    expect(p1.data[0].slug).not.toBe(p2.data[0]?.slug);
  });

  it('?limit=999 is capped at 100', async () => {
    const { body } = await getJson('/api/projects?limit=999');
    expect(body.meta.limit).toBe(100);
  });

  it('hasPrevPage=false on page 1', async () => {
    const { body } = await getJson('/api/projects?page=1');
    expect(body.meta.hasPrevPage).toBe(false);
  });

  it('hasNextPage=true when total > limit', async () => {
    const { body } = await getJson('/api/projects?limit=1');
    if (body.meta.total > 1) {
      expect(body.meta.hasNextPage).toBe(true);
    }
  });

  it('out-of-range page clamps to last valid page', async () => {
    const { body } = await getJson('/api/projects?page=9999');
    expect(body.meta.page).toBeLessThanOrEqual(body.meta.totalPages);
  });
});
