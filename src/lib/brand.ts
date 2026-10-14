/**
 * Official branding for GOV.PH — the website of the Republic of the Philippines.
 *
 * The coat of arms lives in `public/`, so it is served from the site root and
 * needs no bundler import. Keep every logo reference pointed at these constants
 * so the asset can be swapped in one place.
 */
export const COAT_OF_ARMS_SRC = '/coat-of-arms.svg';

export const COAT_OF_ARMS_ALT =
  'Coat of Arms of the Republic of the Philippines';

/** Wordmark shown beside the coat of arms in the header and footer. */
export const SITE_NAME = 'GOV.PH';

/** Sub-label rendered under the wordmark. */
export const SITE_OWNER = 'Republic of the Philippines';

/** One-line description used in page titles and social cards. */
export const SITE_TAGLINE =
  'The Official Portal of the Republic of the Philippines';

/**
 * Canonical origin for absolute URLs (canonical links, Open Graph, sitemap,
 * llms.txt). Change it here if the production host differs.
 */
export const SITE_URL = 'https://www.gov.ph';

/** Social-card image, served from `public/`. */
export const DEFAULT_OG_IMAGE = '/og-image.png';

/** Source repository for this portal. */
export const REPO_URL = 'https://github.com/govph/govph-2026';
export const ISSUES_URL = `${REPO_URL}/issues`;
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new`;

/**
 * The national branding campaign mark, shown in the footer.
 *
 * This is the dark-background variant: the emblem is untouched, but the
 * "BAGONG PILIPINAS" wordmark is repainted white. In the original it is
 * #011d92, which lands at roughly 1.4:1 on the navy footer and disappears.
 * A light-background version can be regenerated from the Wikimedia Commons
 * original, which is public domain as a Philippine government work.
 */
export const BAGONG_PILIPINAS_SRC = '/logos/png/bagong-pilipinas-inverse.png';

export const BAGONG_PILIPINAS_ALT = 'Bagong Pilipinas';
