import { Env } from '../types';
import { createDeadline } from '../lib/bounded-io';
import { readJsonRequest } from '../lib/request-body';

export const NEWSLETTER_UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_EMAIL_LENGTH = 254;
// Deliberately simple: one "@", no spaces, a dot in the domain. The email
// service does the real verification (a confirmation email).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

const error = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ error: message }, { status, headers });

interface SignupRequest {
  email: string;
  // Hidden field real visitors never fill in; bots often do.
  trap: boolean;
}

function parseSignup(value: unknown): SignupRequest | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  const body = value as Record<string, unknown>;
  for (const [name, field] of Object.entries(body)) {
    if (name !== 'email' && name !== 'website') return null;
    if (typeof field !== 'string') return null;
  }
  const email = (body.email as string | undefined)?.trim() ?? '';
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email) ||
    email.includes('\0')
  )
    return null;
  const website = (body.website as string | undefined) ?? '';
  return { email, trap: website.trim().length > 0 };
}

function webhookUrl(env: Env): URL | null {
  const raw = env.NEWSLETTER_WEBHOOK_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

/**
 * Newsletter sign-up. The service that stores addresses and sends the emails
 * is not chosen yet, so this only forwards a valid address to
 * NEWSLETTER_WEBHOOK_URL when a maintainer sets one. Without it the endpoint
 * answers 503 and nothing is stored, logged or sent.
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return error('Method not allowed. Use POST.', 405, {
      Allow: 'POST, OPTIONS',
    });
  }
  const target = webhookUrl(env);
  if (!target) return error('Newsletter sign-up is not available yet.', 503);

  const input = await readJsonRequest(request);
  if (!input.ok) return input.response;
  const data = parseSignup(input.value);
  if (!data) return error('Enter a valid email address.', 400);
  // Look successful to bots without forwarding anything.
  if (data.trap) return Response.json({ success: true }, { status: 202 });

  const deadline = createDeadline(
    request.signal,
    NEWSLETTER_UPSTREAM_TIMEOUT_MS
  );
  try {
    if (deadline.signal.aborted) throw new Error('Request interrupted');
    // Do not retry automatically: a timed-out request may have succeeded.
    const response = await fetch(target, {
      method: 'POST',
      redirect: 'manual',
      signal: deadline.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        source: 'bettergov.ph',
        subscribedAt: new Date().toISOString(),
      }),
    });
    void response.body?.cancel().catch(() => {});
    if (!response.ok) {
      // Never log the address.
      console.error(`[newsletter] Provider returned ${response.status}`);
      return error('Unable to subscribe right now. Please try again.', 502);
    }
    return Response.json({ success: true }, { status: 202 });
  } catch {
    deadline.abort();
    console.error('[newsletter] Unable to reach the provider');
    return error('Unable to subscribe right now. Please try again.', 502);
  } finally {
    deadline.dispose();
  }
}
