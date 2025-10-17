import { Env } from '../types';

interface ReportHotlineRequest {
  hotlineName: string;
  issue: string;
  correctInfo?: string;
  source?: string;
  reporterEmail?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate Content-Type header
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Unsupported Media Type. Content-Type must be application/json',
      }),
      {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse JSON body with error handling
  let data: ReportHotlineRequest;
  try {
    data = await request.json();
  } catch (parseError) {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON in request body',
        message:
          parseError instanceof Error
            ? parseError.message
            : 'JSON parse failed',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Validate required fields
    if (!data.hotlineName || !data.issue) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: hotlineName and issue are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create GitHub issue via API
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          error: 'GitHub integration not configured',
          fallback:
            'Please report directly at https://github.com/bettergovph/bettergov/issues/new',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log report submission (no PII)
    console.log(
      `[Report Submission] Creating issue for hotline: "${data.hotlineName}"`
    );

    // Construct issue body (NO PII included)
    const issueBody = `## Hotline Information Issue

### Which hotline has outdated information?
${data.hotlineName}

### What is incorrect?
${data.issue}

${data.correctInfo ? `### What should it be?\n${data.correctInfo}\n\n` : ''}
${data.source ? `### Source\n${data.source}\n\n` : ''}
---
Reported via API from: /philippines/hotlines
Timestamp: ${new Date().toISOString()}`;

    // Create GitHub issue with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let githubResponse: Response;
    try {
      githubResponse = await fetch(
        'https://api.github.com/repos/bettergovph/bettergov/issues',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'BetterGov-Hotline-Reporter',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            title: `Outdated Hotline: ${data.hotlineName}`,
            body: issueBody,
            labels: ['hotline', 'data-update', 'user-report'],
          }),
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle abort/timeout error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('GitHub API request timed out');
        return new Response(
          JSON.stringify({
            error: 'Request timed out',
            message: 'GitHub API did not respond in time',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Handle other fetch errors (network issues, etc.)
      console.error('GitHub API fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to connect to GitHub',
          message:
            fetchError instanceof Error ? fetchError.message : 'Network error',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      // Log detailed error server-side for debugging
      console.error(
        `GitHub API error (status ${githubResponse.status}):`,
        errorText
      );
      // Return generic error to client without exposing sensitive details
      return new Response(
        JSON.stringify({
          error: 'Failed to create GitHub issue',
        }),
        {
          status: githubResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const githubData: unknown = await githubResponse.json();

    // Runtime validation of GitHub response
    if (
      !githubData ||
      typeof githubData !== 'object' ||
      !('html_url' in githubData) ||
      !('number' in githubData) ||
      typeof githubData.html_url !== 'string' ||
      typeof githubData.number !== 'number'
    ) {
      console.error(
        'Invalid GitHub API response structure:',
        JSON.stringify(githubData)
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to create GitHub issue',
          message: 'Invalid response from GitHub API',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const issue = {
      html_url: githubData.html_url,
      number: githubData.number,
    };

    // Log successful issue creation (no PII)
    console.log(
      `[Report Success] GitHub Issue #${issue.number} created for hotline: "${data.hotlineName}"`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Report submitted successfully',
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Log full error with stack trace to server console
    console.error('Error processing report:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Return sanitized error message based on environment
    const isProduction = env.NODE_ENV === 'production';
    const errorMessage = isProduction
      ? 'Internal server error'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return new Response(
      JSON.stringify({
        error: 'Failed to process report',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
