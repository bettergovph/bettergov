// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  boundedEventStream,
  createDeadline,
  readBoundedText,
} from '../lib/bounded-io';

afterEach(() => vi.useRealTimers());
const encoder = new TextEncoder();

describe('bounded provider I/O', () => {
  it('returns the first SSE event before the upstream finishes, with identical bytes', async () => {
    vi.useFakeTimers();
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const deadline = createDeadline(new AbortController().signal, 1000);
    const reader = boundedEventStream(
      new ReadableStream({
        start(c) {
          source = c;
        },
      }),
      deadline,
      1000,
      500
    ).getReader();
    source.enqueue(encoder.encode('event: progress\ndata: {}\n\n'));
    expect((await reader.read()).value).toEqual(
      encoder.encode('event: progress\ndata: {}\n\n')
    );
    source.enqueue(encoder.encode('event: complete\ndata: {}\n\n'));
    source.close();
    expect((await reader.read()).value).toEqual(
      encoder.encode('event: complete\ndata: {}\n\n')
    );
    expect((await reader.read()).done).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels generation when the browser stops reading', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const deadline = createDeadline(new AbortController().signal, 1000);
    const stream = boundedEventStream(
      new ReadableStream({ cancel }),
      deadline,
      1000,
      500
    );
    await stream.cancel();
    await vi.advanceTimersByTimeAsync(0);
    expect(cancel).toHaveBeenCalledOnce();
    expect(deadline.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ends a silent stream and cancels the provider', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const deadline = createDeadline(new AbortController().signal, 1000);
    const result = new Response(
      boundedEventStream(new ReadableStream({ cancel }), deadline, 1000, 500)
    ).text();
    const rejected = expect(result).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(500);
    await rejected;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('enforces the total deadline even if events keep arriving', async () => {
    vi.useFakeTimers();
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const cancel = vi.fn();
    const deadline = createDeadline(new AbortController().signal, 1000);
    const result = new Response(
      boundedEventStream(
        new ReadableStream({
          start(c) {
            source = c;
          },
          cancel,
        }),
        deadline,
        1000,
        500
      )
    ).text();
    const rejected = expect(result).rejects.toThrow();
    for (let i = 0; i < 4; i++) {
      source.enqueue(encoder.encode(': ping\n\n'));
      await vi.advanceTimersByTimeAsync(250);
    }
    await rejected;
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects oversized provider streams and releases timers', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const deadline = createDeadline(new AbortController().signal, 1000);
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array(101));
      },
      cancel,
    });
    await expect(
      new Response(boundedEventStream(stream, deadline, 100, 500)).text()
    ).rejects.toThrow('Body is too large');
    await vi.advanceTimersByTimeAsync(0);
    expect(cancel).toHaveBeenCalledOnce();
    expect(deadline.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a deadline active while a JSON response body is stalled', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const deadline = createDeadline(new AbortController().signal, 1000);
    const result = readBoundedText(
      new ReadableStream({ cancel }),
      1000,
      deadline.signal
    );
    const rejected = expect(result).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(1000);
    await rejected;
    deadline.dispose();
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
