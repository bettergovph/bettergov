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

/**
 * The national branding campaign mark, shown in the footer.
 *
 * Its "BAGONG PILIPINAS" wordmark is a dark blue that sits at about 1.6:1
 * against the navy footer, so it is always rendered on a white plate rather
 * than directly on the background.
 */
export const BAGONG_PILIPINAS_SRC = '/logos/png/bagong-pilipinas.png';

export const BAGONG_PILIPINAS_ALT = 'Bagong Pilipinas';
