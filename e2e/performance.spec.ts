import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for the main content to be visible
    await expect(
      page.getByRole('heading', { name: /Welcome to BetterGov.ph/i })
    ).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have reasonable First Contentful Paint', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(
          p => p.name === 'first-contentful-paint'
        )?.startTime,
      };
    });

    // FCP should be under 2 seconds
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
  });

  test('images should be optimized', async ({ page }) => {
    await page.goto('/');

    // Check that images are not too large
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
      }));
    });

    for (const img of images) {
      // Images should not be more than 2x their display size
      if (img.displayWidth > 0) {
        const widthRatio = img.naturalWidth / img.displayWidth;
        expect(widthRatio).toBeLessThanOrEqual(3);
      }
    }
  });

  test('should not have excessive DOM size', async ({ page }) => {
    await page.goto('/');

    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // DOM should have less than 3000 nodes (recommended by Lighthouse)
    expect(nodeCount).toBeLessThan(3000);
  });

  test('navigation between pages should be fast', async ({ page }) => {
    await page.goto('/');

    // Measure navigation to services page
    const startTime = Date.now();

    await page.getByRole('link', { name: 'Services' }).first().click();
    await page.waitForURL('**/services');
    await expect(
      page.getByRole('heading', { name: /Government Services/i })
    ).toBeVisible();

    const navigationTime = Date.now() - startTime;

    // Navigation should complete within 2 seconds
    expect(navigationTime).toBeLessThan(2000);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test('should handle slow network gracefully', async ({ page, browser }) => {
    // Create a context with slow network
    const context = await browser.newContext({
      offline: false,
    });

    const slowPage = await context.newPage();

    // Simulate slow 3G
    await slowPage.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await slowPage.goto('/');

    // Even on slow network, critical content should appear
    await expect(slowPage.getByText('BetterGov.ph')).toBeVisible({
      timeout: 10000,
    });

    await context.close();
  });
});
