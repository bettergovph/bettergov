# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BetterGov.ph is a community-led initiative to create a better Philippine national government portal. It is a React SPA deployed to Netlify (static) and/or Cloudflare Workers (with serverless functions).

## Commands

```bash
# Development
npm install          # Install dependencies (Node.js v22+)
npm run dev          # Start Vite dev server at http://localhost:5173

# Build
npm run build        # Type check → generate metadata/sitemap → Vite build (outputs to dist/)

# Lint & Format
npm run lint         # ESLint with zero warnings policy
npm run format       # Prettier

# Testing
npm run test:e2e          # Run all Playwright E2E tests headlessly
npm run test:e2e:ui       # Open Playwright interactive UI
npm run test:e2e:debug    # Run with Playwright Inspector
npx playwright test e2e/homepage.spec.ts  # Run a single test file

# Cloudflare Functions (serverless)
npm run functions:dev     # Local dev server via wrangler
npm run functions:build   # TypeScript compile functions/
npm run functions:deploy  # Deploy to Cloudflare Workers

# Search Indexing (Meilisearch)
npm run index:meilisearch          # Index government services
npm run index:flood-control:arcgis # Index flood control data
npm run index:all                  # Run all indexers
```

## Architecture

### Frontend (src/)

React 19 SPA using React Router v6, Vite, Tailwind CSS v4, and TypeScript.

- **`src/App.tsx`** — root router; all routes defined here with nested layouts
- **`src/pages/`** — page components mirroring URL structure. Government section uses nested `layout.tsx` + `index.tsx` + `[param].tsx` pattern
- **`src/components/layout/`** — `Navbar.tsx`, `Footer.tsx`, `Breadcrumb.tsx`
- **`src/components/ui/`** — reusable primitives (Button, Card, Dialog, ScrollArea, etc.)
- **`src/data/`** — static JSON data files:
  - `directory/` — government directory data (executive, departments, legislative, diplomatic, constitutional, LGU data by region)
  - `services/` — government services by category
  - `visa/`, `websites/`, `hotlines` — domain-specific data
  - `schema/` — JSON Schema files for validating data files
- **`src/lib/`** — utilities: `api.ts` (fetch-with-cache), `lgu.ts`, `forex.ts`, `weather.ts`, `seoTemplates.ts`
- **`src/i18n.ts`** — i18next configuration; translation files live in `public/locales/{locale}/{namespace}.json`

Path alias: `@/` resolves to `src/`.

### Cloudflare Functions (functions/)

Serverless workers separate from the React app, deployed via Wrangler:

- **`api/weather.ts`** — fetches Philippine city weather from OpenWeatherMap; stores in `WEATHER_KV`
- **`api/forex.ts`** — fetches BSP exchange rates; stores in `FOREX_KV`
- **`api/crawl.ts`** — generic web crawler with pluggable backends (Jina.ai or Cloudflare Browser Rendering); stores in D1 `BETTERGOV_DB`
- **`lib/crawler.ts`** — `WebCrawler` interface; `lib/jina.ts` and `lib/cf-browser.ts` are implementations

Functions have their own `tsconfig.json` targeting ES2022 with `@cloudflare/workers-types`.

### Search (Meilisearch)

Search is powered by Meilisearch via `@meilisearch/instant-meilisearch` and `react-instantsearch`. Scripts in `scripts/` handle indexing. See `docs/Meilisearch.md` for setup.

### Build Pipeline

`npm run build` runs in sequence:
1. `tsc` — TypeScript type check
2. `generate:metadata` — runs `generate-llms-txt.js` and `generate-sitemap.js`
3. `tsx scripts/write-ver-to-json.ts` — writes build version to `src/version.json`
4. `vite build` — outputs to `dist/`

Husky + lint-staged runs linting/formatting on commit. Commitlint enforces Conventional Commits.

## Conventions

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>[scope]: <description>`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Data Files

Static JSON data in `src/data/` drives most government directory pages. JSON schemas in `src/data/**/schema/` validate structure. Run validation with:

```bash
node scripts/validate-json-schema.js <schema-path> "<files-glob>"
```

### Translations (i18n)

- Add new namespace JSON to `public/locales/en/` (English is the required fallback)
- Register namespace in `src/i18n.ts`
- Use `useTranslation('namespace')` in components
- `nuqs` is used for URL search param state management

### PR Disclosure

Disclose AI-assisted contributions in PR descriptions to help maintainers review more thoroughly.
