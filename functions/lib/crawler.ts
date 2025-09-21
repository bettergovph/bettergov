import { Env, JinaResponse, JinaRecord } from '../types';
import { fetchJinaContent, saveJinaContent, getJinaContentByUrl } from './jina';
import {
  fetchCFBrowserContent,
  saveCFBrowserContent,
  getCFBrowserContentByUrl,
} from './cf-browser';

/**
 * Interface for any web crawler implementation
 */
export interface WebCrawler {
  fetchContent(env: Env, url: string): Promise<JinaResponse>;
  saveContent(
    env: Env,
    data: JinaResponse
  ): Promise<{ success: boolean; message: string; id?: string }>;
  getContentByUrl(env: Env, url: string): Promise<JinaRecord | null>;
}

/**
 * Jina.ai implementation of the WebCrawler interface
 */
export class JinaCrawler implements WebCrawler {
  async fetchContent(env: Env, url: string): Promise<JinaResponse> {
    return fetchJinaContent(env, url);
  }

  async saveContent(
    env: Env,
    data: JinaResponse
  ): Promise<{ success: boolean; message: string; id?: string }> {
    return saveJinaContent(env, data);
  }

  async getContentByUrl(env: Env, url: string): Promise<JinaRecord | null> {
    return getJinaContentByUrl(env, url);
  }
}

/**
 * Cloudflare Browser Rendering API implementation of the WebCrawler interface
 */
export class CFBrowserCrawler implements WebCrawler {
  async fetchContent(env: Env, url: string): Promise<JinaResponse> {
    return fetchCFBrowserContent(env, url);
  }

  async saveContent(
    env: Env,
    data: JinaResponse
  ): Promise<{ success: boolean; message: string; id?: string }> {
    return saveCFBrowserContent(env, data);
  }

  async getContentByUrl(env: Env, url: string): Promise<JinaRecord | null> {
    return getCFBrowserContentByUrl(env, url);
  }
}

// Available crawler implementations
const crawlers = {
  jina: new JinaCrawler(),
  cfbrowser: new CFBrowserCrawler(),
};

// Default crawler instance - can be changed based on environment or config
let defaultCrawler: WebCrawler = crawlers.jina;

/**
 * Get the active web crawler implementation
 * This function allows for easy switching between different crawler implementations
 * @param type Optional crawler type to use (overrides default)
 * @returns The requested crawler implementation
 */
export function getCrawler(type?: string): WebCrawler {
  // If a specific type is requested, use that
  if (type && type in crawlers) {
    return crawlers[type as keyof typeof crawlers];
  }

  // Otherwise return the default crawler
  return defaultCrawler;
}

/**
 * Set the default crawler implementation
 * @param type The crawler type to set as default
 */
export function setDefaultCrawler(type: string): void {
  if (type in crawlers) {
    defaultCrawler = crawlers[type as keyof typeof crawlers];
    console.log(`Default crawler set to: ${type}`);
  } else {
    console.error(
      `Invalid crawler type: ${type}. Available types: ${Object.keys(
        crawlers
      ).join(', ')}`
    );
  }
}

/**
 * Fetches content from a URL using the active web crawler
 * @param env Environment variables
 * @param url The URL to fetch content from
 * @param crawlerType Optional crawler type to use
 * @returns Promise with the crawler response
 */
export async function fetchContent(
  env: Env,
  url: string,
  crawlerType?: string
): Promise<JinaResponse> {
  return getCrawler(crawlerType).fetchContent(env, url);
}

/**
 * Saves crawler content to the database
 * @param env Environment with database
 * @param data Crawler response data to save
 * @param crawlerType Optional crawler type to use
 * @returns Promise with the database operation result
 */
export async function saveContent(
  env: Env,
  data: JinaResponse,
  crawlerType?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  return getCrawler(crawlerType).saveContent(env, data);
}

/**
 * Retrieves crawler content from the database by URL
 * @param env Environment with database
 * @param url URL to look up
 * @param crawlerType Optional crawler type to use
 * @returns Promise with the record or null if not found
 */
export async function getContentByUrl(
  env: Env,
  url: string,
  crawlerType?: string
): Promise<JinaRecord | null> {
  return getCrawler(crawlerType).getContentByUrl(env, url);
}

/**
 * Fetches content from URL and saves to database
 * @param env Environment variables
 * @param url URL to fetch content for
 * @param crawlerType Optional crawler type to use
 * @returns Promise with the operation result
 */
export async function fetchAndSaveContent(
  env: Env,
  url: string,
  crawlerType?: string
): Promise<{
  success: boolean;
  data?: JinaResponse;
  message?: string;
  error?: string;
}> {
  try {
    // Fetch content using the specified or default crawler
    const data = await fetchContent(env, url, crawlerType);

    if (data.error) {
      return {
        success: false,
        message: 'Failed to fetch content from crawler',
        error: data.error,
      };
    }

    // Save to database
    const saveResult = await saveContent(env, data, crawlerType);

    if (!saveResult.success) {
      return {
        success: false,
        data: data,
        message: 'Fetched from crawler but failed to save to database',
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
