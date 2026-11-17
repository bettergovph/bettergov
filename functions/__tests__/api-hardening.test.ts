// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';
import {
  resolveEgovAiBaseUrl,
  STREAM_UPSTREAM_TIMEOUT_MS,
} from '../api/assistant';
import { REPORT_UPSTREAM_TIMEOUT_MS } from '../api/report-hotline';
import { MAX_API_BODY_BYTES } from '../lib/request-body';

const limiter = { limit: async () => ({ success: true }) };
const env = {
  API_RATE_LIMITER: limiter,
  ASSISTANT_RATE_LIMITER: limiter,
  REPORT_RATE_LIMITER: limiter,
  EGOVAI_BASE_URL: 'https://assistant.example.test',
  EGOVAI_API_KEY: 'dummy-test-key',
  EGOVAI_API_SECRET: 'dummy-test-secret',
  GITHUB_TOKEN: 'dummy-test-github',
} as unknown as Env;
const ctx = {} as ExecutionContext;
const fetchMock = vi.fn<typeof fetch>();
const call = (path: string, body: unknown, headers: HeadersInit = {}) =>
  worker.fetch(
    new Request(`https://www.gov.ph${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.gov.ph',
        ...headers,
      },
      body: JSON.stringify(body),
    }),
    env,
    ctx
  );
const issue = () =>
  Response.json(
    { number: 12, html_url: 'https://github.com/govph/govph-2026/issues/12' },
    { status: 201 }
  );

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Worker API protection', () => {
  it.each(['/api/assistant', '/api/assistant/stream', '/api/report-hotline'])(
    'rejects oversized %s before a provider call and retains response protections',
    async path => {
      const response = await call(path, {
        question: 'Hello',
        hotlineName: 'Audit',
        issue: 'Test',
        unused: 'x'.repeat(MAX_API_BODY_BYTES),
      });
      expect(response.status).toBe(413);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://www.gov.ph'
      );
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    null,
    [],
    { hotlineName: {}, issue: ['incorrect'] },
    { hotlineName: ' ', issue: 'incorrect' },
    { hotlineName: 'a'.repeat(201), issue: 'incorrect' },
    { hotlineName: 'Audit', issue: 'a'.repeat(4001) },
    { hotlineName: 'Audit', issue: 'incorrect', correctInfo: 42 },
    { hotlineName: 'Audit', issue: 'incorrect', source: 'javascript:alert(1)' },
    {
      hotlineName: 'Audit',
      issue: 'incorrect',
      source: 'https://user:pass@example.test',
    },
    { hotlineName: 'Audit', issue: 'incorrect', unexpected: 'field' },
  ])('rejects an invalid report without creating an issue: %j', async body => {
    expect((await call('/api/report-hotline', body)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts current and older report clients without forwarding a private email', async () => {
    for (const legacy of [false, true]) {
      fetchMock.mockResolvedValueOnce(issue());
      const response = await call('/api/report-hotline', {
        hotlineName: '  Emergency Hotline  ',
        issue: 'Incorrect number',
        correctInfo: '',
        source: 'https://www.gov.ph/',
        ...(legacy ? { reporterEmail: 'private@example.invalid' } : {}),
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toMatchObject({
        success: true,
        issueNumber: 12,
      });
      const [url, init] = fetchMock.mock.calls.at(-1)!;
      expect(url).toBe('https://api.github.com/repos/govph/govph-2026/issues');
      expect(init?.redirect).toBe('manual');
      expect(init?.signal).toBeDefined();
      expect(String(init?.body)).not.toContain('private@example.invalid');
      expect(String(init?.body)).not.toContain('Reporter contact');
      expect(JSON.parse(String(init?.body)).title).toBe(
        'Outdated Hotline: Emergency Hotline'
      );
    }
  });

  it.each(['/api/assistant', '/api/assistant/stream', '/api/report-hotline'])(
    'rejects credential-bearing upstream redirects for %s',
    async path => {
      fetchMock.mockResolvedValueOnce(
        new Response(null, {
          status: 307,
          headers: { Location: 'https://foreign.example.test/' },
        })
      );
      const response = await call(
        path,
        path.includes('assistant')
          ? { question: 'Hello' }
          : { hotlineName: 'Audit', issue: 'incorrect' }
      );
      expect(response.status).toBe(502);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][1]?.redirect).toBe('manual');
      expect(response.headers.has('Location')).toBe(false);
    }
  );

  it.each([
    'http://assistant.example.test',
    'https://user:pass@assistant.example.test',
    'https://assistant.example.test/?token=secret',
    'https://assistant.example.test/#fragment',
  ])('rejects insecure or ambiguous assistant config: %s', url => {
    expect(resolveEgovAiBaseUrl(url)).toBeNull();
  });

  it('bounds report fetch duration without automatically retrying the write', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener(
            'abort',
            () => reject(new Error('sensitive provider diagnostic')),
            { once: true }
          );
        })
    );
    const pending = call('/api/report-hotline', {
      hotlineName: 'Audit',
      issue: 'incorrect',
    });
    await vi.advanceTimersByTimeAsync(REPORT_UPSTREAM_TIMEOUT_MS + 1);
    const response = await pending;
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(
      'sensitive provider diagnostic'
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('also bounds an assistant stream that never receives upstream headers', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener(
            'abort',
            () => reject(new Error('timeout')),
            { once: true }
          );
        })
    );
    const pending = call('/api/assistant/stream', { question: 'Hello' });
    await vi.advanceTimersByTimeAsync(STREAM_UPSTREAM_TIMEOUT_MS + 1);
    expect((await pending).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds JSON responses without leaking a provider payload', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ answer: 'x'.repeat(2 * 1024 * 1024) })
    );
    const response = await call('/api/assistant', { question: 'Hello' });
    expect(response.status).toBe(502);
    expect((await response.text()).length).toBeLessThan(200);
  });

  it('rejects an unexpected report success URL', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ number: 1, html_url: 'https://foreign.example.test/' })
    );
    expect(
      (
        await call('/api/report-hotline', {
          hotlineName: 'Audit',
          issue: 'incorrect',
        })
      ).status
    ).toBe(502);
  });

  it('preserves report rate-limit advice while suppressing provider details', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ message: 'private provider details' }, { status: 429 })
    );
    const response = await call('/api/report-hotline', {
      hotlineName: 'Audit',
      issue: 'incorrect',
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(await response.text()).not.toContain('private provider details');
  });
});
