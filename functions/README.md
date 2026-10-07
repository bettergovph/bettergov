# GOV.PH Cloudflare Functions

This folder contains Cloudflare Functions that run on a schedule to fetch and store data for the GOV.PH portal. The functions are written in TypeScript for improved type safety and developer experience.

## Functions

### 1. Web Crawler (`api/crawl.ts`)

A generic web crawler that fetches and stores web content using multiple backend implementations. Currently supports Jina.ai API and Cloudflare Browser Rendering API.

- **Database**: Cloudflare D1 `BETTERGOV_DB`
- **Environment Variables**:
  - `JINA_API_KEY` - API key for Jina.ai
  - `CF_ACCOUNT_ID` - Cloudflare account ID for browser rendering API
  - `CF_API_TOKEN` - Cloudflare API token for browser rendering API
- **Endpoints**:
  - `/api/crawl?url=<url>&crawler=<crawler_type>&force=<true|false>` - Fetches and stores content
  - Parameters:
    - `url`: The URL to crawl (required)
    - `crawler`: The crawler implementation to use (`jina` or `cfbrowser`)
    - `force`: Whether to force a fresh crawl even if cached data exists

### 2. Weather Data (`api/weather.ts`)

Fetches weather data for major Philippine cities from OpenWeatherMap API and stores it in Cloudflare KV.

- **Schedule**: Runs hourly
- **KV Store**: `WEATHER_KV`
- **Environment Variables**: Requires `OPENWEATHERMAP_API_KEY`
- **Endpoints**:
  - `/api/weather` - Fetches from API if needed
  - `/weather` - Reads only from KV store

### 3. Currency Exchange Rates (`api/forex.ts`)

Fetches currency exchange rates from Bangko Sentral ng Pilipinas (BSP) and stores them in Cloudflare KV.

- **Schedule**: Runs hourly
- **KV Store**: `FOREX_KV`
- **Data Source**: BSP Exchange Rate API
- **Endpoints**:
  - `/api/forex` - Fetches from API if needed
  - `/forex` - Reads only from KV store

### 4. GovPH Chatbot proxy (`api/assistant.ts`)

Server-side proxy for the eGovAI "govph" engine that powers the site's GovPH Chatbot widget (`src/components/ui/GovPhChatbot.tsx`, client in
`src/lib/assistant.ts`). The browser only ever talks to this Worker; the eGovAI
API key and secret are attached here and never reach the bundle.

- **Environment Variables** (runtime secrets, not build variables):
  - `EGOVAI_BASE_URL` - eGovAI API origin, e.g. `https://egovai.example.gov.ph`.
    A full endpoint URL pasted here is tolerated and reduced to the origin.
  - `EGOVAI_API_KEY` - sent as `X-EGOVAI-API-KEY`
  - `EGOVAI_API_SECRET` - sent as `X-EGOVAI-API-SECRET`
  - `EGOVAI_AGENT_ENGINE_CODE` - optional, defaults to `govph`
- **Endpoints** (both `POST`, body `{ question, session_id?, confirmation? }`):
  - `/api/assistant` - forwards to eGovAI `/api/v1/engines/generate` and returns
    the single JSON answer
  - `/api/assistant/stream` - forwards to `/api/v1/engines/generate_stream` and
    pipes the Server-Sent Events through unchanged (`progress`, `chunk`,
    `complete`, `error`)
- **Behaviour**:
  - Validates the body before anything reaches eGovAI (question required and at
    most 4000 characters; `confirmation` must be `{ token, approved: true }`).
  - Returns `503` when the three required variables are not all set.
  - Upstream `422` and `429` pass through with their message; any other
    upstream failure (bad key, unknown engine, wrong base URL, 5xx, network)
    becomes a generic `502` and the detail is logged server-side only. Upstream
    stack traces are never forwarded.
  - When the engine replies with `pending_confirmation`, the client shows an
    approval prompt and, on approval, resends the same question and
    `session_id` with `confirmation: { token, approved: true }`.

Local development: put the four variables in a gitignored `.dev.vars` file and
run `npm run functions:dev` (Worker on `127.0.0.1:5525`). The Vite dev server
proxies `/api/assistant*` to that port, so `npm run dev` on `5125` works
same-origin. Because the Worker serves `./dist` as static assets, run
`npm run build` once first if you want the full site from the Worker port.

### Web Crawler Architecture

The web crawler is designed with a flexible abstraction layer that allows for multiple crawler implementations:

- **WebCrawler Interface** (`lib/crawler.ts`): Defines the contract for any crawler implementation
- **JinaCrawler** (`lib/jina.ts`): Implementation using Jina.ai API
- **CFBrowserCrawler** (`lib/cf-browser.ts`): Implementation using Cloudflare's Browser Rendering API

This architecture allows for easy switching between different crawler backends without changing the API endpoints or business logic.

#### Database Schema

The crawler uses a Cloudflare D1 database with the following main tables:

- `pages`: Stores crawled page content and metadata
- `links`: Stores links found on crawled pages
- `crawl_queue`: Manages URLs to be crawled

#### Testing

A test script is provided to test the crawler functionality:

```bash
node test-crawler.js <url> <api_key> [crawler_type]
```

Example:

```bash
# Test with Jina crawler
node test-crawler.js https://www.dof.gov.ph your_jina_api_key jina

# Test with Cloudflare Browser crawler
node test-crawler.js https://www.dof.gov.ph your_jina_api_key cfbrowser
```

## TypeScript Setup

This project uses TypeScript for improved type safety and developer experience. The TypeScript configuration is located in `tsconfig.json` and includes:

- Target: ES2022
- Module: ES2022
- Types: @cloudflare/workers-types
- Strict type checking enabled

### Type Definitions

The `types.ts` file contains TypeScript interfaces for:

- `Env` - Environment variables and bindings for Cloudflare Workers
- Weather API response data structures
- Forex API response data structures
- Web crawler response data structures (Jina.ai and Cloudflare Browser API)

## Development Workflow

1. Make changes to TypeScript files in the `functions/` directory
2. Run the TypeScript compiler to build the project:

   ```
   npm run functions:build
   ```

3. Run the development server to test locally:

   ```
   npm run functions:dev
   ```

4. Deploy to Cloudflare:

   ```
   npm run functions:deploy
   ```

## Setup Instructions

1. Install Wrangler CLI (Cloudflare Workers CLI):

   ```
   npm install -g wrangler
   ```

2. Login to your Cloudflare account:

   ```
   wrangler login
   ```

3. Create KV namespaces and D1 database:

   ```
   wrangler kv namespace create WEATHER_KV
   wrangler kv namespace create FOREX_KV
   wrangler kv namespace create BROWSER_KV
   wrangler d1 create govph
   ```

4. Declare the bindings in `wrangler.jsonc` with the IDs printed by the previous step. None are declared today: the IDs the project used to carry belonged to a different Cloudflare account, and a deploy fails validation when a declared namespace does not exist in the deploying account. Until the bindings exist, `/api/weather`, `/weather`, `/api/forex`, `/forex` and `/api/crawl` answer `503 Not configured` naming the missing binding; the other routes are unaffected.

   ```jsonc
   "kv_namespaces": [
     { "binding": "WEATHER_KV", "id": "<id from the create command>" },
     { "binding": "FOREX_KV", "id": "<id>" },
     { "binding": "BROWSER_KV", "id": "<id>" },
   ],
   "d1_databases": [
     { "binding": "BETTERGOV_DB", "database_name": "govph", "database_id": "<id>" },
   ],
   ```

5. Add your API keys as secrets:

   ```
   wrangler secret put OPENWEATHERMAP_API_KEY
   wrangler secret put JINA_API_KEY
   wrangler secret put CF_API_TOKEN
   wrangler secret put CF_ACCOUNT_ID
   wrangler secret put EGOVAI_BASE_URL
   wrangler secret put EGOVAI_API_KEY
   wrangler secret put EGOVAI_API_SECRET
   ```

6. Install TypeScript dependencies:

   ```
   npm install --save-dev typescript @cloudflare/workers-types
   ```

7. Build and deploy the functions:

   ```
   npm run functions:build
   npm run functions:deploy
   ```

## Accessing the Data

### KV Storage

The following data is stored in Cloudflare KV with these keys:

- Weather data: `philippines_weather`
- Currency exchange rates: `bsp_exchange_rates`

### D1 Database

Web crawler data is stored in the Cloudflare D1 database `BETTERGOV_DB` with the following schema:

- `pages`: Stores crawled page content and metadata
- `links`: Stores links found on crawled pages
- `crawl_queue`: Manages URLs to be crawled

You can access this data from your frontend application or other Cloudflare Workers/Functions.
