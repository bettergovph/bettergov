import { Env } from '../types';
import { createDeadline, readBoundedText } from '../lib/bounded-io';
import { readJsonRequest } from '../lib/request-body';

export const REPORT_UPSTREAM_TIMEOUT_MS = 8_000;
const FIELD_LIMITS = {
  hotlineName: 200,
  issue: 4000,
  correctInfo: 4000,
  source: 2048,
  // Accepted only for older open tabs; never logged, stored, or forwarded.
  reporterEmail: 254,
};

interface ReportHotlineRequest {
  hotlineName: string;
  issue: string;
  correctInfo: string;
  source: string;
}

function parseReport(value: unknown): ReportHotlineRequest | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  const body = value as Record<string, unknown>;
  for (const [name, field] of Object.entries(body)) {
    if (
      !Object.hasOwn(FIELD_LIMITS, name) ||
      typeof field !== 'string' ||
      field.length > FIELD_LIMITS[name as keyof typeof FIELD_LIMITS]
    )
      return null;
  }
  const hotlineName = (body.hotlineName as string | undefined)?.trim() ?? '';
  const issue = (body.issue as string | undefined)?.trim() ?? '';
  const correctInfo = (body.correctInfo as string | undefined)?.trim() ?? '';
  const source = (body.source as string | undefined)?.trim() ?? '';
  if (
    !hotlineName ||
    !issue ||
    /[\r\n]/.test(hotlineName) ||
    hotlineName.includes('\0')
  )
    return null;
  if (source) {
    try {
      const url = new URL(source);
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        return null;
    } catch {
      return null;
    }
  }
  return { hotlineName, issue, correctInfo, source };
}

const error = (message: string, status: number, headers?: HeadersInit) =>
  Response.json({ error: message }, { status, headers });

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
  const input = await readJsonRequest(request);
  if (!input.ok) return input.response;
  const data = parseReport(input.value);
  if (!data)
    return error('Invalid report. Check the fields and their lengths.', 400);
  const githubToken = env.GITHUB_TOKEN?.trim();
  if (!githubToken) return error('GitHub integration not configured', 503);

  const issueBody = `## Hotline Information Issue

### Which hotline has outdated information?
${data.hotlineName}

### What is incorrect?
${data.issue}

${data.correctInfo ? `### What should it be?\n${data.correctInfo}\n\n` : ''}
${data.source ? `### Source\n${data.source}\n\n` : ''}
---
Reported via community form from: /philippines/hotlines
Timestamp: ${new Date().toISOString()}`;

  const deadline = createDeadline(request.signal, REPORT_UPSTREAM_TIMEOUT_MS);
  try {
    if (deadline.signal.aborted) throw new Error('Request interrupted');
    // Do not retry a write automatically: a timed-out request may have succeeded.
    const response = await fetch(
      'https://api.github.com/repos/govph/govph-2026/issues',
      {
        method: 'POST',
        redirect: 'manual',
        signal: deadline.signal,
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GOVPH-Hotline-Reporter',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          title: `Outdated Hotline: ${data.hotlineName}`,
          body: issueBody,
          labels: ['hotline', 'data-update', 'community-report'],
        }),
      }
    );
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      console.error(`[report] GitHub returned ${response.status}`);
      if (
        response.status === 429 ||
        (response.status === 403 &&
          response.headers.get('X-RateLimit-Remaining') === '0')
      ) {
        return error('Too many reports. Please try again later.', 429, {
          'Retry-After': '60',
        });
      }
      return error('Unable to submit report right now.', 502);
    }
    if (
      response.headers
        .get('Content-Type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json'
    ) {
      void response.body?.cancel().catch(() => {});
      throw new Error('Invalid response');
    }
    const result: unknown = JSON.parse(
      await readBoundedText(response.body, 256 * 1024, deadline.signal)
    );
    if (typeof result !== 'object' || result === null || Array.isArray(result))
      throw new Error('Invalid response');
    const { number, html_url: issueUrl } = result as Record<string, unknown>;
    if (
      typeof number !== 'number' ||
      !Number.isSafeInteger(number) ||
      number <= 0 ||
      issueUrl !== `https://github.com/govph/govph-2026/issues/${number}`
    )
      throw new Error('Invalid response');
    return Response.json(
      {
        success: true,
        message: 'Report submitted successfully',
        issueUrl,
        issueNumber: number,
      },
      { status: 201 }
    );
  } catch {
    deadline.abort();
    console.error('[report] Unable to submit report');
    return error(
      'Unable to confirm submission. Please check the issue list before retrying.',
      502
    );
  } finally {
    deadline.dispose();
  }
}
