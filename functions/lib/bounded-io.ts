/** Limits are enforced on bytes read, not on a caller's Content-Length. */
export class BodyTooLargeError extends Error {
  constructor() {
    super('Body is too large');
  }
}

export function createDeadline(clientSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error('Request interrupted'));
  const timer = setTimeout(abort, timeoutMs);
  clientSignal.addEventListener('abort', abort, { once: true });
  if (clientSignal.aborted) abort();
  return {
    signal: controller.signal,
    abort,
    dispose() {
      clearTimeout(timer);
      clientSignal.removeEventListener('abort', abort);
    },
  };
}

export async function readBoundedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  signal: AbortSignal
): Promise<string> {
  if (signal.aborted) throw new Error('Request interrupted');
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false });
  let bytes = 0;
  let text = '';
  let onAbort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    onAbort = () => reject(new Error('Request interrupted'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), interrupted]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new BodyTooLargeError();
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    // A peer's cancellation callback must not hold up our error response.
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

/** Preserve SSE bytes and backpressure while bounding lifetime and volume. */
export function boundedEventStream(
  body: ReadableStream<Uint8Array>,
  deadline: ReturnType<typeof createDeadline>,
  maxBytes: number,
  idleTimeoutMs: number
): ReadableStream<Uint8Array> {
  let bytes = 0;
  let idleTimer = setTimeout(deadline.abort, idleTimeoutMs);
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) throw new BodyTooLargeError();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(deadline.abort, idleTimeoutMs);
      controller.enqueue(chunk);
    },
  });
  void body
    .pipeTo(transform.writable, { signal: deadline.signal })
    .catch(() => {
      // Includes client cancellation and byte/time limits; cancel generation.
      deadline.abort();
    })
    .finally(() => {
      clearTimeout(idleTimer);
      deadline.dispose();
    });
  return transform.readable;
}
