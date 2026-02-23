# CMS Integration Plan: Build-Time Data Fetching

**Feature Branch:** `feature/fetch_data_from_cms`
**Status:** In Progress
**Last Updated:** 2026-02-19

---

## Overview

This document tracks the implementation of CMS-backed build-time data fetching for the BetterGov project. The goal is to replace the static JSON data files in `src/data/` with data fetched from the Payload CMS v3 instance at build time only. End users never interact with the CMS — the frontend remains a fully static SPA built from the freshly fetched JSON files.

---

## Progress Tracker

### Phase 1: Setup & Scaffolding
- [ ] 1.1 — Extract CMS export scripts from zip into `scripts/cms-export/`
- [ ] 1.2 — Create `PayloadClient` REST API wrapper (`scripts/cms-export/payload-client.ts`)
- [ ] 1.3 — Copy and adapt export modules (replace Payload type with PayloadClient)
- [ ] 1.4 — Copy utility modules unchanged

### Phase 2: Orchestration Script
- [ ] 2.1 — Create `scripts/fetch-cms-data.ts` with full backup/fallback logic
- [ ] 2.2 — Implement temp-dir atomic write strategy
- [ ] 2.3 — Implement pre-replace backup to `src/data/.backup/`
- [ ] 2.4 — Implement graceful fallback (exit 0 on CMS failure)

### Phase 3: Project Integration
- [ ] 3.1 — Update `package.json` build script to include CMS fetch step
- [ ] 3.2 — Add `export:cms` and `export:cms:domain` npm scripts
- [ ] 3.3 — Update `.env.example` with CMS environment variables
- [ ] 3.4 — Update `.gitignore` to exclude `.backup/` directory

### Phase 4: Verification & Testing
- [ ] 4.1 — Manual export test (CMS vars set, all domains)
- [ ] 4.2 — Fallback test (CMS vars unset, skip gracefully)
- [ ] 4.3 — Failure test (invalid CMS URL, graceful degradation)
- [ ] 4.4 — Partial domain test (`--domain=websites`)
- [ ] 4.5 — Full build test (`npm run build` with CMS vars)
- [ ] 4.6 — Verify `src/data/` updated correctly, app loads in dev

---

## Architecture & Design Decisions

### Why REST API Instead of the Native Payload SDK

The provided export scripts (`bgovcms-export-scripts.zip`) use `getPayload()` — Payload CMS's local SDK that connects directly to the PostgreSQL database. Using this in the bettergov project would require installing `payload`, `@payloadcms/db-postgres`, `@payloadcms/next`, `next`, `react`, `react-dom` (~400MB+ of dependencies) plus a copy of the CMS project's `payload.config.ts`.

Instead, we adapt the export scripts to use **Payload's built-in REST API** via `fetch()`. Key facts:
- The REST API response format is identical to the local API: `{ docs: T[], totalDocs: number, ... }`
- All `payload.find()` calls map 1:1 to `GET /api/{collection}?limit=N&where=JSON`
- No new dependencies needed (`fetch` is native in Node 18+, `tsx` and `dotenv` already exist)
- Only the query mechanism changes; all transformation logic is copied unchanged

### Atomic Write Strategy

All domain exports write to a temporary directory first (`/tmp/cms-export-{timestamp}/`). Files are only copied to `src/data/` after **all** exports succeed. This prevents partial updates that could leave the data layer in an inconsistent state.

### Backup Strategy

Before replacing `src/data/` files with fresh CMS data:
1. Current CMS-managed files are copied to `src/data/.backup/` (directory structure preserved)
2. `.backup/` is gitignored — it persists locally between builds but not in version control
3. On CI/CD (Netlify), the git-committed JSON files serve as the baseline fallback on fresh checkouts

On any export failure:
1. Detailed error is logged (domain that failed + error message)
2. If `src/data/.backup/` exists (edge case: failure during in-progress copy), it is restored
3. Script exits with code `0` — the build continues using existing `src/data/` JSON files

### Graceful Degradation

If `CMS_URL` is not set in the environment, the fetch step is silently skipped and the build proceeds with the existing committed JSON files. This means:
- Local development without CMS access works unchanged
- CI pipelines without CMS secrets still build successfully

---

## Environment Variables

Add to CI/CD environment (Netlify build settings) and local `.env`:

```bash
# Required for CMS data fetching at build time
CMS_URL=https://your-cms.example.com
CMS_API_KEY=your-payload-api-key-here
```

**Authentication**: Payload CMS v3 REST API uses `Authorization: users API-Key {CMS_API_KEY}`.
The API key is generated in the Payload admin panel for a user with read access to all collections.

---

## CMS-Managed Files

Files that are replaced by the CMS export at build time:

| Domain | Files |
|---|---|
| `websites` | `src/data/websites.json` |
| `hotlines` | `src/data/philippines_hotlines.json` |
| `services` | `src/data/service_categories.json`, `src/data/services/*.json` (13 files) |
| `directory` | `src/data/directory/departments.json`, `executive.json`, `constitutional.json`, `legislative.json`, `house_members.json`, `party_list_representatives.json`, `diplomatic.json` |
| `lgu` | `src/data/directory/lgu/*.json` (17 regional files) |
| `visa` | `src/data/visa/philippines_visa_types.json`, `src/data/visa/philippines_visa_policy.json` |

**Not CMS-managed** (left untouched by the fetch step):
- `src/data/regions.json`
- `src/data/philippines-regions.json` (GeoJSON)
- `src/data/population-2020.json`
- `src/data/seo-metadata.json`
- `src/data/flood_control/**`
- `src/version.json`
- `public/locales/**` (i18n files)

---

## File Inventory

### New Files to Create

```
scripts/
├── cms-export/
│   ├── payload-client.ts          # Lightweight Payload REST API client
│   ├── export/
│   │   ├── index.ts               # Copied from zip, adapted types
│   │   ├── websites.ts            # Copied from zip, adapted types
│   │   ├── hotlines.ts            # Copied from zip, adapted types
│   │   ├── services.ts            # Copied from zip, adapted types
│   │   ├── directory.ts           # Copied from zip, adapted types
│   │   ├── lgu.ts                 # Copied from zip, adapted types
│   │   └── visa.ts                # Copied from zip, adapted types
│   └── utils/
│       ├── reverse-transformers.ts          # Copied from zip, unchanged
│       └── migrate-department-entities.ts   # Copied from zip, unchanged
└── fetch-cms-data.ts              # Main orchestration with backup/fallback
```

### Files to Modify

| File | Change |
|---|---|
| `package.json` | Prepend `tsx ./scripts/fetch-cms-data.ts &&` to `build` script; add `export:cms` scripts |
| `.env.example` | Add `CMS_URL` and `CMS_API_KEY` variables |
| `.gitignore` | Add `src/data/.backup/` |

---

## Detailed Implementation Steps

### Step 1.1 — Extract CMS export scripts

Extract the zip at `bgovcms-export-scripts.zip` and create the directory structure:
```bash
mkdir -p scripts/cms-export/export scripts/cms-export/utils
# Copy from /tmp/bgovcms-export/scripts/ into scripts/cms-export/
```

### Step 1.2 — Create PayloadClient (`scripts/cms-export/payload-client.ts`)

The client must implement the same `find()` interface used by all export modules:

```typescript
interface FindOptions {
  collection: string
  limit?: number
  sort?: string
  depth?: number
  where?: Record<string, unknown>
  page?: number
}

interface FindResult<T = Record<string, unknown>> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasNextPage: boolean
}

class PayloadClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  async find<T = Record<string, unknown>>(options: FindOptions): Promise<FindResult<T>>
}
```

REST API query construction:
- Where clause: `params.set('where', JSON.stringify(options.where))`
- Depth: `params.set('depth', String(options.depth))`
- Sort: `params.set('sort', options.sort)`
- Limit: `params.set('limit', String(options.limit))`
- Auth header: `Authorization: users API-Key {apiKey}`

Reference: Payload CMS v3 REST API docs — `GET /api/{collection}?where=JSON&depth=N&limit=N&sort=field`

### Step 1.3 — Adapt export modules

For each file in `scripts/cms-export/export/*.ts`, make **one change only**:
```typescript
// Before (from zip):
import type { Payload } from 'payload'

// After (adapted):
import type { PayloadClient } from '../payload-client.js'
```

Update the function signature parameter type from `Payload` to `PayloadClient`. All transformation logic remains identical.

### Step 2.1 — Create orchestration script (`scripts/fetch-cms-data.ts`)

```
Pseudocode:

1. import dotenv/config
2. const CMS_URL = process.env.CMS_URL
3. const CMS_API_KEY = process.env.CMS_API_KEY
4. if (!CMS_URL) { console.log('CMS_URL not set, skipping CMS fetch'); process.exit(0) }
5. const client = new PayloadClient(CMS_URL, CMS_API_KEY)
6. const tmpDir = path.join(os.tmpdir(), `cms-export-${Date.now()}`)
7. Parse --domain flag from process.argv
8. try {
     Run each domain export (filtered by --domain if set)
     → websites.ts exportWebsites(client) → write to tmpDir
     → hotlines.ts exportHotlines(client) → write to tmpDir
     → services.ts → write to tmpDir
     → directory.ts → write to tmpDir
     → lgu.ts → write to tmpDir
     → visa.ts → write to tmpDir
   } catch (err) {
     console.error('CMS export failed:', err)
     console.warn('Using existing JSON data as fallback')
     cleanup(tmpDir)
     process.exit(0)   // Build continues
   }
9. Backup: copy CMS-managed files from src/data/ → src/data/.backup/
10. Copy: copy new files from tmpDir → src/data/
11. Cleanup tmpDir
12. console.log('CMS data updated successfully')
```

Key implementation notes:
- Use `fs.cpSync()` for directory copies (Node 16.7+)
- Wrap entire export logic in try/catch — any single domain failure triggers fallback
- Only do backup + copy on full success (atomic)
- `process.exit(0)` on failure so Vite build always runs

### Step 3.1 — Update `package.json`

```json
"scripts": {
  "build": "tsx ./scripts/fetch-cms-data.ts && tsc && npm run generate:metadata && tsx ./scripts/write-ver-to-json.ts && vite build",
  "export:cms": "tsx ./scripts/fetch-cms-data.ts",
  "export:cms:domain": "tsx ./scripts/fetch-cms-data.ts --domain=",
  ...
}
```

---

## Verification Procedure

After implementation, verify each scenario:

### Test A — Successful CMS export
```bash
# Set real CMS credentials
CMS_URL=https://your-cms.example.com CMS_API_KEY=your-key npm run export:cms
# Expected: src/data/ files updated, src/data/.backup/ created, exit 0
```

### Test B — Skip when no CMS vars
```bash
npm run export:cms  # No CMS_URL set
# Expected: "CMS_URL not set, skipping CMS fetch", exit 0, src/data/ unchanged
```

### Test C — Graceful failure
```bash
CMS_URL=https://invalid-url.example.com CMS_API_KEY=bad npm run export:cms
# Expected: Error logged, "Using existing JSON data as fallback", exit 0
```

### Test D — Single domain export
```bash
CMS_URL=... CMS_API_KEY=... tsx ./scripts/fetch-cms-data.ts --domain=websites
# Expected: Only websites.json updated
```

### Test E — Full build
```bash
CMS_URL=... CMS_API_KEY=... npm run build
# Expected: Build completes successfully, dist/ contains app with fresh CMS data
```

### Test F — Full build without CMS vars
```bash
npm run build  # No CMS vars
# Expected: Build completes using existing JSON files, no errors
```

---

## Rollback Instructions

If the implementation causes issues:

1. Remove the CMS fetch prepend from the `build` script in `package.json`
2. The existing committed JSON files in `src/data/` are always the fallback
3. The `src/data/.backup/` directory (gitignored) can be deleted safely

---

## Notes for Multi-Device Work

- The `bgovcms-export-scripts.zip` file is at the project root and is tracked in git (listed in `git status`)
- All new scripts go in `scripts/cms-export/` — no changes to `src/`
- The `PayloadClient` class is the key new piece; all else is either copied from the zip or minor config changes
- On a new device: extract the zip to `/tmp/bgovcms-export/` first, then follow the steps above
- CMS credentials (`CMS_URL`, `CMS_API_KEY`) must be obtained from the CMS admin and set in `.env` locally or in Netlify environment settings
