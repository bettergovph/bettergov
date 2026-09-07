# BetterGov.ph

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=BetterGov.ph&subheader=Building+a+better+Philippines%27+national+website&bg=0051BA&color=fff&support=true)

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

`src/data/service_categories.json` and `src/data/critical_hotlines.json` are
generated from TalaCMS by a **pre-build** step — they are gitignored and
never committed. Deployment runs `npm run cms:fetch` before `npm run build`;
`cms:fetch` fetches, validates, and writes both files and fails closed (no
fallback, no placeholder data) if anything goes wrong. `npm run build` itself
only consumes the already-generated files — it does not talk to TalaCMS and
does not need credentials.

```bash
npm run cms:fetch && npm run build
```

`src/data/cms.ts` is the only module that reads these two generated files —
every other module goes through its `serviceCategories` and
`criticalHotlines` exports. The website never queries the CMS at runtime.

`src/data/cms.ts` also re-exports `services`, a read-time aggregation of
`src/data/services/*.json`. Those files are ordinary committed data in this
slice, not generated by `npm run cms:fetch` — a services-specific
build-time sync is a separate, later change.

`src/data/philippines_hotlines.json` keeps its own seven repo-owned hotline
groups (emergency, disaster, security, transport, weather, utility, social
services) and stays committed — only the CMS-owned critical hotlines moved
out into their own generated file.

For local development, put credentials in a local `.env` (see
`.env.example`), then:

```bash
npm run cms:fetch -- --dry-run    # show what would change, write nothing
npm run cms:fetch                 # write the files
npm run cms:fetch -- --only=hotlines
```

Exit codes: `0` success, `1` failure, `3` drift detected (`--dry-run` only).

The script fails without writing anything if TalaCMS is unreachable, returns
an incomplete result, or would produce a file that violates its JSON Schema.
Writes are atomic per file but not across files: if the write phase is
interrupted, check `git status`.

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
