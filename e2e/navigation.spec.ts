import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/');

    // Test Philippines dropdown menu
    await page.getByText('The Philippines').first().hover();
    await expect(
      page.getByRole('menuitem', { name: 'About the Philippines' })
    ).toBeVisible();

    // Navigate to About Philippines
    await page.getByRole('menuitem', { name: 'About the Philippines' }).click();
    await expect(page.url()).toContain('/philippines/about');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'About the Philippines'
    );

    // Navigate to Government section
    await page.getByRole('link', { name: 'Government' }).first().click();
    await expect(page.url()).toContain('/government');

    // Navigate to Travel section
    await page.getByRole('link', { name: 'Travel' }).first().click();
    await expect(page.url()).toContain('/travel');
  });

  test('should navigate to Join Us page', async ({ page }) => {
    await page.goto('/');

    // Click Join Us link
    await page
      .getByRole('link', { name: /Join Us/i })
      .first()
      .click();
    await expect(page.url()).toContain('/join-us');
    await expect(page.getByRole('heading')).toContainText('Join');
  });

  test('should navigate to Ideas page', async ({ page }) => {
    await page.goto('/');

    // Click Project Ideas link
    await page.getByRole('link', { name: 'Project Ideas' }).first().click();
    await expect(page.url()).toContain('/ideas');
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();

    // Test About link
    const aboutLink = page
      .locator('footer')
      .getByRole('link', { name: 'About' });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page.url()).toContain('/about');

    // Go back to homepage
    await page.goto('/');
    await page.locator('footer').scrollIntoViewIfNeeded();

    // Test Sitemap link
    const sitemapLink = page
      .locator('footer')
      .getByRole('link', { name: 'Sitemap' });
    await expect(sitemapLink).toBeVisible();
    await sitemapLink.click();
    await expect(page.url()).toContain('/sitemap');
  });

  test('breadcrumb navigation should work', async ({ page }) => {
    // Navigate to a deep page
    await page.goto('/government/departments');

    // Check breadcrumb exists
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Click Home breadcrumb
    await breadcrumb.getByRole('link', { name: 'Home' }).click();
    await expect(page.url()).toBe('http://localhost:5173/');
  });
});
