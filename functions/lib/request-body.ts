import {
  BodyTooLargeError,
  createDeadline,
  readBoundedText,
} from './bounded-io';

export const MAX_API_BODY_BYTES = 64 * 1024;
export const REQUEST_BODY_TIMEOUT_MS = 15_000;

type BodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

/** Shared JSON boundary for the assistant and public report form. */
export async function readJsonRequest(request: Request): Promise<BodyResult> {
  const fail = (error: string, status: number): BodyResult => ({
    ok: false,
    response: Response.json({ error }, { status }),
  });
  if (
    request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  ) {
    return fail('Content-Type must be application/json', 415);
  }
  if (Number(request.headers.get('Content-Length')) > MAX_API_BODY_BYTES) {
    if (request.body) void request.body.cancel().catch(() => {});
    return fail('Request body is too large', 413);
  }
  const deadline = createDeadline(request.signal, REQUEST_BODY_TIMEOUT_MS);
  try {
    const text = await readBoundedText(
      request.body,
      MAX_API_BODY_BYTES,
      deadline.signal
    );
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof BodyTooLargeError)
      return fail('Request body is too large', 413);
    if (deadline.signal.aborted) return fail('Request body timed out', 408);
    return fail('Invalid JSON in request body', 400);
  } finally {
    deadline.dispose();
  }
}
