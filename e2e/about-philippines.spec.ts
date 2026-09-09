import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('About the Philippines', () => {
  test('uses sourced facts and real national-symbol images', async ({
    page,
  }) => {
    await page.goto('/philippines/about');

    await expect(
      page.getByText('Community redesign — not an official government website.')
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 1, name: 'About the Philippines' })
    ).toBeVisible();
    await expect(page.getByText('112.7M', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Facts last verified 8 September 2026')
    ).toBeVisible();

    const symbolImages = page.locator('main figure img');
    await expect(symbolImages).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) {
      const image = symbolImages.nth(index);
      await expect(image).toHaveAttribute('alt', /\S+/);
      await expect(image).toHaveAttribute(
        'src',
        /^\/(assets\/philippines\/|coat-of-arms\.svg)/
      );
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(element => (element as HTMLImageElement).naturalWidth)
        )
        .toBeGreaterThan(0);
    }
  });

  test('links to a separate government overview page', async ({ page }) => {
    await page.goto('/philippines/about');

    await expect(
      page.getByRole('heading', { name: 'Government at a glance' })
    ).toHaveCount(0);
    await page
      .locator('main')
      .getByRole('link', { name: /Government Understand the three branches/ })
      .click();

    await expect(page).toHaveURL(/\/government\/overview$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Government at a glance' })
    ).toBeVisible();
    await expect(page.getByText('42,010', { exact: true })).toBeVisible();
  });

  test('the government cross-link works from the keyboard', async ({
    page,
  }) => {
    await page.goto('/philippines/about');

    const governmentLink = page
      .locator('main')
      .getByRole('link', { name: /Government Understand the three branches/ });
    await governmentLink.focus();
    await expect(governmentLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/government\/overview$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Government at a glance' })
    ).toBeVisible();
  });

  test('modified pages have no detectable accessibility violations', async ({
    page,
  }) => {
    for (const path of ['/philippines/about', '/government/overview']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, path).toEqual([]);
    }
  });

  test('modified pages reflow without page-level horizontal scrolling', async ({
    page,
  }) => {
    for (const width of [320, 720]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/philippines/about', '/government/overview']) {
        await page.goto(path);
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(
          dimensions.scrollWidth,
          `${path} at ${width}px`
        ).toBeLessThanOrEqual(dimensions.clientWidth);
      }
    }
  });
});
