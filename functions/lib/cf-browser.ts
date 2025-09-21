import { Env, JinaResponse, JinaRecord, CFBrowserResult } from '../types';

/**
 * Fetches content from a URL using Cloudflare's Browser Rendering API
 * @param env Environment variables including the Cloudflare API token and account ID
 * @param url The URL to fetch content from
 * @returns Promise with the response formatted to match JinaResponse interface
 */
export async function fetchCFBrowserContent(
  env: Env,
  url: string
): Promise<JinaResponse> {
  console.log('Fetching content from Cloudflare Browser API for URL:', url);
  // Check if API credentials are available
  const accountId = env.CF_ACCOUNT_ID;
  const apiToken = env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare account ID or API token not found in environment variables'
    );
  }

  try {
    // Prepare the request to Cloudflare's Browser Rendering API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          prompt:
            'Extract the main content of this page. Also get me the list of links from the page. Make the friendly_name to be end-user non-technical friendly.',
          response_format: {
            type: 'json_schema',
            json_schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                },
                content: {
                  type: 'string',
                },
                links: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                      friendly_name: {
                        type: 'string',
                        description:
                          'End-user non-technical friendly name for the link. Always include the entity it belongs to. Example: "Department of Finance Latest News"',
                      },
                      link: {
                        type: 'string',
                        description:
                          'The URL of the link. Always include the full URL.',
                      },
                    },
                    required: ['name'],
                  },
                },
              },
              required: ['title', 'content'],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Cloudflare Browser API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse the response
    const cfResponse = (await response.json()) as CFBrowserResult;

    console.log('Cloudflare Browser response:', cfResponse);

    if (!cfResponse.success) {
      throw new Error(
        `Cloudflare Browser API error: ${cfResponse.errors.join(', ')}`
      );
    }

    // Format the response to match JinaResponse
    const jinaResponse: JinaResponse = {
      id: crypto.randomUUID(),
      url: url,
      title: cfResponse.result.title || 'No title',
      content: cfResponse.result.content || '',
      links_summary: cfResponse.result.links || [],
      timestamp: Date.now(),
    };

    return jinaResponse;
  } catch (error) {
    console.error('Error fetching from Cloudflare Browser API:', error);
    return {
      id: crypto.randomUUID(),
      url: url,
      title: 'Error',
      content: '',
      timestamp: Date.now(),
      status: 'error',
      error: (error as Error).message,
    };
  }
}

/**
 * Saves Cloudflare Browser content to the D1 database
 * Uses the pages and links tables from the schema
 * @param env Environment with D1 database
 * @param data Response data to save
 * @returns Promise with the database operation result
 */
export async function saveCFBrowserContent(
  env: Env,
  data: JinaResponse
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    // Generate a UUID for the page if not provided
    const pageId = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert the page data
    await env.BETTERGOV_DB.prepare(
      `
      INSERT INTO pages (
        id, url, title, raw_content, cleaned_content, summary,
        last_crawled, status, content_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        raw_content = excluded.raw_content,
        cleaned_content = excluded.cleaned_content,
        summary = excluded.summary,
        last_crawled = excluded.last_crawled,
        status = excluded.status,
        content_hash = excluded.content_hash,
        updated_at = excluded.updated_at
      `
    )
      .bind(
        pageId,
        data.url,
        data.title,
        data.content, // raw_content
        data.content, // cleaned_content (same as raw for now)
        '', // summary (empty for now)
        now, // last_crawled
        'completed', // status
        crypto.createHash('md5').update(data.content).digest('hex'), // content_hash
        now, // created_at
        now // updated_at
      )
      .run();

    // Process and save links if available
    if (data.links_summary && data.links_summary.length > 0) {
      for (let i = 0; i < data.links_summary.length; i++) {
        const link = data.links_summary[i];
        const linkId = crypto.randomUUID();

        await env.BETTERGOV_DB.prepare(
          `
          INSERT INTO links (
            id, source_page_id, target_url, anchor_text, position_in_page, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          `
        )
          .bind(
            linkId,
            pageId,
            link.link || '',
            link.name || '',
            i, // position_in_page
            now // created_at
          )
          .run();

        // Optionally add to crawl queue
        if (link.link && link.link.startsWith('http')) {
          const queueId = crypto.randomUUID();
          try {
            await env.BETTERGOV_DB.prepare(
              `
              INSERT INTO crawl_queue (
                id, url, priority, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(url) DO NOTHING
              `
            )
              .bind(
                queueId,
                link.link,
                0, // priority
                'pending', // status
                now, // created_at
                now // updated_at
              )
              .run();
          } catch (linkError) {
            // Ignore errors on queue insertion - likely duplicate URLs
            console.log(
              'Skipped adding duplicate URL to crawl queue:',
              link.link
            );
          }
        }
      }
    }

    return {
      success: true,
      message: 'Content saved to database',
      id: pageId,
    };
  } catch (error) {
    console.error('Error saving to database:', error);
    return {
      success: false,
      message: `Database error: ${(error as Error).message}`,
    };
  }
}

// Note: We're not creating tables here anymore since we're using the schema from db.sql

/**
 * Retrieves content from the database by URL
 * @param env Environment with D1 database
 * @param url URL to look up
 * @returns Promise with the record or null if not found
 */
export async function getCFBrowserContentByUrl(
  env: Env,
  url: string
): Promise<JinaRecord | null> {
  try {
    // Query the pages table
    const page = await env.BETTERGOV_DB.prepare(
      `
      SELECT id, url, title, raw_content as content, last_crawled
      FROM pages WHERE url = ? ORDER BY last_crawled DESC LIMIT 1
      `
    )
      .bind(url)
      .first<any>();

    if (!page) return null;

    // Get links for this page
    const links = await env.BETTERGOV_DB.prepare(
      `
      SELECT id, target_url as link, anchor_text as name
      FROM links WHERE source_page_id = ? ORDER BY position_in_page ASC
      `
    )
      .bind(page.id)
      .all<any>();

    // Convert to JinaRecord format for compatibility
    const record: JinaRecord = {
      id: page.id,
      url: page.url,
      title: page.title,
      content: page.content,
      links_summary: links?.results ? JSON.stringify(links.results) : '',
      timestamp: new Date(page.last_crawled).getTime(),
      created_at: page.last_crawled,
    };

    return record;
  } catch (error) {
    console.error('Error retrieving from database:', error);
    return null;
  }
}

/**
 * Fetches content from URL and saves to database
 * @param env Environment variables
 * @param url URL to fetch content for
 * @returns Promise with the operation result
 */
export async function fetchAndSaveCFBrowserContent(
  env: Env,
  url: string
): Promise<{
  success: boolean;
  data?: JinaResponse;
  message?: string;
  error?: string;
}> {
  try {
    // Fetch from Cloudflare Browser API
    const data = await fetchCFBrowserContent(env, url);

    if (data.error) {
      return {
        success: false,
        message: 'Failed to fetch content from Cloudflare Browser API',
        error: data.error,
      };
    }

    // Save to database
    const saveResult = await saveCFBrowserContent(env, data);

    if (!saveResult.success) {
      return {
        success: false,
        data: data,
        message:
          'Fetched from Cloudflare Browser API but failed to save to database',
        error: saveResult.message,
      };
    }

    return {
      success: true,
      data: data,
      message: 'Successfully fetched and saved content',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error in fetch and save operation',
      error: (error as Error).message,
    };
  }
}
