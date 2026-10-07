import { SITE_NAME, SITE_TAGLINE } from './brand';

// helpers for interpolation

export function formatStandardTitle(subject: string): string {
  return `${subject} | ${SITE_NAME}`;
}

export function formatStandardDescription(subject: string): string {
  return `Learn more about ${subject} on ${SITE_NAME}, ${SITE_TAGLINE.replace(/^The /, 'the ')}.`;
}
