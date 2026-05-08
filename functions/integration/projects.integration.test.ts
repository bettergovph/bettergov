/**
 * Integration tests for the /api/projects route through the full Worker
 * fetch handler (functions/index.ts), which adds CORS headers and handles
 * routing. No live server is started — the handler is called directly.
 */
import { describe, it, expect } from 'vitest';
import worker from '../index';
import type { Project } from '../types';

const env = {} as Parameters<typeof worker.fetch>[1];
const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

async function workerFetch(url: string, method = 'GET') {
  return worker.fetch(new Request(url, { method }), env, ctx);
}

async function workerJson(url: string) {
  const res = await workerFetch(url);
  const body = await res.json<{
    data: Project[];
    meta: Record<string, unknown>;
  }>();
  return { res, body };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

describe('Worker routing — /api/projects', () => {
  it('routes GET /api/projects to the projects handler', async () => {
    const res = await workerFetch('http://localhost/api/projects');
    expect(res.status).toBe(200);
  });

  it('returns 404 for unrecognised paths', async () => {
    const res = await workerFetch('http://localhost/api/does-not-exist');
    expect(res.status).toBe(404);
    const body = await res.json<{ availableEndpoints: string[] }>();
    expect(body.availableEndpoints).toContain('/api/projects');
  });

  it('lists /api/projects in /api/status endpoint list', async () => {
    const res = await workerFetch('http://localhost/api/status');
    expect(res.status).toBe(200);
    const body = await res.json<{ functions: string[] }>();
    expect(body.functions).toContain('projects');
  });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────

describe('Worker CORS — /api/projects', () => {
  it('includes Access-Control-Allow-Origin: * on GET', async () => {
    const res = await workerFetch('http://localhost/api/projects');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('responds to OPTIONS preflight with 200 and CORS headers', async () => {
    const res = await workerFetch('http://localhost/api/projects', 'OPTIONS');
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});

// ─── End-to-end query param flow ─────────────────────────────────────────────

describe('Worker end-to-end — /api/projects query params', () => {
  it('returns full project list with correct pagination meta', async () => {
    const { body } = await workerJson('http://localhost/api/projects');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
    expect(typeof body.meta.total).toBe('number');
  });

  it('filters by status=active end-to-end', async () => {
    const { body } = await workerJson(
      'http://localhost/api/projects?status=active'
    );
    expect(body.data.every((p: Project) => p.status === 'active')).toBe(true);
  });

  it('searches projects end-to-end', async () => {
    const { body } = await workerJson(
      'http://localhost/api/projects?search=hotlines'
    );
    expect(body.data.length).toBeGreaterThan(0);
    expect(
      body.data.some(
        (p: Project) =>
          p.title.toLowerCase().includes('hotlines') ||
          p.description.toLowerCase().includes('hotlines')
      )
    ).toBe(true);
  });

  it('paginates results end-to-end', async () => {
    const { body } = await workerJson(
      'http://localhost/api/projects?limit=3&page=1'
    );
    expect(body.data.length).toBeLessThanOrEqual(3);
    expect(body.meta.limit).toBe(3);
  });

  it('returns 400 for invalid status through the full worker', async () => {
    const res = await workerFetch('http://localhost/api/projects?status=bogus');
    expect(res.status).toBe(400);
  });

  it('all returned projects have required fields', async () => {
    const { body } = await workerJson('http://localhost/api/projects');
    for (const project of body.data) {
      expect(project.slug).toBeTruthy();
      expect(project.title).toBeTruthy();
      expect(project.description).toBeTruthy();
      expect(Array.isArray(project.repositoryUrls)).toBe(true);
      expect(project.projectUrl).toMatch(/^https:\/\//);
      expect(['active', 'development', 'archived']).toContain(project.status);
    }
  });
});
