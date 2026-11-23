// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../index';
import type { Env } from '../types';

const limiter = { limit: async () => ({ success: true }) };
const baseEnv = {
  API_RATE_LIMITER: limiter,
  REPORT_RATE_LIMITER: limiter,
} as unknown as Env;
const configured = {
  ...baseEnv,
  NEWSLETTER_WEBHOOK_URL: 'https://mail.example.test/subscribe',
} as unknown as Env;
const ctx = {} as ExecutionContext;
const fetchMock = vi.fn<typeof fetch>();

const post = (env: Env, body: unknown) =>
  worker.fetch(
    new Request('https://www.gov.ph/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://www.gov.ph',
      },
      body: JSON.stringify(body),
    }),
    env,
    ctx
  );

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('answers 503 and sends nothing when no email service is configured', async () => {
    const response = await post(baseEnv, { email: 'reader@example.com' });
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a non-HTTPS webhook', async () => {
    const response = await post(
      {
        ...baseEnv,
        NEWSLETTER_WEBHOOK_URL: 'http://mail.example.test/subscribe',
      } as unknown as Env,
      { email: 'reader@example.com' }
    );
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['empty', ''],
    ['no at sign', 'reader.example.com'],
    ['spaces', 'a b@example.com'],
    ['no dot in domain', 'reader@example'],
    ['too long', `${'a'.repeat(250)}@example.com`],
  ])('rejects an invalid address (%s)', async (_label, email) => {
    const response = await post(configured, { email });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects unknown fields and non-string values', async () => {
    expect((await post(configured, { email: 1 })).status).toBe(400);
    expect(
      (await post(configured, { email: 'reader@example.com', role: 'admin' }))
        .status
    ).toBe(400);
  });

  it('forwards a valid address once and reports success', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const response = await post(configured, { email: ' reader@example.com ' });
    expect(response.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://mail.example.test/subscribe');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      email: 'reader@example.com',
      source: 'bettergov.ph',
    });
  });

  it('pretends success but forwards nothing when the hidden field is filled', async () => {
    const response = await post(configured, {
      email: 'bot@example.com',
      website: 'https://spam.example',
    });
    expect(response.status).toBe(202);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports 502 without logging the address when the service fails', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    const response = await post(configured, { email: 'reader@example.com' });
    expect(response.status).toBe(502);
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain('reader@example.com');
  });

  it('rejects other methods', async () => {
    const response = await worker.fetch(
      new Request('https://www.gov.ph/api/newsletter', {
        method: 'GET',
        headers: { Origin: 'https://www.gov.ph' },
      }),
      configured,
      ctx
    );
    expect(response.status).toBe(405);
  });
});
