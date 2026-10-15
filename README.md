# GOV.PH Portal

Source code of **GOV.PH**, the official portal of the Republic of the
Philippines — one place to find government services, agencies, hotlines,
holidays, news, and travel information, written plainly and sourced from
official records.

## About this project

GOV.PH is developed through a community collaboration partnership between
eGov Philippines and citizen contributors. The portal is open source and its
code is dedicated to the public domain, so any national agency, local
government unit, or civic project may reuse it.

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
Their contributions remain in the public domain.

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

The GovPH Chatbot widget talks to the Cloudflare Worker in
`functions/`, so run the Worker next to Vite when you want the assistant to
answer locally. It reads the eGovAI secrets from a gitignored `.dev.vars`
file — see `functions/README.md` for the `EGOVAI_*` variables.

```bash
# Second terminal — Worker on 127.0.0.1:5525; Vite proxies /api/assistant to it
npm run functions:dev
```

## GitHub Codespaces

You may use GitHub Codespaces for an instant development environment with dependencies automatically installed for you.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/govph/govph-2026?quickstart=1)

## Docker

This project includes Docker support for easy deployment and consistent environments.

### Building and Running

```bash
# Build the Docker image — the default (final) stage needs TalaCMS build
# secrets; see "Syncing content from TalaCMS" > "Failure contract" below.
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

## Syncing content from TalaCMS

`src/data/service_categories.json`, `src/data/critical_hotlines.json`, and
`src/data/services/*.json` are generated from TalaCMS by a **pre-build**
step — they are gitignored and never committed. Deployment runs
`npm run cms:fetch` before `npm run build`; `cms:fetch` fetches, validates,
and writes all three and fails closed (no fallback, no placeholder data) if
anything goes wrong. `npm run build` itself only consumes the
already-generated files — it does not talk to TalaCMS and does not need
credentials.

```bash
npm run cms:fetch && npm run build
```

`src/data/cms.ts` is the only module that reads these generated files —
every other module goes through its `serviceCategories`, `criticalHotlines`,
and `services` exports. The website never queries the CMS at runtime.

`src/data/services/schema/services.schema.json` stays tracked — it's the
contract the generated data must satisfy, not the data itself.

`src/data/philippines_hotlines.json` keeps its own seven repo-owned hotline
groups (emergency, disaster, security, transport, weather, utility, social
services) and stays committed — only the CMS-owned critical hotlines moved
out into their own generated file.

For local development, put credentials in a local `.env` (see
`.env.example`), then:

```bash
npm run cms:fetch -- --dry-run    # show what would change, write nothing
npm run cms:fetch                 # write the files
npm run cms:fetch -- --only=services
npm run cms:fetch -- --only=categories
npm run cms:fetch -- --only=hotlines
```

Exit codes: `0` success, `1` failure, `3` drift detected (`--dry-run` only).

The script fails without writing anything if TalaCMS is unreachable, returns
an incomplete result, or would produce a file that violates its JSON Schema.
Writes are atomic per file but not across files: if the write phase is
interrupted, check `git status`.

### Choosing a run mode

| If you are… | Use |
|---|---|
| syncing everything, or unsure | `npm run cms:fetch` |
| **renaming a category or subcategory** | `npm run cms:fetch` — **full sync required**; both isolated modes will fail the name-agreement gate |
| adding or retiring a category in TalaCMS | `npm run cms:fetch` — only a full sync sees taxonomy file churn |
| editing service content only (titles, URLs) | `--only=services` is safe **if** no display name changed |
| editing taxonomy display names only | `npm run cms:fetch` — see the rename row |

The isolated modes are optimizations for narrow, single-sided edits. **When in
doubt, run the full sync**: it is the only mode that validates both datasets
against each other, as two CDA requests cross-checked within one invocation.

A category or subcategory display name is denormalised onto every service
record as well as held in the taxonomy. Syncing one side alone after a rename
would leave the sidebar showing the new name while every row beneath it shows
the old one, so the sync refuses: `--only=categories` fails because the
previously generated records still carry the old name, and `--only=services`
fails because the previously generated taxonomy still carries it. That is
correct fail-closed behavior, not a false positive. If nothing has ever been
generated in this checkout, both isolated modes fail immediately, naming the
missing generated file or directory — run a full sync first.

`--only=services` **cannot** detect a category added or removed in TalaCMS —
it validates against the last-generated taxonomy by design. Run a full sync
to surface taxonomy file churn.

For an unselected dataset the sync never queries TalaCMS, never prepares an
output, never reports it as changed, and never writes it. It may read a
previously generated file as a documented cross-validation input.

### Category churn checklist

A full sync handles file churn itself: adding a category in TalaCMS produces
a new generated file automatically, and after a successful full sync, any
`src/data/services/*.json` file left over from a category retired in TalaCMS
is deleted and the removal is logged — never `src/data/services/schema/**`,
and never before the write phase has actually succeeded. Nothing needs to be
staged or committed either way; there's no generated file to review.

What the sync can't do for you is update the handful of places that curate
the taxonomy by hand. Check each row after a category is added or retired:

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
taxonomy or the generated file set and need no action.

### Reindexing Meilisearch after a data change

`npm run index:meilisearch` calls `addDocuments` only: it upserts and never
deletes. Removing a service, changing a slug, emptying a category or deleting a
category file therefore leaves **stale documents searchable**.

Both `npm run index:meilisearch` and `npm run index:meilisearch:reset` read
`src/data/services/*.json` directly — sync before indexing, or the script
refuses to run rather than index an empty or absent generated dataset (which
under `--reset` would otherwise wipe real service search data). The
`index-meilisearch.yml` workflow does this automatically; a local run needs
`npm run cms:fetch` first.

After a sync that removes records or changes any slug, run
`npm run index:meilisearch:reset`. A pure addition or in-place field edit may
use the plain command.

### Failure contract

Missing credentials, an unreachable CMS, an HTTP/GraphQL error, a malformed
response, or a failed validation gate — any of these fails `npm run
cms:fetch` before it writes anything, so the pre-build step never hands
`npm run build` a partial or stale dataset. `npm run build` itself never
contacts TalaCMS and has no failure mode tied to it. Deployment credentials
(`TALACMS_API_URL`, `TALACMS_API_TOKEN`, optional `TALACMS_ENVIRONMENT`)
belong in the deployment environment, never in the repository: Netlify site
environment variables for the Netlify build, and — for a Docker build using
the `builder` target, which runs `npm run cms:fetch && npm run build` —
[BuildKit secret mounts](https://docs.docker.com/build/building/secrets/),
passed only for the duration of that one `RUN` instruction and never baked
into an `ARG`, `ENV`, layer, or the build cache:

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=talacms_api_url,env=TALACMS_API_URL \
  --secret id=talacms_api_token,env=TALACMS_API_TOKEN \
  --target builder \
  -t govph .
```

(`env=` reads the value from that variable in the shell running `docker
build`; `src=<file>` works the same way from a local file instead. Either
way, the value never appears in the Dockerfile, an image layer, or `docker
history` — the exact deployment platform that runs this build is not yet
decided, and this command works the same regardless of which one is used.)
Both secrets are required — the build fails before any `RUN` step executes
if either is omitted, and `cms:fetch`'s own fail-closed check catches an
empty or invalid value as a second line of defense. Pull request and fork
checks build through the Dockerfile's `build-app` target instead, which
never fetches from TalaCMS, never needs credentials, and does not accept or
require these secrets.

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
sync's own gates are the real enforcement for those.

`npm run build` also rewrites three tracked files: `public/sitemap.xml` and
`public/llms.txt` (derived from the generated `service_categories.json`, and
both stamped with today's date on **every** build) and `src/version.json`
(commit hash).

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

**Generated CMS data is never committed.** It exists only in a build's
working tree, produced fresh by `npm run cms:fetch` every time.

## Contributing

Thanks to all the people who already contributed!

<a href="https://github.com/govph/govph-2026/graphs/contributors">
    <img src="https://contributors-img.web.app/image?repo=govph/govph-2026&max=750&columns=20" />
</a>

## License

This project is released under the [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/) dedication. This means the work is dedicated to the public domain and can be freely used by anyone for any purpose without restriction under copyright law.

---
