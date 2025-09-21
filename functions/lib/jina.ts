import { Env, JinaResponse, JinaRecord } from '../types';

/**
 * Fetches content from a URL using the Jina.ai API
 * @param env Environment variables including the Jina API key
 * @param url The URL to fetch content from
 * @returns Promise with the Jina API response
 */
export async function fetchJinaContent(
  env: Env,
  url: string
): Promise<JinaResponse> {
  // Check if API key is available
  const apiKey = env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('Jina API key not found in environment variables');
  }

  console.log('Fetching from Jina API for URL:', url, apiKey);
  try {
    // Make the request to Jina.ai API
    const response = await fetch(
      `https://r.jina.ai/${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Retain-Images': 'none',
          'X-Proxy': 'ph',
          'X-With-Links-Summary': 'true',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Jina API error: ${response.status} ${response.statusText}`
      );
    }

    // Parse the response
    const data = await response.json();

    console.log('Jina response:', data);

    // Format the response
    const jinaResponse: JinaResponse = {
      id: data.id || crypto.randomUUID(),
      url: url,
      title: data.title || 'No title',
      content: data.content || '',
      links_summary: data.links_summary || data.links || [],
      timestamp: Date.now(),
    };

    return jinaResponse;
  } catch (error) {
    console.error('Error fetching from Jina API:', error);
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
 * Saves Jina content to the D1 database using the pages and links tables
 * @param env Environment with D1 database
 * @param data Jina response data to save
 * @returns Promise with the database operation result
 */
export async function saveJinaContent(
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
          } catch {
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

/**
 * Retrieves Jina content from the database by URL
 * @param env Environment with D1 database
 * @param url URL to look up
 * @returns Promise with the record or null if not found
 */
export async function getJinaContentByUrl(
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
 * Fetches content from Jina API and saves to database
 * @param env Environment variables
 * @param url URL to fetch content for
 * @returns Promise with the operation result
 */
export async function fetchAndSaveJinaContent(
  env: Env,
  url: string
): Promise<{
  success: boolean;
  data?: JinaResponse;
  message?: string;
  error?: string;
}> {
  try {
    // Fetch from Jina API
    const jinaData = await fetchJinaContent(env, url);

    if (jinaData.error) {
      return {
        success: false,
        message: 'Failed to fetch content from Jina API',
        error: jinaData.error,
      };
    }

    // Save to database
    const saveResult = await saveJinaContent(env, jinaData);

    if (!saveResult.success) {
      return {
        success: false,
        data: jinaData,
        message: 'Fetched from Jina API but failed to save to database',
        error: saveResult.message,
      };
    }

    return {
      success: true,
      data: jinaData,
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
