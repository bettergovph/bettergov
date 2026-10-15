# Accessibility review — 15 October 2026

The public checklist at `/accessibility` records **4 supported checks, 5 areas needing improvement, and 6 areas not yet verified**. These are checklist counts, not a conformance score. The target is WCAG 2.2 Level AA; full conformance has not been established.

## Scope and method

- Pull-request worktree based on `abb7286` (`v2`), with only the accessibility changes applied; not a production audit.
- Playwright 1.60.0, axe-core 4.11.4, bundled Chromium.
- Desktop viewport: 1440 × 1000. Mobile emulation: 390 × 844 with touch enabled. Neither is physical-device testing.
- All default-enabled axe rules, including best-practice rules; no excluded nodes, disabled rules, or expected-failure annotations.
- Fonts and finite entrance animations settle before scanning. This avoids false contrast failures from partially transparent animation frames.
- Separate checks cover page titles, one h1, English document language, image alt attributes, visible input accessible names, 320/720 CSS-pixel layouts, skip navigation, services-search focus, mobile-menu Escape handling, reduced motion, and checklist section links.
- Nine default page states are sampled. The current root (`/`) is the coming-soon page; the portal home is at `/home`. Successful live-data states, interactive popovers, search results, chatbot conversations, and other routes are not covered by the page scans.

The local weather, currency, and search APIs returned HTTP 500 during this review. Their loaded states are **not verified**. No API responses were mocked. Network failures are recorded with each axe attachment. Header data is therefore absent, and the search results state must be tested again with a working backend. News content may change independently between runs.

## Results

The full audit completed **48 tests: 30 passed, 18 failed, 0 skipped**. The 18 failures represent five page scans and four behaviour checks, each run in both projects; they are not 18 distinct defects. Known barriers deliberately remain failing assertions so a failed audit cannot be mistaken for a clean result.

The updated accessibility page and design guidance have **zero detected axe violations** at both sampled widths. The old accessibility statement had two low-contrast nodes in its last-reviewed note; the replacement uses readable text colours.

| Page | Desktop axe findings (affected nodes) | Mobile axe findings (affected nodes) |
| --- | --- | --- |
| `/` | None detected | None detected |
| `/home` | `color-contrast` (11), `landmark-complementary-is-top-level` (1) | Same |
| `/services` | `color-contrast` (11), `heading-order` (1) | `heading-order` (1); category sidebar is closed |
| `/government` | `empty-table-header` (1), `heading-order` (1), `landmark-one-main` (1), `region` (4) | Same |
| `/search` | `heading-order` (1) | Same |
| `/contact` | `link-in-text-block` (1) | Same |
| `/about` | None detected | None detected |
| `/accessibility` | None detected | None detected |
| `/design/accessibility` | None detected | None detected |

Incomplete contrast results need human review: Home has 2 desktop and 9 mobile nodes; Services has 3 desktop nodes; Government directory has 1,370 mobile nodes, mainly off-screen table content. An incomplete result is neither a pass nor a confirmed violation. Counts depend on the content and default state present during the scan.

| Behaviour | Result in both projects | Evidence |
| --- | --- | --- |
| Page identification and image markup | Passed | Nine page titles, one h1 per page, `lang="en"`, and alt attributes on all sampled images. Alt-text quality is not established. |
| Search-field names | Passed | Visible inputs have accessible names. Result announcements and error handling are not established. |
| Narrow layouts | Passed | All nine pages at 320 and 720 CSS pixels have no page-level horizontal overflow. Wide tables retain internal scrolling. This does not establish browser-zoom or text-resize support. |
| Checklist section links | Passed | Keyboard Enter on “Needs improvement” navigates to the section and brings its heading into view. |
| Skip navigation | Failed | No skip-to-content link is present as the first tab stop. |
| Services-search focus | Failed | Tabbing to “Search government services” produces neither a visible outline nor a focus ring. |
| Mobile-menu dismissal | Failed | After opening the menu with Enter and moving into it, Escape leaves `aria-expanded="true"`. Both projects use a 390-pixel viewport for this test. |
| Reduced motion | Failed | Home entrance animations still have 0.5-second durations with `prefers-reduced-motion: reduce`. |

## Reproduce and inspect

From the repository root:

```sh
npm run test:a11y
```

The dedicated configuration uses the project's fixed port **5125**, reusing its development server outside CI or starting a loopback-only Vite server with `--strictPort`. Read the VM port map before starting a server; do not let another project occupy this reservation. The audit exits nonzero while barriers remain. It is separate from the general E2E command so the existing accessibility exclusion cannot silently prevent an audit.

Generated artifacts (git-ignored):

- `playwright-report/a11y/index.html`: HTML report with full axe attachments, including `violations`, `incomplete`, and network failures.
- `test-results/accessibility-results.json`: machine-readable results and axe attachments.
- `test-results/a11y/`: failure screenshots, traces, and page snapshots.

To run just the two accessibility pages without replacing the full audit report:

```sh
npm run test:a11y -- --grep 'axe: (Accessibility|Design accessibility)' --reporter=list --output=test-results/a11y-pages
```

The rendered checklist is at `/accessibility`. The isolated PR run used a temporary configuration wrapper on reserved loopback port 5298, changing only the server and base URL; the committed audit command defaults to 5125. This is not a production deployment.

## Follow-up checklist

### Confirmed barriers

- [ ] Add a first-tab skip link that moves focus past repeated navigation and allows tabbing into page content. Relevant files: `src/App.tsx`, shared navigation, and page main regions.
- [ ] Add visible keyboard focus to `src/components/v2/ui/BigSearch.tsx` and audit other controls with `outline-none`. Check focus contrast and clipping, not merely the presence of a CSS property.
- [ ] Implement Escape dismissal and focus restoration for mobile navigation in `src/components/v2/layout/Masthead.tsx` / `MobileMenu.tsx`. Review desktop dropdown focus and keyboard semantics too.
- [ ] Fix low-contrast holiday labels in `src/components/v2/home/NewsAndHolidays.tsx` and secondary counts in `src/pages/services/index.tsx`. The `ed-ink-4` token is approximately 3.01:1 on white, below the normal-text target. Recheck every use and background before changing a shared token.
- [ ] Fix the missing main landmark in `src/pages/government/index.tsx`, the empty header in `src/components/v2/directory/DirectoryResults.tsx`, and headings in Services and the shared footer. Review nested home-page aside semantics.
- [ ] Add a persistent visual cue to the inline departments-directory link in `src/pages/ContactUs.tsx`.
- [ ] Honour reduced motion for entrance animations and smooth scrolling. Review rotating information for pause controls. Reduced-motion preferences are a product goal; this test alone is not an assessment of all motion-related WCAG criteria.

### Human and broader testing

- [ ] Test complete tasks with NVDA, VoiceOver, TalkBack, voice control, and people with disabilities.
- [ ] Check 200% text resizing, 400% browser zoom, and WCAG text-spacing overrides.
- [ ] Audit target size/spacing against WCAG 2.2 AA (24 × 24 CSS pixels, including exceptions); aim for 44 × 44 for primary controls.
- [ ] Review English/Filipino translation coverage, language declarations after switching, and plain language.
- [ ] Test successful live data, filters, validation, empty/error/loading states, maps, chatbot focus and announcements, and full service journeys.
- [ ] Review meaningful alt text, PDFs, captions/transcripts, and linked agency services.
- [ ] Resolve every incomplete axe result; widen coverage to other routes, browsers, and physical devices.

## Keeping the public checklist honest

Checklist content and the sampled routes are in `src/data/accessibility.ts`. Move an item to supported only after recording the scope, evidence, and date of verification. Re-run the relevant checks after a fix, then update both this report and the public page's review summary. Do not turn a known failure into a skip or disable a rule to obtain a passing report. A dated result does not automatically describe later content or deployments.

## Implementation validation

- Edited TypeScript/TSX files and Playwright configurations pass ESLint.
- Vite production bundling succeeds (existing large-chunk warnings remain).
- The full application TypeScript check is blocked by errors outside this change, including legacy home/news/weather components, search-hit typing, breadcrumb attribute imports, and directory/page prop types. No errors were reported in the accessibility files.

## References

- [W3C WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [W3C preliminary accessibility checks and their limits](https://www.w3.org/WAI/test-evaluate/preliminary/)
- [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG target size minimum and exceptions](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
