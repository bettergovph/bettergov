/**
 * Branding for BETTERGOV.PH, the volunteer run portal of the Republic of the Philippines.
 *
 * The logos live in `public/`, so they are served from the site root and need
 * no bundler import. Keep every logo reference pointed at these constants so
 * an asset can be swapped in one place. Every version of the BetterGov.ph logo
 * is at https://github.com/bettergovph/logo.
 *
 * The site does not use the coat of arms or seal of the Philippines anywhere:
 * it may not be used by an unofficial site. Use the BetterGov.ph logo instead.
 */

/** Site name used in page titles, link labels and meta tags. */
export const SITE_NAME = 'BETTERGOV.PH';

/**
 * The site's logo for now: the BetterGov.ph horizontal logo in its primary
 * blue, for the white header. The footer uses the white variant,
 * BETTERGOV_LOGO_SRC. Downsized from
 * https://assets.bettergov.ph/logos/png/horizontal-primary.png and served
 * from `public/`, because the Content-Security-Policy only allows images
 * from this origin.
 */
export const SITE_LOGO_SRC = '/logos/png/bettergov-primary.png';

export const SITE_LOGO_ALT = 'BetterGov.ph';

/**
 * The stacked (vertical) BetterGov.ph logo in white, for navy title cards:
 * the /coming-soon page and the cover of the brand guide. Trimmed and
 * downsized from https://assets.bettergov.ph/logos/png/vertical-white.png.
 */
export const BETTERGOV_VERTICAL_WHITE_SRC =
  '/logos/png/bettergov-vertical-white.png';

/**
 * Owner named in the brand guide (/design) and in the Dublin Core creator and
 * publisher meta tags.
 */
export const SITE_OWNER = 'Republic of the Philippines';

/** One-line description used in page titles and social cards. */
export const SITE_TAGLINE =
  'The Volunteer Run Portal of the Republic of the Philippines';

/**
 * Canonical origin for absolute URLs (canonical links, Open Graph, sitemap,
 * llms.txt). Change it here if the production host differs.
 */
export const SITE_URL = 'https://bettergov.ph';

/** Social-card image, served from `public/`. */
export const DEFAULT_OG_IMAGE = '/og-image.png';

/**
 * BetterGov.ph's own site about the movement. The About links point here, and
 * /about redirects here.
 */
export const ABOUT_URL = 'https://about.bettergov.ph';

/** BetterGov.ph's People's Budget Portal: the national budget, line by line. */
export const BUDGET_URL = 'https://budget.bettergov.ph';

/** Where new volunteers join the BetterGov.ph movement. */
export const VOLUNTEER_URL = 'https://about.bettergov.ph/volunteer';

/** Public repository and issue tracker for this portal. */
export const REPO_URL = 'https://github.com/govph/govph';
export const ISSUES_URL = `${REPO_URL}/issues`;
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new`;

/**
 * The national branding campaign mark for the footer, hidden for now (see
 * SHOW_GOVERNMENT_MARKS in Footer.tsx).
 *
 * This is the dark-background variant: the emblem is untouched, but the
 * "BAGONG PILIPINAS" wordmark is repainted white. In the original it is
 * #011d92, which lands at roughly 1.4:1 on the navy footer and disappears.
 * A light-background version can be regenerated from the Wikimedia Commons
 * original, which is public domain as a Philippine government work.
 */
export const BAGONG_PILIPINAS_SRC = '/logos/png/bagong-pilipinas-inverse.png';

export const BAGONG_PILIPINAS_ALT = 'Bagong Pilipinas';

/**
 * Footer marks, in dark-background variants. eGovPH: the official logo
 * (e.gov.ph) with its #0040e7 wordmark repainted white; the yellow and red of
 * the "O" are untouched. It is hidden for now with Bagong Pilipinas.
 * BetterGov.ph: its single-colour horizontal logo in white, which heads the
 * footer.
 */
export const EGOV_LOGO_SRC = '/logos/png/egovph-inverse.png';

export const EGOV_LOGO_ALT = 'eGovPH';

export const BETTERGOV_LOGO_SRC = '/logos/png/bettergov-inverse.png';

export const BETTERGOV_LOGO_ALT = 'BetterGov.ph';
