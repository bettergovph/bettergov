# GOV.PH launch security audit

**Decision: not ready for security sign-off.**

Audited 16–17 October 2026 UTC against branch `v2`, revision
`f50fe0edde2952d9344f440e90df96c6e831e602`, the running development preview,
`www.gov.ph`, and the configured production/staging Workers hostnames.
This is a source, dependency, configuration, and limited live application audit.
It is not an assessment of the internals of eGovAI, GitHub, Cloudflare, TalaCMS,
or the Meilisearch deployment.

An active development-server credential exposure was contained during the audit.
**Credential rotation remains outstanding.** Other findings below remain open;
no production deployment, issue submission, provider configuration change, or
credential rotation was performed.

### October 17 remediation update — prepared locally, not deployed

Following the audit, API hardening was implemented for review. The original
findings and source line references below describe the audited revision.

- SEC-02: removed email collection and forwarding. Older clients' email fields
  are accepted only for compatibility and discarded; the private-contact field
  is absent from the generated issue template.
- SEC-04: assistant/report requests have streamed 64 KiB limits and a 15-second
  body deadline. Reports validate field types, lengths, required fields, and URLs.
- SEC-05: assistant configuration requires HTTPS; assistant and report provider
  calls reject redirects and avoid logging response bodies.
- SEC-06, partial: bounded upstream response sizes and lifetimes, cancellation
  on client disconnect, and no automatic retry of GitHub writes. Existing per-IP
  limits remain. Global budgets and further bot/report abuse controls are open.
- SEC-08: dynamic responses add `nosniff`; `public/_headers` now records the six
  static security headers verified against production on October 17. Remote
  verification after deployment is still required.

Regression tests cover normal requests, invalid/oversized bodies, redirects,
legacy-email privacy, stream delivery/cancellation, and stalled providers. CI
includes the new tests. No provider credentials were rotated and no remote
configuration was changed. See the rollout notes in
[`functions/README.md`](../functions/README.md#launch-hardening-rollout).

**Patch verification:** 663 tests in 42 files pass (44 new tests); full lint,
frontend build, and staging/production Worker dry runs pass. Explicit frontend
and Worker type checks retain 38 and 27 pre-existing errors respectively, with
no additional diagnostics. Providers were mocked in the new tests. Remote
provider compatibility and production rollout are not verified by these checks.

## Findings and launch priority

| ID | Severity | Finding | Status / launch action |
| --- | --- | --- | --- |
| SEC-01 | High | Public development preview served Worker secrets | File access blocked; rotate exposed credentials before sign-off |
| SEC-02 | High, conditional | Reporter email is placed in the GitHub issue despite a private-contact promise | Remove collection/public forwarding, or implement genuinely private storage before enabling reporting |
| SEC-03 | Medium | Production serves the application and API over plain HTTP | Enforce HTTPS before launch |
| SEC-04 | Medium | Assistant and report endpoints parse unbounded bodies; reports lack a runtime schema | Add streamed byte limits and validation |
| SEC-05 | Medium | Assistant credentials can follow upstream redirects or be sent over HTTP | Require HTTPS and reject redirects |
| SEC-06 | Medium | Paid/public write integrations have incomplete resource and abuse controls | Bound stream lifetime, cancellation, and aggregate usage; protect report submissions |
| SEC-07 | Medium | Dependency advisories remain in the browser and build/release dependency trees | Patch and assess reachability; do not equate scanner totals with live exploits |
| SEC-08 | Medium | Production browser hardening is not reproducible from the checked-in configuration | Codify and test headers; staging currently lacks them |
| SEC-09 | Medium, dormant | Disabled crawler logs credentials and permits public provider/state changes | Keep disabled until repaired and explicitly restricted |
| SEC-10 | Low | CSV exports preserve spreadsheet formulas | Escape formula-like text fields |
| SEC-11 | Low / defense in depth | Restored chat HTML bypasses sanitization | Sanitize again on restore/render |
| QA-01 | Release assurance | Build success masks frontend and Worker type errors | Repair type-check gates and failures |

Severity reflects observed application impact and prerequisites. No unauthenticated
production remote-code-execution or cross-user account compromise was demonstrated.

## SEC-01 — development preview exposed credentials

**Evidence:** Before containment, unauthenticated requests to
`http://95.217.112.160:5125/.dev.vars` and the loopback equivalent returned HTTP
200. The response was compared in memory to the local `.dev.vars` and matched
exactly. No secret values were printed or saved in audit artifacts. The server
was listening on `0.0.0.0:5125`. The public-address check was made from this VM;
an independent external network was not used.

The file contained `EGOVAI_API_KEY`, `EGOVAI_API_SECRET`, and
`MEILISEARCH_SEARCH_API_KEY`, as well as non-secret provider configuration.
The assistant credentials could allow direct use of the upstream integration,
bypassing this Worker's public API protections. The actual privileges of these
keys were not tested. A search-only key should have lower impact than an admin
key, but its actual scope must be verified.

**Cause:** `vite.config.ts` exposed the project root and relied on Vite's default
deny list. That list protects `.env` but does not include Wrangler's `.dev.vars`.
Git ignoring a file does not prevent an HTTP server from serving it.

**Containment applied:** Added `server.fs.deny` entries in `vite.config.ts`,
retaining Vite's default protections and additionally excluding `.dev.vars`,
its environment variants, `.wrangler`, and `.worktrees`. The existing server
reloaded the configuration. The direct path, `?raw`, `?url`, and `/@fs/` path
then returned 403; `.env` and `.git/config` remained blocked and `/` returned 200.

**Remaining action:** Revoke/rotate all three exposed credentials, update each
consumer that uses them, and verify the replacements' least-privilege scopes.
Review available preview/provider access logs and usage for misuse. Exposure
duration and previous downloads are unknown. Prefer a Tailscale or authenticated
preview route for continued development. Do not regard the file block as a
substitute for rotation.

## SEC-02 — reporter email is not private

**Source:** `functions/api/report-hotline.ts:112`;
`src/components/ReportHotlineModal.tsx:385` and `:406`.

The form promises that an email will be visible only to maintainers. The handler
instead appends it to the issue body as an HTML comment. Any reader with access
to the issue's raw Markdown or API representation can read the comment. HTML
comments are presentation markup, not access controls.

A mocked Worker request with a synthetic email returned 201 and included that
email verbatim in the outbound GitHub issue body. No real issue was created.
The destination repository's visibility and production `GITHUB_TOKEN` presence
were not verified: an unauthenticated repository metadata request returned 404.
Thus public email disclosure is **conditional on the reporting integration and
repository visibility**, not a claim that existing private emails were found
publicly exposed.

**Fix:** Remove the email field and server-side forwarding for launch, or store
contact details separately behind maintainer authorization. Make the UI agree
with the real storage and visibility model. Verify the outbound issue contains
no private-contact field, and assess prior issue bodies privately if reporting
has been used.

## SEC-03 — plain HTTP is still served

**Live evidence:** Requests made with redirects disabled to both
`http://www.gov.ph/` and `http://www.gov.ph/api/status` returned 200, with the SPA
and the online API response respectively; neither supplied `Location`.

The HTTPS document supplies HSTS, which helps browsers that already know the
policy. It does not make an HTTP response secure, and browsers ignore HSTS
received over HTTP. An initial insecure visit without an existing policy remains
exposed to network modification. [MDN's HSTS documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)
describes this first-visit limitation and the redirect requirement.

**Fix:** Configure Cloudflare to redirect HTTP document requests to HTTPS and
ensure API requests cannot perform work over cleartext. Test both static assets
and Worker routes. Retain HSTS over HTTPS. Review the broader government domain
inventory before considering `includeSubDomains` or preload; those are separate
domain-wide decisions.

## SEC-04 — request size and report validation gaps

**Source:** `functions/api/assistant.ts:245`;
`functions/api/report-hotline.ts:46` and its required-field checks.

Both handlers call `request.json()` before applying an application byte limit.
The assistant's 4,000-character question limit only applies after the entire
JSON body has been buffered and parsed. A synthetic request containing a short
question plus a 1 MiB unused field was accepted and reached the mocked upstream.
The report handler also accepts objects/arrays in required fields: a synthetic
object hotline name produced `Outdated Hotline: [object Object]` and HTTP 201.

Large bodies can consume Worker memory/CPU before validation; accepted report
fields can create malformed or abusive issues. Per-IP request counts and
Cloudflare's platform upload limits do not provide an appropriately small
application payload bound. No memory-exhaustion test was run on production.

**Fix:** Reuse the search handler's streamed-body approach with a small explicit
cap, reject oversized actual streams even without `Content-Length`, and validate
an object schema with bounded string fields and appropriate URL/email handling.
Reject unsupported content types and unexpected fields consistently. Return
generic parse failures instead of forwarding parser diagnostics.

## SEC-05 — assistant credential transport

**Source:** `functions/api/assistant.ts:76` and `:283`.

The configured assistant base URL may use HTTP. Fetch requests attach both
`X-EGOVAI-API-KEY` and `X-EGOVAI-API-SECRET` without an explicit redirect policy.
The audit confirmed both settings with synthetic configuration and captured
request options. In Workers, following a redirect can forward sensitive custom
headers to a different host. [Cloudflare documents this behavior](https://developers.cloudflare.com/workers/runtime-apis/request/).

This requires a misconfigured HTTP endpoint or an upstream redirect; arbitrary
users cannot select the base URL through the public request body. No redirect
exploit or actual upstream credential forwarding was attempted.

**Fix:** Require an HTTPS configuration without URL credentials, use
`redirect: 'manual'`, and treat unexpected redirects as generic upstream errors.
If redirects are needed, explicitly validate the destination before attaching
credentials. Apply an explicit policy to other credential-bearing Worker fetches
as well; the search and weather fetches already reject redirects.

## SEC-06 — resource lifetime and abuse controls

**Source:** `functions/api/assistant.ts:296`,
`functions/api/report-hotline.ts:116`, `functions/lib/request-security.ts`.

The streamed assistant request has `signal: null`: no total lifetime, idle
timeout, or explicit client-disconnect signal is attached to the upstream fetch.
The GitHub issue request also lacks an application timeout. The JSON assistant
request does have a 90-second timeout.

Anonymous report requests can create issues at up to five requests per minute
per IP, while assistant requests can use the configured engine at up to twenty.
No application-wide spend ceiling, concurrency cap, report deduplication, or
bot challenge was found in this repository. Origin checks do not authenticate
server clients. Cloudflare's rate-limit bindings are local to a Cloudflare
location and eventually consistent, rather than a global budget mechanism.
[Cloudflare rate-limit documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

**Fix:** Bound upstream connection/idle/total lifetimes, propagate cancellation
where supported, and enforce aggregate provider budgets or concurrency limits.
Use a server-verified challenge and duplicate suppression for issue submissions.
Confirm provider-side budgets and alerts separately. This finding identifies
missing application controls; it does not assert that provider/account limits
are absent. No load, spam, or cost-exhaustion test was performed.

## SEC-07 — dependency findings need remediation and reachability review

Registry audit results at the time of review:

| Dependency scope | Critical | High | Moderate | Low | Total affected packages |
| --- | ---: | ---: | ---: | ---: | ---: |
| Root lockfile, all dependencies | 2 | 28 | 12 | 4 | 46 |
| Root lockfile, `--omit=dev` | 0 | 7 | 5 | 3 | 15 |
| `src/data/flood_control` tool lockfile | 0 | 0 | 1 | 0 | 1 |

These are npm's affected-package counts, including dependencies affected through
other packages. They are not counts of unique vulnerabilities or demonstrated
production exploits. `wrangler` and `jsdom` are declared production dependencies,
so `--omit=dev` also includes development infrastructure that is not application
runtime code in the deployed Worker.

| Area | Evidence and applicability |
| --- | --- |
| Browser navigation | `react-router-dom` 6.30.3 and its router packages have redirect advisories. Update and test navigation. No exploitable attacker-controlled navigation sink was demonstrated. The SSR-hydration advisory does not apply to this app's declarative `BrowserRouter` setup. |
| HTML sanitizer | DOMPurify 3.4.13 has two low-severity `IN_PLACE` advisories. This code sanitizes strings and does not use `IN_PLACE`; the advisory prerequisites were not found. Still update the sanitizer. |
| Release tooling | Critical advisories affect Handlebars 4.7.9 and node-tar 7.5.13 through release/npm tooling. These packages were not identified as public Worker request handlers. Assess and patch the release pipeline, which can hold repository write credentials. |
| Development tooling | Vite 7.3.3, Vitest 4.1.6, Wrangler/Miniflare, undici, and ws have advisories. The cited Vite issues are Windows-specific, so they do not explain SEC-01 on this Linux VM. |
| Explicit override | `package.json` pins `ws` to vulnerable 8.20.1. Ordinary transitive upgrades cannot remove that pin; update/remove it deliberately. |
| Data-processing scripts | `stream-json` in the separate flood-control lockfile has advisories. These tools are not public HTTP handlers. |

Primary advisory references:
[React Router redirects](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2),
[backslash navigation](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6),
[SSR applicability](https://github.com/advisories/GHSA-337j-9hxr-rhxg),
[DOMPurify hooks](https://github.com/advisories/GHSA-p98j-92pf-mc4p), and
[DOMPurify rawtext](https://github.com/advisories/GHSA-6688-9rhm-gjv2).
The evidence directory contains every reported package, installed lockfile
version, advisory URL, and npm's fix-availability metadata.

**Fix:** Update packages in reviewed groups, rerun tests/build and registry scans,
and record remaining advisories with their actual prerequisites. Do not blindly
run `npm audit fix --force`: suggested fixes include major changes/downgrades.
Dependabot currently covers GitHub Actions only; add npm coverage for both
lockfiles and a vulnerability review gate in the release process.

## SEC-08 — browser hardening differs between source and deployment

Production HTTPS documents had an enforced CSP with `script-src 'self'`,
`script-src-attr 'none'`, `object-src 'none'`, and `frame-ancestors 'none'`, plus
HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, and Permissions-Policy.
The production Workers hostname had equivalent document headers.

However, no `public/_headers`, corresponding middleware headers, or checked-in
edge-rule configuration explains those headers. A clean build generated no
`dist/_headers`. The staging document at `govph-dev.govph.workers.dev` lacked
these controls. Dynamic production API responses also lacked the baseline
security headers, although they were JSON/SSE and correctly used `no-store`.

The exact source of production headers was not established. This is a
reproducibility/configuration-drift concern, **not a claim that production
documents currently lack CSP or framing protection**.

**Fix:** Commit the intended static response header policy or its infrastructure
configuration, add appropriate headers in the dynamic response wrapper, and
verify the built artifact and each deployed hostname. Cloudflare `_headers`
rules apply to static assets, not responses generated by Worker code.
[Cloudflare static header documentation](https://developers.cloudflare.com/workers/static-assets/headers/).

## SEC-09 — keep the crawler disabled

**Source:** `functions/lib/jina.ts:19`, `functions/api/crawl.ts:69`,
`functions/lib/crawler.ts:78` and `:90`.

The Jina client logs its API key directly; a synthetic credential was observed in
the captured console call. Public query parameters also change a module-global
default provider, which persists across requests in an isolate. The `type in
crawlers` membership test accepts inherited properties such as `constructor`,
which are not crawler implementations. Public `force=true` requests would invoke
paid crawling and database writes without administrative authorization.

The `.gov.ph` hostname allowlist is useful but does not verify downstream
redirects, resolved addresses, ports, or crawler browser subresources. Those
behaviors depend on the external providers and were not tested; no successful
SSRF is claimed. SQL writes and lookups reviewed use bound parameters.

**Current exposure:** Production `/api/crawl` returned 503 because `BETTERGOV_DB`
is absent. The checked-in deployment also omits this binding. These defects are
dormant on that deployment and must not be rated as an active public crawler
exploit.

**Fix before enabling:** Remove credential/body logging; keep provider selection
request-local and use own-property/enum validation; require authorization for
refresh/write operations; enforce provider egress and timeout policies. Repair
the missing `getContentByUrl` import and unsupported `crypto.createHash` usage
before functional verification. Review old crawler logs for credentials if it
was enabled previously.

## Lower-priority findings

**SEC-10 — CSV formula injection.** `src/lib/exportData.ts:34` only performs CSV
delimiter/quote escaping. A synthetic text cell `=1+1` was exported unchanged.
A spreadsheet may interpret it as a formula. This requires control of exported
source data and a recipient opening the CSV; no attacker-controlled data path
or spreadsheet exploit was demonstrated. Neutralize leading formula characters
in text fields and correctly quote headers and control characters while
preserving legitimate numeric values.

**SEC-11 — stored chat HTML.** `src/lib/assistant.ts:554` loads stored messages
without sanitizing their HTML; `src/components/ui/GovPhChatbot.tsx:98` restores
it and `:565` renders it as HTML. In a fresh local browser context, planting a
synthetic stored image handler and opening chat executed the handler. This
requires prior same-origin storage control; it is not demonstrated cross-origin
XSS. Production CSP additionally blocks inline event handlers. Re-sanitize on
restore/render and validate/bound stored messages so historical markup cannot
bypass current sanitizer policy.

## QA-01 — release checks give incomplete assurance

`npm run build` and the Worker production dry run passed. Explicit checks found
**38 frontend type errors and 27 Worker type errors**. The root `tsconfig.json`
has `files: []` with project references, while `build:app` invokes plain `tsc`,
not build mode. That invocation does not perform the intended referenced-project
check. Wrangler bundling also does not replace a TypeScript check.

The missing crawler import and unsupported crypto API are concrete examples
that bundling can miss. The existing 619 passing tests do not establish the
safety of untested report/crawler behavior.

**Fix:** Run the intended project checks explicitly (or use an appropriate
`tsc -b` configuration), add a Worker `--noEmit` check to CI, and resolve the
reported errors. Keep required checks aligned with the actual `v2` release
branch: several broad workflows currently only target `main`. Branch protection
and required-check settings were not inspected.

## Controls verified and audit coverage

| Area | Result |
| --- | --- |
| Automated tests | 39 test files, 619 tests passed |
| Build, lint, packaging | Full build, ESLint, changed-config formatting, production Worker dry run passed |
| CORS | Foreign-origin live API request rejected with 403; exact-origin/preflight/failure-path tests pass |
| Rate limiting | Configured 120/min general, 20/min assistant, 10/min crawler, 5/min report; existing tests verify missing bindings fail closed and rejection paths. Production was not flooded to exhaust quotas. |
| Search boundary | Live allowed-index search returned 200; disallowed `keys` index returned 404. Source restricts routes/indexes, caps streamed request bytes, rejects unknown query operations, and attaches a server-side key. |
| Provider requests | Search, weather, and forex use fixed/configured destinations with redirect rejection and timeouts |
| SQL | Reviewed crawler queries use parameter binding; no reachable SQL-injection path demonstrated |
| Content rendering | News and new assistant responses use DOMPurify; dedicated sanitizer tests pass. No unsanitized fresh provider HTML sink was identified. |
| Browser smoke checks | Homepage, hotlines, news, and search loaded in Chromium without observed page errors or CSP violations; no form/chat submission was made |
| Production sensitive paths | `/.env` and `/.git/config` returned the SPA fallback HTML, not secret files; HTTP 200 alone would be a scanner false positive |
| Secret scan | 548 tracked files and built assets checked with selected token/key patterns and seven local secret-value comparisons; reviewed matches were test fixtures/ordinary text. No matching local credential found in tracked source or assets. |
| Local Git history | 3,483 reachable text blobs scanned with selected provider/private-key patterns and local-secret comparisons; no matches. 41 binary blobs skipped. This is a bounded pattern scan, not a guarantee that arbitrary historical secrets are absent. |
| CI/Docker | Actions are SHA-pinned in reviewed workflows; PR build path is secret-free; Docker excludes local credential files; release write permissions have an explicit workflow scope |

## Required close-out evidence

1. Rotate SEC-01 credentials, confirm their scopes, and record provider/access-log
   review results. Retest secret paths after any preview-server restart.
2. Resolve the hotline email design before accepting real reports. Confirm actual
   repository visibility and the issue token's repository/permission scope.
3. Demonstrate HTTPS enforcement on documents and API routes.
4. Add request-size/schema limits and harden assistant redirect/time-limit
   handling. Confirm aggregate assistant budgets and report abuse controls.
5. Remediate dependencies or document specific accepted, unreachable advisory
   conditions; repair the type-check release gates.
6. Make browser hardening reproducible and verify production/staging after the
   actual release deployment. Keep the crawler disabled unless SEC-09 is closed.
7. Complete the external-service checks that this repository cannot establish:
   assistant session isolation and confirmation-token binding/replay behavior;
   search-key privileges and index exposure; upstream prompt/tool permissions;
   provider data retention; account-level WAF, bot controls, IAM/MFA, logging,
   budget alerts, backups, and recovery. These remain unverified, not presumed
   vulnerable. Exercise session-isolation tests with synthetic sessions only.

The audit used low-volume live requests and local mocked provider calls. It did
not send messages to maintainers, create GitHub issues, execute live assistant
actions, crawl third-party targets, modify remote data, or run a load test.

Sanitized machine-readable evidence and type-check diagnostics are under
[`security-audit-evidence/`](./security-audit-evidence/). The initial audit applied
Vite secret-file containment; subsequent local API remediation is recorded above.
