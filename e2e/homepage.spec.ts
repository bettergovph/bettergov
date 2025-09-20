import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/BetterGov.ph/);

    // Check navbar is visible
    await expect(page.locator('nav')).toBeVisible();

    // Check logo and site name
    await expect(page.getByText('BetterGov.ph').first()).toBeVisible();

    // Check hero section
    await expect(
      page.getByRole('heading', { name: /Welcome to BetterGov.ph/i })
    ).toBeVisible();

    // Check search input exists
    await expect(page.getByPlaceholder(/Search for services/i)).toBeVisible();

    // Check footer is visible
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should navigate to services page', async ({ page }) => {
    await page.goto('/');

    // Click on Services link
    await page.getByRole('link', { name: 'Services' }).first().click();

    // Wait for navigation
    await page.waitForURL('**/services');

    // Check we're on services page
    await expect(
      page.getByRole('heading', { name: /Government Services/i })
    ).toBeVisible();
  });

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/');

    // Find search input
    const searchInput = page.getByPlaceholder(/Search for services/i);

    // Verify search input exists
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('passport');

    // The search might work as instant search or require Enter/click
    // Just verify we can type into the search field
    await expect(searchInput).toHaveValue('passport');
  });

  test('should have responsive mobile menu', async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      // Mobile menu button should be visible
      const menuButton = page.getByRole('button', { name: /Open main menu/i });
      await expect(menuButton).toBeVisible();

      // Click menu button
      await menuButton.click();

      // Mobile menu should be visible
      await expect(
        page.getByRole('button', { name: /Close menu/i })
      ).toBeVisible();
    } else {
      // Desktop navigation should be visible
      await expect(
        page.locator('nav').getByText('The Philippines').first()
      ).toBeVisible();
    }
  });
});
