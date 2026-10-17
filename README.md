# GOV.PH Portal

Source code of **GOV.PH**, the official portal of the Republic of the
Philippines — one place to find government services, agencies, hotlines,
holidays, news, and travel information, written plainly and sourced from
official records.

## About this project

GOV.PH is developed through a community collaboration partnership between
eGov Philippines and citizen contributors. The work happens in the open, and
the code is published under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International license (CC BY-NC-ND 4.0).

Goals:

- A national website that reflects Filipino values and culture
- Intuitive navigation and search across every agency
- Accessibility for all citizens, including those with disabilities
- Accurate, up-to-date information that always points back to its official
  source
- A model for how government digital services can and should work

## Origins and attribution

This portal builds on the open-source [BetterGov.ph](https://bettergov.ph)
project, a volunteer-led civic-tech initiative that set out to make
Philippine government information easier to find, read, and use. Its code,
design system, and data pipelines became the foundation of GOV.PH, and the
hundreds of citizen volunteers who built it are gratefully acknowledged.
Their contributions were released under CC0 and remain in the public domain.

## Features

- Modern, responsive design that works on all devices
- Comprehensive directory of government services and agencies
- User-friendly navigation and search
- Accessibility features for users with disabilities
- Regular updates and maintenance

## Contributing

Contributions are welcome — bug reports, corrections to data, translations,
documentation, and code. Please see the [Contributing Guide](./CONTRIBUTING.md)
for development setup and the pull request workflow, and open an issue in
this repository to report a problem or propose a change.

## Code of Conduct

We are committed to fostering a welcoming and respectful community.
Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Contributing

We welcome contributions from everyone!
Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Development setup
- Reporting bugs
- Opening issues and pull requests

## How to Run

```bash
# Install packages
npm install

# Start the server
npm run dev
```

**Access the application at:** `http://localhost:5125`

The chatbot, weather, forex and search use same-origin `/api` routes served by
the Cloudflare Worker in `functions/`, so run the Worker next to Vite for these
features. It reads the `EGOVAI_*`, `OPENWEATHERMAP_API_KEY` and
`MEILISEARCH_SEARCH_API_KEY` runtime secrets and the `MEILISEARCH_ORIGIN`
runtime variable from gitignored `.dev.vars`.
Weather and forex use this Worker's KV namespaces; only search uses the
Meilisearch proxy. The default deployment uses the production account and its
KV namespaces; `npm run functions:deploy:staging` selects the separate staging
account. Both Workers are named `govph-dev`. See [the Worker setup](functions/README.md) for configuration.

```bash
# Second terminal — Worker on 127.0.0.1:5525; Vite proxies the dynamic API routes
npm run functions:dev
```

## GitHub Codespaces

You may use GitHub Codespaces for an instant development environment with dependencies automatically installed for you.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/govph/govph-2026?quickstart=1)

## Docker

This project includes Docker support for easy deployment and consistent environments.

### Building and Running

```bash
# Build the Docker image
docker build -t govph .

# Run the container
docker run -p 8080:80 govph

# Run in detached mode
docker run -d -p 8080:80 --name govph govph
```

**Access the application at:** `http://localhost:8080`

### Docker Compose

For the easiest and most consistent development experience, we recommend using Docker Compose. This method uses Docker to run the application in a controlled environment with hot-reloading enabled.

```bash
# Start the development server
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop the service
docker-compose down
```
**Access the application at:** `http://localhost:5125`

## Testing

This project uses Playwright for end-to-end testing.
For setup instructions, coverage details, and examples, see our [Testing Guide](./TESTING.md).

## Guide content

The 19 guides under `/guides/:guideId` use repository-owned Markdown articles
adapted from the Notion drafts for public use. See [the guide content notes](src/data/guides/README.md)
for source provenance, review dates, and editing instructions. The guide index,
HTML/XML sitemaps, and `llms.txt` use `src/data/guides/manifest.json`.

## Services, categories and hotlines data

The services directory and the home page's critical hotlines read three
committed datasets:

| File | Holds | Schema |
|---|---|---|
| `src/data/service_categories.json` | the category and subcategory taxonomy | `src/data/schema/service_categories.schema.json` |
| `src/data/services/<category-slug>.json` | the services in one category | `src/data/services/schema/services.schema.json` |
| `src/data/critical_hotlines.json` | the critical hotlines on the home page | `src/data/schema/critical_hotlines.schema.json` |

Edit them in a pull request like any other data file. `npm run build` uses
them as they are — it never contacts a CMS and needs no credentials. The
pre-commit hook validates staged copies against their schemas; to check by
hand:

```bash
node scripts/validate-json-schema.js \
  src/data/services/schema/services.schema.json \
  "src/data/services/*.json"
```

The schemas check each file on its own, so keep the files in agreement
yourself: a service's `category` and `subcategory` (name and slug) must
match an entry in `service_categories.json`, the record goes in the file
named after its category slug, and each record needs a unique `id` (the
existing ones are UUIDs).

`src/data/cms.ts` is the only module that reads these files — every other
module goes through its `serviceCategories`, `criticalHotlines`, and
`services` exports. The website never queries a CMS at runtime.

`src/data/philippines_hotlines.json` keeps its own seven hotline groups
(emergency, disaster, security, transport, weather, utility, social
services) for the hotlines page; `critical_hotlines.json` is only the short
list on the home page.

### Refreshing from eGovCMS (optional)

These files were imported from eGovCMS, and `npm run cms:fetch` can still
pull eGovCMS's current copy into them. The repository is the source of
truth, though: a fetch overwrites the files wholesale, so it undoes any edit
made here that wasn't also made in eGovCMS. Review `git diff` and commit only
the changes you mean to take. The eGovCMS token is read-only; nothing is
written back to eGovCMS.

Put credentials in a local `.env` (see `.env.example`), then:

```bash
npm run cms:fetch -- --dry-run    # show what would change, write nothing
npm run cms:fetch                 # write the files
npm run cms:fetch -- --only=services
npm run cms:fetch -- --only=categories
npm run cms:fetch -- --only=hotlines
```

Exit codes: `0` success, `1` failure, `3` drift detected (`--dry-run` only).

The script fails without writing anything if eGovCMS is unreachable, returns
an incomplete result, or would produce a file that violates its JSON Schema.
Writes are atomic per file but not across files: if the write phase is
interrupted, check `git status`.

### Choosing a run mode

| If you are… | Use |
|---|---|
| syncing everything, or unsure | `npm run cms:fetch` |
| **renaming a category or subcategory** | `npm run cms:fetch` — **full sync required**; both isolated modes will fail the name-agreement gate |
| adding or retiring a category in eGovCMS | `npm run cms:fetch` — only a full sync sees taxonomy file churn |
| editing service content only (titles, URLs) | `--only=services` is safe **if** no display name changed |
| editing taxonomy display names only | `npm run cms:fetch` — see the rename row |

The isolated modes are optimizations for narrow, single-sided edits. **When in
doubt, run the full sync**: it is the only mode that validates both datasets
against each other, as two CDA requests cross-checked within one invocation.

A category or subcategory display name is denormalised onto every service
record as well as held in the taxonomy. Syncing one side alone after a rename
would leave the sidebar showing the new name while every row beneath it shows
the old one, so the sync refuses: `--only=categories` fails because the
committed records still carry the old name, and `--only=services` fails
because the committed taxonomy still carries it. That is correct fail-closed
behavior, not a false positive.

`--only=services` **cannot** detect a category added or removed in eGovCMS —
it validates against the committed taxonomy by design. Run a full sync to
surface taxonomy file churn.

For an unselected dataset the sync never queries eGovCMS, never prepares an
output, never reports it as changed, and never writes it. It may read a
committed file as a documented cross-validation input.

### Category churn checklist

Adding a category means adding it to `service_categories.json` together with
its `src/data/services/<slug>.json` file; retiring one means removing both.
A full eGovCMS sync does the same for categories added or retired in
eGovCMS: it writes the new file, and after a successful write deletes any
`src/data/services/*.json` file whose category eGovCMS no longer has — never
`src/data/services/schema/**`. Commit the result.

Either way, a handful of places curate the taxonomy by hand. Check each row
after a category is added or retired:

1. **Home grid** (`src/components/v2/home/Categories.tsx`) — it caps the
   taxonomy at 12 non-`uncategorized` entries, so a 14th category is hidden.
   Does it belong in the top 12? If yes, the cap or the ordering must change.
2. **HTML sitemap** (`src/pages/sitemap/index.tsx`) — 13 hardcoded
   `?category=` links. Add or remove the link. A stale link resolves silently
   as an unfiltered directory.
3. **Footer** (`src/components/v2/layout/Footer.tsx`) — curated top-5; usually
   skip. (Its `revenue-taxation` link is already broken — not a taxonomy slug.)
4. **Guides** (`src/data/guides/*.md`) — only if a guide references it.
5. **Hero quick links** (`src/components/v2/home/Hero.tsx`) — three curated
   category/subcategory pairs. Only relevant if one is retired.
6. **`src/data/seo-metadata.json`** — 44 `?category=` keys. Add an entry for a
   new category, or remove orphans for a retired one. Nothing detects this.
7. **Meilisearch** — see below.

The GovPH Chatbot widget is not on this list: it answers through the
eGovAI engine (see `functions/README.md`), not from the service taxonomy.

Navigation, the XML sitemap, `llms.txt`, and `/services` all derive from the
taxonomy or the committed file set and need no action.

### Reindexing Meilisearch after a data change

`npm run index:meilisearch` calls `addDocuments` only: it upserts and never
deletes. Removing a service, changing a slug, emptying a category or deleting a
category file therefore leaves **stale documents searchable**.

Both `npm run index:meilisearch` and `npm run index:meilisearch:reset` read
the committed `src/data/services/*.json` directly, and refuse to run if those
files are missing, empty or fail their schema rather than index an empty
dataset (which under `--reset` would otherwise wipe real service search
data).

After a change that removes records or changes any slug, run
`npm run index:meilisearch:reset`. A pure addition or in-place field edit may
use the plain command.

### Failure contract

Missing credentials, an unreachable CMS, an HTTP/GraphQL error, a malformed
response, or a failed validation gate — any of these fails `npm run
cms:fetch` before it writes anything, so a failed fetch never leaves a
partial or schema-invalid dataset behind. `npm run build` never contacts
eGovCMS and has no failure mode tied to it, and no Dockerfile target needs
CMS credentials. Keep the eGovCMS credentials listed in `.env.example` in
your local `.env`, never in the repository.

### Required checks before opening a PR that changes the sync pipeline

CI does not run the unit suite. Run these yourself:

```bash
npm run test:unit
npm run typecheck:scripts
npm run lint
npx prettier --check .
npm run cms:fetch                     # requires real credentials
npm run build                         # the site must still bundle
```

Note: `validate-json-schema.js` prints `unknown format … ignored` and does
**not** check URL or timestamp formats — `ajv-formats` is not installed. The
sync's own gates enforce them for fetched data; check them by eye when
editing by hand.

`npm run build` also rewrites three tracked files: `public/sitemap.xml` and
`public/llms.txt` (derived from `service_categories.json`, and both stamped
with today's date on **every** build) and `src/version.json` (commit hash).

- Always discard `src/version.json`.
- Judge `public/llms.txt` and `public/sitemap.xml` **separately**, by
  comparing normalized content rather than by filtering `git diff` output —
  a filtered diff always retains its headers and context, so it can never
  confirm "date-only":

  ```bash
  node --input-type=module - <<'EOF'
  import { execSync } from 'node:child_process';
  import fs from 'node:fs';

  const DERIVED = {
    'public/sitemap.xml': t =>
      t.replace(/<lastmod>[^<]*<\/lastmod>/g, '<lastmod>DATE</lastmod>'),
    'public/llms.txt': t => t.replace(/(## Last Updated\r?\n)[^\r\n]*/g, '$1DATE'),
  };

  for (const [file, normalize] of Object.entries(DERIVED)) {
    if (!fs.existsSync(file)) continue;
    const head = execSync(`git show HEAD:${file}`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const work = fs.readFileSync(file, 'utf8');
    console.log(
      `${file}: ${normalize(head) === normalize(work) ? 'DATE-ONLY (restore it)' : 'CONTENT-CHANGED (review and commit it)'}`
    );
  }
  EOF
  ```

  These two rarely change together: `llms.txt` embeds category display
  names, while `sitemap.xml` carries only slug-based URLs, so a display-name
  edit changes the first and not the second.
- If the build fails, restore all three before investigating.

## Contributing

Thanks to all the people who already contributed!

<a href="https://github.com/govph/govph-2026/graphs/contributors">
    <img src="https://contributors-img.web.app/image?repo=govph/govph-2026&max=750&columns=20" />
</a>

## License

This project is published under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/) license (CC BY-NC-ND 4.0). You may copy and share it unchanged, for non-commercial purposes, with appropriate credit. Sharing an adapted version needs separate permission. See [LICENSE](LICENSE) for the full terms.

Work released earlier under CC0 1.0, including the BetterGov.ph code that GOV.PH builds on, remains in the public domain.

---
