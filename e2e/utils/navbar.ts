import { Page } from '@playwright/test';
import { mobileCheck } from './device';

/**
 * @param page Playwright page instance/object
 * @param option Navbar main option
 * @param subOption Navbar sub option
 * @param hamburger Hamburger behavior, true if you want to interact (default), else false
 */
export async function navigate(
  page: Page,
  option:
    | 'Philippines'
    | 'Services'
    | 'Travel'
    | 'Government'
    | 'Flood Control Projects'
    | null = null,
  subOption: string | null = null,
  hamburger: boolean = true
): Promise<void> {
  const isMobile = await mobileCheck();

  // For mobile
  if (isMobile) {
    if (hamburger) {
      await page
        .getByRole('button', { name: 'Open main menu' })
        .first()
        .click();
    }

    if (option) {
      await page.getByRole('button', { name: option }).first().click();
    }

    if (subOption) {
      await page.getByRole('link', { name: subOption }).first().click();
    }
    return;
  }

  // For desktop
  if (option) {
    const linkElement = page
      .getByRole('link', { name: option, exact: true })
      .first();

    // If we have a subOption, use a more direct approach
    if (subOption) {
      // Hover over the main link
      await linkElement.hover();

      // Wait for the menu item to be visible
      const menuItem = page.getByRole('menuitem', { name: subOption }).first();
      await menuItem.waitFor({ state: 'visible', timeout: 5000 });

      // Click the menu item
      await menuItem.click({ timeout: 10000 });
    } else {
      // Just hover if no subOption
      await linkElement.hover();
    }
  }
}
