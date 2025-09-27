import { test } from '@playwright/test';

/**
 * @return true if the current Playwright project is a mobile project.
 */
export async function mobileCheck(): Promise<boolean> {
  // TODO: Make a better code for this, so far only two
  // mobile projects exist, Mobile Chrome and Safari
  return test.info().project.name.includes('Mobile');
}
