export interface Env {
  // Native Cloudflare rate limit bindings, configured in wrangler.jsonc.
  API_RATE_LIMITER: RateLimit;
  ASSISTANT_RATE_LIMITER: RateLimit;
  CRAWL_RATE_LIMITER: RateLimit;
  REPORT_RATE_LIMITER: RateLimit;

  // KV Namespaces
  WEATHER_KV: KVNamespace;
  FOREX_KV: KVNamespace;
  BROWSER_KV: KVNamespace;

  // D1 Database
  BETTERGOV_DB: D1Database;

  // Environment variables
  WEATHER_API_KEY?: string;
  OPENWEATHERMAP_API_KEY?: string; // Added this to match the code
  FOREX_API_KEY?: string;
  MEILISEARCH_SEARCH_API_KEY?: string; // Search-only runtime secret, never a master key
  JINA_API_KEY?: string;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  GITHUB_TOKEN?: string;
  NODE_ENV?: string;

  // eGovAI assistant (server-side only — never shipped to the browser)
  EGOVAI_BASE_URL?: string;
  EGOVAI_API_KEY?: string;
  EGOVAI_API_SECRET?: string;
  EGOVAI_AGENT_ENGINE_CODE?: string;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
    wind_kph: number;
    wind_dir: string;
    precip_mm: number;
  };
}

export interface ForexData {
  base: string;
  date: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface JinaLinkSummary {
  url: string;
  title: string;
  description: string;
}

export interface JinaResponse {
  id: string;
  url: string;
  title: string;
  content: string;
  links_summary?: JinaLinkSummary[];
  timestamp: number;
  status?: string;
  error?: string;
}

export interface JinaRecord {
  id: string;
  url: string;
  title: string;
  content: string;
  links_summary: string;
  timestamp: number;
  created_at: string;
}

export interface CFBrowserLink {
  name: string;
  friendly_name?: string;
  link?: string;
}

export interface CFBrowserResponse {
  links: CFBrowserLink[];
}

export interface CFBrowserResult {
  success: boolean;
  errors: string[];
  messages: string[];
  result: CFBrowserResponse;
}
