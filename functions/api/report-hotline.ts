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

    // Check for GitHub token
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          error: 'GitHub integration not configured',
          message: 'Please contact the maintainers to report this issue',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Log report submission (no PII in logs)
    console.log(
      `[Report Submission] Creating GitHub issue for hotline: "${data.hotlineName}"`
    );

    // Construct GitHub issue body (no PII in public issue)
    const issueBody = `## Hotline Information Issue

### Which hotline has outdated information?
${data.hotlineName}

### What is incorrect?
${data.issue}

${data.correctInfo ? `### What should it be?\n${data.correctInfo}\n\n` : ''}
${data.source ? `### Source\n${data.source}\n\n` : ''}
---
Reported via community form from: /philippines/hotlines
Timestamp: ${new Date().toISOString()}

${data.reporterEmail ? `\n<!-- Reporter contact (private): ${data.reporterEmail} -->` : ''}`;

    // Create GitHub issue
    try {
      const githubResponse = await fetch(
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
            labels: ['hotline', 'data-update', 'community-report'],
          }),
        }
      );

      if (!githubResponse.ok) {
        const errorText = await githubResponse.text();
        console.error(
          `GitHub API error (status ${githubResponse.status}):`,
          errorText
        );
        return new Response(
          JSON.stringify({
            error: 'Failed to create GitHub issue',
            message: 'Please try again or contact the maintainers',
          }),
          {
            status: githubResponse.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const githubData: { html_url: string; number: number } =
        await githubResponse.json();

      console.log(
        `[Report Success] GitHub Issue #${githubData.number} created for hotline: "${data.hotlineName}"`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Report submitted successfully',
          issueUrl: githubData.html_url,
          issueNumber: githubData.number,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (githubError) {
      console.error('GitHub API error:', githubError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create GitHub issue',
          message:
            githubError instanceof Error
              ? githubError.message
              : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
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
