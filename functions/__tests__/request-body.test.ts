// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_API_BODY_BYTES,
  REQUEST_BODY_TIMEOUT_MS,
  readJsonRequest,
} from '../lib/request-body';

const request = (
  body: BodyInit,
  headers: HeadersInit = { 'Content-Type': 'application/json' }
) =>
  new Request('https://www.gov.ph/api/assistant', {
    method: 'POST',
    headers,
    body,
    ...{ duplex: 'half' },
  });

afterEach(() => vi.useRealTimers());

describe('bounded JSON input', () => {
  it('preserves valid UTF-8 JSON across arbitrary chunk boundaries', async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ question: 'Kumusta po — 🇵🇭' })
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
        controller.close();
      },
    });
    expect(await readJsonRequest(request(body))).toEqual({
      ok: true,
      value: { question: 'Kumusta po — 🇵🇭' },
    });
  });

  it.each(['text/plain', 'application/jsonx', 'text/application/json'])(
    'rejects misleading content type %s',
    async type => {
      const result = await readJsonRequest(
        request('{}', { 'Content-Type': type })
      );
      expect(!result.ok && result.response.status).toBe(415);
    }
  );

  it('accepts a JSON charset parameter', async () => {
    expect(
      (
        await readJsonRequest(
          request('{}', { 'Content-Type': 'Application/JSON; charset=utf-8' })
        )
      ).ok
    ).toBe(true);
  });

  it.each([undefined, '1', String(MAX_API_BODY_BYTES + 1)])(
    'rejects excess bytes regardless of claimed length %s',
    async length => {
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_API_BODY_BYTES + 1));
        },
        cancel,
      });
      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (length) headers.set('Content-Length', length);
      const result = await readJsonRequest(request(body, headers));
      expect(!result.ok && result.response.status).toBe(413);
      expect(cancel).toHaveBeenCalled();
    }
  );

  it('counts UTF-8 bytes rather than characters', async () => {
    const result = await readJsonRequest(
      request(JSON.stringify({ question: '漢'.repeat(24000) }))
    );
    expect(!result.ok && result.response.status).toBe(413);
  });

  it('sanitizes JSON parser errors', async () => {
    const result = await readJsonRequest(
      request('{"private":"never-echo-this"')
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(await result.response.text()).not.toContain('never-echo-this');
    }
  });

  it('stops a stalled body without waiting for a peer to finish cancellation', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const pending = readJsonRequest(request(new ReadableStream({ cancel })));
    await vi.advanceTimersByTimeAsync(REQUEST_BODY_TIMEOUT_MS);
    const result = await pending;
    expect(!result.ok && result.response.status).toBe(408);
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels reading when the caller disconnects', async () => {
    const abort = new AbortController();
    const cancel = vi.fn();
    const req = new Request(request(new ReadableStream({ cancel })), {
      signal: abort.signal,
    });
    const pending = readJsonRequest(req);
    abort.abort();
    const result = await pending;
    expect(!result.ok && result.response.status).toBe(408);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
