import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../types';
import {
  COMING_SOON_ASSETS,
  comingSoonResponse,
  isComingSoon,
} from '../coming-soon';

const assets = { fetch: vi.fn(async () => new Response('asset')) };
const env = { ASSETS: assets } as unknown as Env;
const req = (url: string, method = 'GET') => new Request(url, { method });

describe('isComingSoon', () => {
  it('gates only the public hostnames by default', () => {
    expect(isComingSoon('www.gov.ph', env)).toBe(true);
    expect(isComingSoon('gov.ph', env)).toBe(true);
    expect(isComingSoon('WWW.GOV.PH', env)).toBe(true);
    expect(isComingSoon('govph-dev.govph.workers.dev', env)).toBe(false);
    expect(isComingSoon('preview-govph-dev.govph.workers.dev', env)).toBe(
      false
    );
    expect(isComingSoon('localhost', env)).toBe(false);
  });

  it('honours the COMING_SOON switch in both directions', () => {
    const off = { COMING_SOON: 'off' } as Env;
    const on = { COMING_SOON: ' ON ' } as Env;
    expect(isComingSoon('www.gov.ph', off)).toBe(false);
    expect(isComingSoon('govph-dev.govph.workers.dev', on)).toBe(true);
    expect(isComingSoon('www.gov.ph', { COMING_SOON: 'maybe' } as Env)).toBe(
      true
    );
  });
});

describe('comingSoonResponse', () => {
  it('leaves ungated hostnames alone', async () => {
    expect(
      await comingSoonResponse(req('https://govph-dev.govph.workers.dev/'), env)
    ).toBeNull();
    expect(
      await comingSoonResponse(
        req('https://govph-dev.govph.workers.dev/api/status'),
        env
      )
    ).toBeNull();
  });

  it('serves the placeholder page for every page and bundle path', async () => {
    for (const path of [
      '/',
      '/services',
      '/government/departments/dfa',
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
      '/sitemap.xml',
      '/llms.txt',
    ]) {
      const response = await comingSoonResponse(
        req(`https://www.gov.ph${path}`),
        env
      );
      expect(response?.status, path).toBe(200);
      expect(response?.headers.get('Content-Type')).toContain('text/html');
      expect(response?.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      expect(response?.headers.get('Cache-Control')).toBe('no-store');
      expect(response?.headers.get('Content-Security-Policy')).toContain(
        "default-src 'none'"
      );
      const html = await response!.text();
      expect(html).toContain('GOV.PH');
      expect(html).toContain('being prepared for launch');
      expect(html).not.toContain('<script');
    }
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('leaves the API routes alone even on the public hostname', async () => {
    for (const path of [
      '/api/status',
      '/api/assistant/stream',
      '/api/search?q=passport',
      '/weather',
      '/forex',
    ]) {
      const response = await comingSoonResponse(
        req(
          `https://www.gov.ph${path}`,
          path.includes('assistant') ? 'POST' : 'GET'
        ),
        env
      );
      expect(response, path).toBeNull();
    }
  });

  it('tells crawlers to stay away', async () => {
    const response = await comingSoonResponse(
      req('https://www.gov.ph/robots.txt'),
      env
    );
    expect(response?.status).toBe(200);
    await expect(response!.text()).resolves.toBe(
      'User-agent: *\nDisallow: /\n'
    );
  });

  it('lets only the brand assets the page needs through to static assets', async () => {
    assets.fetch.mockClear();
    for (const path of COMING_SOON_ASSETS) {
      const response = await comingSoonResponse(
        req(`https://www.gov.ph${path}`),
        env
      );
      await expect(response!.text()).resolves.toBe('asset');
    }
    expect(assets.fetch).toHaveBeenCalledTimes(COMING_SOON_ASSETS.size);
    expect(COMING_SOON_ASSETS.has('/assets/index-abc123.js')).toBe(false);
  });

  it('falls back to the page for a listed asset when no ASSETS binding exists', async () => {
    const response = await comingSoonResponse(
      req('https://www.gov.ph/coat-of-arms.svg'),
      {} as Env
    );
    expect(response?.headers.get('Content-Type')).toContain('text/html');
  });
});
