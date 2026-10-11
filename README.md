# BetterGov.ph

A community-led initiative to create a better and more usable Philippine national government website.

## Why We're Building This Project

The current state of Philippine government websites, particularly the main portal [www.gov.ph](https://www.gov.ph), presents numerous challenges for citizens:

- The main Gov.ph website is outdated and has not been updated for a long time
- Full of broken links and difficult navigation paths
- Inconsistent formatting and design across pages
- Poor user experience and accessibility issues
- Similar problems exist across most Philippine government agency websites

These issues create barriers for citizens trying to access essential government services and information.

## Our Mission

We are a volunteer-led initiative with a clear mission: to provide a 'better' and 'usable' website for the Philippines.

Our goals include:

- Building a proper national website that reflects Filipino values and culture
- Creating intuitive navigation and search functionality
- Ensuring accessibility for all citizens, including those with disabilities
- Providing accurate, up-to-date information about government services
- Establishing a model for how government digital services can and should work

## Features

- Modern, responsive design that works on all devices
- Comprehensive directory of government services and agencies
- User-friendly navigation and search
- Accessibility features for users with disabilities
- Regular updates and maintenance

## Documentation

For an easy-to-read overview of the project, visit the [BetterGov Docs](https://docs.bettergov.ph/).

## Join Us as a Volunteer

We're always looking for passionate individuals to help improve BetterGov.ph. We need volunteers with various skills:

- Frontend and backend developers
- UX/UI designers
- Content writers and editors
- Translators (for Filipino and other local languages)
- Accessibility experts
- Project managers
- QA testers

If you're interested in contributing, please reach out to us at [volunteers@bettergov.ph](mailto:volunteers@bettergov.ph) or open an issue in this repository.

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

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/bettergovph/bettergov?quickstart=1)

## Docker

This project includes Docker support for easy deployment and consistent environments.

### Building and Running

```bash
# Build the Docker image — the default (final) stage needs TalaCMS build
# secrets; see "Syncing content from TalaCMS" > "Failure contract" below.
docker build -t bettergov .

# Run the container
docker run -p 8080:80 bettergov

# Run in detached mode
docker run -d -p 8080:80 --name bettergov bettergov
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

## Syncing content from TalaCMS

`src/data/service_categories.json`, `src/data/critical_hotlines.json`,
`src/data/services/*.json`, the four single-file Government Directory
datasets under `src/data/directory/` (`departments.json`, `executive.json`,
`constitutional.json`, `legislative.json` — see below), and the 19 per-region
LGU files under `src/data/directory/lgu/*.json` (see below) are all generated
from TalaCMS by a **pre-build** step — they are gitignored and never
committed.
Deployment runs `npm run cms:fetch` before `npm run build`; `cms:fetch`
fetches, validates, and writes every generated dataset and fails closed (no
fallback, no placeholder data) if anything goes wrong. `npm run build` itself
only consumes the already-generated files — it does not talk to TalaCMS and
does not need credentials.

```bash
npm run cms:fetch && npm run build
```

`src/data/cms.ts` is the only module that reads these generated files —
every other module goes through its `serviceCategories`, `criticalHotlines`,
and `services` exports for the service-related datasets, and its
`governmentDepartments`, `executiveOffices`, `constitutionalOffices`,
`legislativeChambers`, and `lguRegions` exports for the Government Directory
ones (`src/lib/lgu.ts` is the one permitted indirection onto `lguRegions`,
for the two `government/local` pages). The website never queries the CMS at
runtime.

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
npm run cms:fetch -- --only=departments
npm run cms:fetch -- --only=executive
npm run cms:fetch -- --only=constitutional
npm run cms:fetch -- --only=legislative
npm run cms:fetch -- --only=lgu
```

Exit codes: `0` success, `1` failure, `3` drift detected (`--dry-run` only).

The script fails without writing anything if TalaCMS is unreachable, returns
an incomplete result, or would produce a file that violates its JSON Schema.
If a later rename fails partway through a write batch, every file the batch
already replaced is rolled back to its pre-sync content (or deleted, if it
didn't exist before) — for any dataset, including LGU's 19 files, whose
generated output is gitignored, so `git status` cannot reveal a partial
write there the way it can for tracked files. This rollback runs in-process
and covers a rename failing while the sync is still running to react to it
(disk pressure, permissions, a concurrent process); it does not cover the
Node process itself being killed or crashing mid-batch, which leaves
whatever the OS's own per-file atomic rename already guaranteed and nothing
more. If a restoration itself fails, the sync does not claim a clean
rollback it didn't achieve: it fails with the specific path(s) that may
still hold new, unreviewed content, for manual inspection before
re-running. Absent that explicit warning, recover from a failed sync by
simply re-running it once the underlying cause is resolved.

`--only=lgu` additionally removes any locally-present LGU region file that
no longer corresponds to a region in TalaCMS (e.g. a retired region), after
a successful commit — unlike the other single-model `--only=` modes, LGU's
own fetch always sees its complete region set in one shot, so it doesn't
need a full sync to safely judge staleness. `--dry-run` reports a stale LGU
file as drift (and exits `3`) without removing it.

### Choosing a run mode

| If you are… | Use |
|---|---|
| syncing everything, or unsure | `npm run cms:fetch` |
| **renaming a category or subcategory** | `npm run cms:fetch` — **full sync required**; both isolated modes will fail the name-agreement gate |
| adding or retiring a category in TalaCMS | `npm run cms:fetch` — only a full sync sees taxonomy file churn |
| editing service content only (titles, URLs) | `--only=services` is safe **if** no display name changed |
| editing taxonomy display names only | `npm run cms:fetch` — see the rename row |
| editing a government department, executive office, constitutional office, legislative chamber, diplomatic entity or LGU | `--only=departments` / `--only=executive` / `--only=constitutional` / `--only=legislative` / `--only=diplomatic` / `--only=lgu` — each is a single-model edit with no cross-dataset gate |

### Generated directory datasets

Six government-directory datasets are CMS-owned and gitignored:
`src/data/directory/departments.json` (23), `executive.json` (38),
`constitutional.json` (229), `legislative.json` (2), `diplomatic.json` (227
records in 3 groups), and `src/data/directory/lgu/`
(19 per-region JSON files: 19 regions, 80 provinces, 110 cities, 1435 municipalities).
The third holds all Constitutional-branch records — 3 constitutional offices, 2
constitutionally mandated bodies, 110 GOCCs and 114 SUCs — because they share one
TalaCMS model, one file and one route tree. The fourth holds the Senate and House of
Representatives; House Members and Party-list Representatives are not synced as their
own datasets — they arrive as nested relations on the House `LegislativeChamber` record
and are projected into `house_members` and `party_list_representatives` inside that same
file, exactly where the app has always read them. The fifth, Diplomatic, is the
only generated dataset whose file is an OBJECT rather than an array: one
TalaCMS model (`DiplomaticEntity`) discriminated by `entityType` and grouped
into the three arrays the app has always read — `"Diplomatic Mission"` (70),
`"Consulate"` (139) and `"International Organization"` (18). All three keys
are required by the tracked schema, and a fourth `entityType` fails the sync
rather than silently adding a top-level key no page renders. Only the 70
missions carry a `slug`; consulates and organizations have no detail route
and none. `title` is the one field whose `null` is preserved rather than
omitted — four missions carry an explicit null in both TalaCMS and the
generated file. The sixth, LGU, is organized by region in separate generated
files rather than a single consolidated file, but only the top-level
`*.json` region files are gitignored; `src/data/directory/lgu/schema/` and
`src/data/directory/lgu/__fixtures__/` stay tracked.
Everything else under
`src/data/directory/` is still hand-maintained and committed: judicial and the
two orphaned member files (`house_members.json`,
`party_list_representatives.json` — now a second, hand-maintained copy of
content the CMS owns via `legislative.json`).

Each model is fetched by its own GraphQL operation, so an isolated `--only=`
run cannot be made to fail by another model's data. Constitutional uses its
own page-size ceiling of 300 rather than the shared 100, because it carries
229 records; the CDA hard-caps `first` at 500, so if the ceiling gate ever
fires, raise it to at most 500 — beyond that the model needs real pagination.

Diplomatic likewise uses its own ceiling of 300 for its 227 records, with the
same escalation rule: raise to at most 500, and beyond that the model needs
real pagination.

LGU is the first dataset in this repo to exceed the 500 hard-cap (1435 municipalities).
It uses `scripts/talacms/paginate.ts`'s `fetchAllRecords` helper for skip-based
pagination. Paging orders by `id_ASC`, not `position_ASC`, because `position` is
per-parent (a per-region province index, per-province city index, etc.) and cannot
order a flat top-level page spanning many parents — only `id` is both present and
globally unique across the whole flat collection.

A run carrying two or more of these datasets also checks that no slug appears
in more than one of them: Meilisearch keys its single index by `slug`, so a
collision would make one office unsearchable. The authoritative version of
that check runs over the complete directory snapshot during Meilisearch
preflight.

`diplomatic.json` is loaded by the Meilisearch preflight's REQUIRED,
schema-validated loader like the other five, but declares `objectDocument`
because it is a single object rather than an array — it contributes exactly
one document, which is what it contributed before the migration. The array
guard stays strict for every other required source.

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
4. **Guides** (`src/pages/guides/passport.tsx`) — only if a guide references it.
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
  -t bettergov .
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

<a href="https://github.com/bettergovph/bettergov/graphs/contributors">
    <img src="https://contributors-img.web.app/image?repo=bettergovph/bettergov&max=750&columns=20" />
</a>

## License

This project is released under the [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/) dedication. This means the work is dedicated to the public domain and can be freely used by anyone for any purpose without restriction under copyright law.

---
