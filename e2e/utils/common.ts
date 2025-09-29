import { Locator, Page } from '@playwright/test';

/**
 * Hover over a locator element using mouse move event.
 *
 * @param {Page} page - The Playwright page object.
 * @param {Locator} locator - The locator to hover over.
 */
export const hover = async (page: Page, locator: Locator) => {
  await locator.scrollIntoViewIfNeeded();

  const locatorPosition = await locator.boundingBox();

  if (locatorPosition) {
    await page.mouse.move(
      locatorPosition.x + locatorPosition.width / 2,
      locatorPosition.y + locatorPosition.height / 2
    );
  } else {
    throw new Error(`Locator position not found`);
  }
};
