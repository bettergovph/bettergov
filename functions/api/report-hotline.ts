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

    // Log report submission (no PII in logs)
    console.log(
      `[Report Submission] Received report for hotline: "${data.hotlineName}"`
    );

    // Construct email body
    const emailBody = `
New Hotline Report Submission
=============================

Hotline Name: ${data.hotlineName}

What is incorrect:
${data.issue}

${data.correctInfo ? `What should it be:\n${data.correctInfo}\n\n` : ''}
${data.source ? `Source:\n${data.source}\n\n` : ''}
${data.reporterEmail ? `Reporter Email: ${data.reporterEmail}\n\n` : ''}
---
Reported from: /philippines/hotlines
Timestamp: ${new Date().toISOString()}
    `.trim();

    // Send email using Cloudflare Email Workers (MailChannels)
    // This is a free service available on Cloudflare Workers
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: 'bugs@bettergov.ph', name: 'BetterGov Team' }],
        },
      ],
      from: {
        email: 'noreply@bettergov.ph',
        name: 'BetterGov Hotline Reporter',
      },
      subject: `Hotline Report: ${data.hotlineName}`,
      content: [
        {
          type: 'text/plain',
          value: emailBody,
        },
      ],
    };

    // Try to send email via MailChannels (free on Cloudflare Workers)
    try {
      const emailResponse = await fetch(
        'https://api.mailchannels.net/tx/v1/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error(
          `Email sending failed (status ${emailResponse.status}):`,
          errorText
        );
        // Don't fail the request - just log it
        console.log(
          '[Fallback] Report logged to console for manual processing'
        );
      } else {
        console.log('[Report Success] Email sent successfully');
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      console.log('[Fallback] Report logged to console for manual processing');
    }

    // Always log the full report to console for backup
    console.log(
      '[Report Details]',
      JSON.stringify({
        hotlineName: data.hotlineName,
        issue: data.issue,
        correctInfo: data.correctInfo,
        source: data.source,
        hasEmail: !!data.reporterEmail,
        timestamp: new Date().toISOString(),
      })
    );

    // Return success to user regardless of email status
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Report submitted successfully',
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
