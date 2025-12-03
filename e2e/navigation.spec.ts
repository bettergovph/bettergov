import { test, expect } from '@playwright/test';
import { mobileCheck } from './utils/device';
import { navigate } from './utils/navbar';

test.describe('Navigation', () => {
  test('should navigate through main sections', async ({ page }) => {
    const isMobile = await mobileCheck();
    await page.goto('/');

    // Test Philippines dropdown menu
    if (isMobile) {
      await navigate(page, 'Philippines');
      await expect(
        page.getByRole('link', { name: 'About the Philippines' })
      ).toBeVisible();
      // Navigate to About Philippines
      await navigate(page, null, 'About the Philippines', false);
    } else {
      // For desktop, navigate directly to the submenu item
      await navigate(page, 'Philippines', 'About the Philippines');
    }

    expect(page.url()).toContain('/philippines/about');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'About the Philippines'
    );

    // Navigate to Government and then Travel section
    if (isMobile) {
      await navigate(page, 'Government', 'Executive');
      expect(page.url()).toContain(
        '/government/executive/office-of-the-president'
      );
      await navigate(page, 'Travel', 'Visa Information');
      expect(page.url()).toContain('/travel/visa');
    } else {
      await page.getByRole('link', { name: 'Government' }).first().click();
      expect(page.url()).toContain('/government');

      await page.getByRole('link', { name: 'Travel' }).first().click();
      expect(page.url()).toContain('/travel');
    }
  });

  test('should navigate to Join Us page', async ({ page }) => {
    await page.goto('/');

    // Click Join Us link
    await page
      .getByRole('link', { name: /Join Us/i })
      .first()
      .click();
    expect(page.url()).toContain('/join-us');
    await expect(page.getByRole('heading').first()).toContainText(
      'Join the #CivicTech Revolution'
    );
  });

  test('should navigate to Ideas page', async ({ page }) => {
    await page.goto('/');

    // Click Project Ideas link
    await page.getByRole('link', { name: 'Project Ideas' }).first().click();
    expect(page.url()).toContain('/ideas');
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
    expect(page.url()).toContain('/about');

    // Go back to homepage
    await page.goto('/');
    await page.locator('footer').scrollIntoViewIfNeeded();

    // Test Sitemap link
    const sitemapLink = page
      .locator('footer')
      .getByRole('link', { name: 'Sitemap' });
    await expect(sitemapLink).toBeVisible();
    await sitemapLink.click();
    expect(page.url()).toContain('/sitemap');
  });

  test('branch navigation should work', async ({ page }) => {
    // Navigate to a deep page
    await page.goto('/government/departments');

    // Check if branch exists
    let branch = page
      .getByRole('link', { name: 'Executive Departments' })
      .first(); // Selected branch
    await expect(branch).toContainClass('bg-primary-500');

    const grid = page.locator('div.inline-grid');
    await grid
      .getByRole('link', { name: 'Local Government Units' })
      .first()
      .click();

    branch = page.getByRole('link', { name: 'Local Government Units' }).first();
    await expect(branch).toContainClass('bg-primary-500');
    expect(page.url()).toContain('/government/local');
  });
});
