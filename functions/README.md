# GOV.PH Cloudflare Functions

This folder contains Cloudflare Functions that run on a schedule to fetch and store data for the GOV.PH portal. The functions are written in TypeScript for improved type safety and developer experience.

## HTTP security

Every dynamic route in this repository's single Worker passes through
`lib/request-security.ts`, including both assistant endpoints, `/api/status`,
the `/weather` and `/forex` aliases, and error/404 responses.

- Only `https://www.gov.ph` and HTTPS subdomains of `govph.workers.dev` and
  `oueg.workers.dev` are approved browser origins. The bare `govph.workers.dev`
  and `oueg.workers.dev`, other `gov.ph`
  subdomains, HTTP origins, custom ports, and `null` origins are rejected with
  `403` before a handler runs. Version-preview subdomains are supported.
- Approved origins receive their exact `Access-Control-Allow-Origin` and
  `Access-Control-Allow-Credentials: true`. Preflights permit `GET`, `POST`,
  `OPTIONS` and the `Content-Type` / `X-Meilisearch-Client` request headers. Responses vary by origin
  and preflight headers and are not cached across clients. Rejected origins
  receive no CORS grant.
- Requests without an `Origin` (for example, same-origin GETs and server
  clients) remain usable and rate limited, but receive no CORS grant.
  Origin-less browser requests marked `Sec-Fetch-Site: cross-site` or `same-site`
  are rejected because they originate outside the Worker's own origin.
  CORS is a browser policy, not authentication: non-browser clients can spoof
  `Origin`, so it must not be relied on to authorize access.

Native Cloudflare rate-limit bindings declared in `wrangler.jsonc` apply before
body parsing, storage access or upstream calls. Limits use `CF-Connecting-IP`,
not client-supplied forwarding headers. Missing IPs share one fallback bucket.

| Scope | Requests per 60 seconds per IP |
| --- | --- |
| All dynamic requests combined | 120 |
| Assistant JSON and SSE combined | 20 |
| Crawler | 10 |
| Hotline reports | 5 |

Preflights do not consume quota. A denied request returns `429`,
`Retry-After: 60`, `RateLimit-Limit` and `RateLimit-Remaining: 0`.
Successful responses include `RateLimit-Limit`; the native binding does not
expose an accurate remaining count, so none is invented. These headers are
exposed to approved browser clients. Upstream assistant `429` responses retain
their `Retry-After`, defaulting to 60 seconds if absent. Missing or failing
rate-limit bindings fail closed with `503` and `Retry-After: 60`.

Keep the policy limits in `lib/request-security.ts` and `wrangler.jsonc` in sync.
Deploy the Worker code and configuration together; no KV counter or separately
provisioned rate-limit service is needed. Each namespace ID is account-wide:
reuse it deliberately only when another Worker should share that quota.

Cloudflare's [rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
are local to each Cloudflare location and eventually consistent, rather than
an exact global quota. Shared NAT/mobile IPs share their allowance. This is
application abuse mitigation; distributed DDoS protection still relies on
Cloudflare's edge protections/WAF. Static assets (including `/api/projects.json`)
stay on Cloudflare's asset-serving path and do not consume Worker API quotas.
Other Workers outside this repository need the same policy applied separately.

### Assistant and report request boundaries

`/api/assistant`, `/api/assistant/stream`, and `/api/report-hotline` require
`application/json`, accept at most 64 KiB measured from the body stream, and
allow 15 seconds to receive it. Missing or false `Content-Length` values do not
bypass the byte limit. Rejections return `415`, `413`, `408`, or `400` without
calling a provider. All dynamic responses include `X-Content-Type-Options: nosniff`.

Assistant JSON responses are limited to 2 MiB and 90 seconds. SSE responses
remain streamed, with a 4 MiB cap, 180-second total deadline, and 60-second idle
deadline after response headers. Disconnects cancel upstream work;
`enable_request_signal` enables the incoming disconnect signal in Workers.
Only HTTPS upstream URLs are accepted, and redirects are never followed with
credentials. Logs omit provider response bodies.

Hotline reports require a name (200 characters maximum) and issue (4,000), with
optional corrected information (4,000) and an HTTP(S) source URL (2,048).
Unknown fields and non-string values are rejected. Older open tabs may send
`reporterEmail` (up to 254 characters); it is discarded and never forwarded to
GitHub. The current form does not collect it. Free-text reports must contain no
private information. GitHub calls have an 8-second timeout, a 256 KiB response
cap, and no redirects or automatic retries. A timeout can occur after an issue
was created, so users should check the issue list before retrying.

These limits preserve the existing per-IP quotas and need no database migration
or additional binding. They do not impose a global provider spending cap or
prevent direct use of previously exposed credentials.

### Launch hardening rollout

The October 17 API hardening patch is prepared locally; it is not a record of a
production deployment. Validate the frontend build and both Worker environments
with the checks below, then smoke-test staging with its own provider configuration.
Check ordinary search/chat flows and invalid-report rejection; do not create a
real GitHub issue as a health check. Verify that the configured assistant URL is
HTTPS and does not redirect before promotion.

Record the current production version for rollback and preserve its static
security headers. `public/_headers` now records the six header values observed
on production on October 17; the build copies them to `dist/_headers`.
Test both an already-open page and a fresh page. Cloudflare
[gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)
can split traffic between old and new versions while the site keeps serving.
Start with a small percentage, compare errors, latency, rate-limit rejections,
and assistant completion rates, then promote or restore the prior version.
No maintenance window is required by this patch; staging and production smoke
checks are still necessary. Old versions remain unprotected during a split.
Hashed frontend assets also require version affinity or matching asset sets
while traffic is split; never split two frontend versions blindly. The existing
Git-connected production build performs a single-version deployment. It can
publish a tested release without a local production API token; a Git revert
through that pipeline provides a fallback rollback if dashboard/API access is
unavailable.

## Same-origin data and search

The browser uses relative URLs, so a site served on `www.gov.ph` makes requests
to `https://www.gov.ph/api/weather`, `/api/forex` and `/api/search`. Preview
deployments use their own origin. The existing `/api/*` Worker routing already
covers these paths; no separate backend deployment or browser CORS exception is
needed. The deployment serving `www.gov.ph` must receive this code and its bindings.

### Weather and forex

Weather and forex run natively inside the site's Worker. There is no HTTP
proxy or fallback to `api.bettergov.ph`. `/api/weather` and `/api/forex` read
`WEATHER_KV` and `FOREX_KV`; a cold cache is populated directly from
OpenWeatherMap and BSP respectively. `/weather` and `/forex` are KV-only aliases.
Missing bindings return `503` rather than forwarding to another deployment.

Both environments refresh the data every hour (`0 * * * *`, UTC). Cached data
lasts six hours to cover temporary provider failures. Failed refreshes preserve
existing data. Weather needs the `OPENWEATHERMAP_API_KEY` runtime secret; BSP
needs no API key. A newly bound, empty weather namespace cannot initialize until
that secret is configured. The API routes fill an empty cache on their first
successful request, so a separate migration of old KV values is not required.

Public data endpoints accept only `GET` and a single optional `city` / `symbol`
filter. Public force-refresh parameters (`update`, `force`) are rejected; cache
bypass is reserved for the scheduled handler. Unknown filters return `404`,
and provider failures return sanitized errors. CORS and rate limits apply before
any storage access or provider request.

### Deployment target

| Target | Wrangler selection | Worker | Account |
| --- | --- | --- | --- |
| Production | Default | `bettergovph` | `cd41784b73cc20f93b3137292f818ff6` |

The Cloudflare Workers Build connected to `github.com/bettergovph/bettergov`
deploys `main` to the BetterGov account. The Worker serves the `bettergov.ph`
and `www.bettergov.ph` custom domains and uses that account's namespaces:

| Binding | Namespace ID |
| --- | --- |
| `FOREX_KV` | `a1151781bef24f3092aa3ddefe86aac5` |
| `WEATHER_KV` | `7e1c950bb42d4282b13e3e9524ce5335` |

`BROWSER_KV` is not provisioned on this account, so the routes that need it
answer `503`. Local development uses local storage, not the remote account.

Supply an account-scoped Cloudflare API token for the BetterGov account; do not
export a conflicting `CLOUDFLARE_ACCOUNT_ID`. `keep_vars` preserves
dashboard-managed runtime variables, and Worker secrets remain server-side.
Deployment targets the existing Worker at account `cd41784b…` / Workers /
`bettergovph`. Its custom domains are declared as `bettergov.ph` and
`www.bettergov.ph`.

`BROWSER_KV` alone does not enable crawling: `/api/crawl` also requires the
existing `BETTERGOV_DB` D1 binding. No database ID was supplied, so crawling
continues to return `503` until that separate dependency is configured.

### Meilisearch

`api/search.ts` proxies only these read operations to the Worker runtime
variable `MEILISEARCH_ORIGIN`:

| Browser endpoint | Meilisearch endpoint |
| --- | --- |
| `POST /api/search` or `/api/search/multi-search` | `POST /multi-search` |
| `POST /api/search/indexes/{index}/search` | `POST /indexes/{index}/search` |
| `POST /api/search/indexes/{index}/facet-search` | `POST /indexes/{index}/facet-search` |

Only `bettergov`, `bettergov_flood_control`, and `contractors` are exposed.
Keys, documents, settings, administrative operations, federated remote searches,
and AI/vector requests are not exposed. The proxy accepts at most 64 KiB of JSON
and 20 queries per batch, with at most 20,002 requested hits across the batch.
Each query allows 10,001 hits to preserve the map/statistics views and the SDK's
one-hit pagination lookahead. Single-index search supports the existing
10,000-row CSV export. Requests consume the shared
120/minute API allowance. Upstream calls have a 15-second timeout; `429` retry
advice is preserved. Browser-supplied authorization is never used upstream.

Set `MEILISEARCH_ORIGIN` in the Worker's **Variables & Secrets** settings to your
Meilisearch HTTPS origin (for example, `https://search.example.com`). A custom
HTTPS port is supported; paths, query strings, fragments and URL credentials are
rejected. There is no default origin. Configure it before deploying;
`keep_vars` preserves the dashboard setting.

Set `MEILISEARCH_SEARCH_API_KEY` as a **Worker runtime secret**, using a key with
only `search` permissions on the three public indexes:

```bash
npx wrangler secret put MEILISEARCH_SEARCH_API_KEY
```

For local development, put both `MEILISEARCH_ORIGIN` and the key in gitignored `.dev.vars`. An
existing `VITE_MEILISEARCH_SEARCH_API_KEY` can be moved there if it has the
required search-only scope. Never use a master/admin key. Without the key or a
valid origin, searches return `503 Search is not configured` without calling an
upstream server. The browser no longer
reads a search key, host or port from Vite variables. The old host/port variables
remain useful to the offline indexing scripts.

All search UIs use `src/lib/search.ts`; exports also use the same-origin proxy.
The [Meilisearch multi-search API](https://specs.meilisearch.dev/specifications/text/0192-multi-search-api.html)
keeps the InstantSearch integration intact, including its initial facet requests.
Provision the runtime origin and secret and deploy frontend + Worker together. Once old
frontends have migrated, revoke previously public keys and separately restrict
direct access to the upstream if bypass protection is required.

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

Fetches weather data for major Philippine cities directly from OpenWeatherMap and stores it in this deployment's Cloudflare KV namespace.

- **Schedule**: Runs hourly
- **KV Store**: `WEATHER_KV`
- **Environment Variables**: Requires `OPENWEATHERMAP_API_KEY`
- **Endpoints**:
  - `/api/weather` - Fetches from API if needed
  - `/weather` - Reads only from KV store

### 3. Currency Exchange Rates (`api/forex.ts`)

Fetches currency exchange rates directly from Bangko Sentral ng Pilipinas (BSP) and stores them in this deployment's Cloudflare KV namespace.

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
    becomes a generic `502` and only the status is logged server-side. Upstream
    stack traces are never forwarded.
  - When the engine replies with `pending_confirmation`, the client shows an
    approval prompt and, on approval, resends the same question and
    `session_id` with `confirmation: { token, approved: true }`.

Local development: put the four variables in a gitignored `.dev.vars` file and
run `npm run functions:dev` (Worker on `127.0.0.1:5525`). The Vite dev server
proxies assistant, weather, forex and search API routes to that port, so `npm run dev` on `5125` works
same-origin. For same-origin browser calls only, the development proxy rewrites
the outgoing Origin to `https://bettergov.ph`; the production allowlist has no
localhost or development-IP exceptions. Direct Worker calls with an unapproved
Origin will return `403`. Because the Worker serves `./dist` as static assets, run
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

## Development and deployment

Install the pinned dependencies with `npm ci`. Put local runtime secrets in
`.dev.vars` (gitignored), then build assets with `npm run build` and start the
Worker with `npm run functions:dev`. Vite uses the reserved port `5125`; the
Worker binds only to `127.0.0.1:5525`. Local KV is persistent but separate from
the remote namespaces.

Before deploying, use credentials for account
`cd41784b73cc20f93b3137292f818ff6`, set `MEILISEARCH_ORIGIN` in the Worker's
**Variables & Secrets** settings, and set its runtime secrets:

```bash
npx wrangler secret put OPENWEATHERMAP_API_KEY
npx wrangler secret put MEILISEARCH_SEARCH_API_KEY
npx wrangler secret put EGOVAI_BASE_URL
npx wrangler secret put EGOVAI_API_KEY
npx wrangler secret put EGOVAI_API_SECRET
```

`.dev.vars` is local only and is not uploaded by deployment.
Search must use a search-only key; the eGovAI engine code defaults to `govph`.
Weather and the assistant cannot refresh or call their providers without their
respective secrets. Existing cached weather remains readable without its key.

Build and validate the configuration before rollout:

```bash
npm run build
npx wrangler deploy --dry-run
```

Then deploy, with the BetterGov account's credentials:

```bash
npm run functions:deploy
```

This deploys the frontend assets and Worker together. The Workers Build can
keep its default `npx wrangler deploy` command. A dry run checks the
bundle and configuration but does not verify remote namespace access, secrets,
or domain ownership. After deploying, check `/api/weather`, `/api/forex`,
`/api/search` and the assistant on that target, plus the hourly scheduled logs.

To enable the crawler, bind the appropriate account's D1 database as
`BETTERGOV_DB` and set `JINA_API_KEY`, or `CF_ACCOUNT_ID` / `CF_API_TOKEN` for the
Cloudflare Browser Rendering integration. The three supplied KV namespaces do
not substitute for the crawler's database.

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
