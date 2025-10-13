import { expect, test } from '@playwright/test';

test.describe('Philippine visa types', () => {
  test('should render visa types landing structure', async ({ page }) => {
    await page.goto('/travel/visa-types');

    await expect(
      page.getByRole('heading', { name: 'Philippines Visa Types' })
    ).toBeVisible();

    await expect(
      page.getByText(
        'Explore different types of visas available for travel to the Philippines'
      )
    ).toBeVisible();

    const searchInput = page.getByPlaceholder('Search visa types...');
    await expect(searchInput).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Visa Categories' })
    ).toBeVisible();

    const categoryButtons = page.locator('nav button:visible');
    expect(await categoryButtons.count()).toBeGreaterThan(0);
    await expect(categoryButtons.first()).toBeVisible();

    const visaCards = page.locator('a[href^="/travel/visa-types/"]:visible');
    expect(await visaCards.count()).toBeGreaterThan(0);
    await expect(visaCards.first()).toBeVisible();

    await expect(page.getByText('Important Notice')).toBeVisible();
  });

  test('should render visa detail layout structure', async ({ page }) => {
    await page.goto('/travel/visa-types');

    const firstVisaLink = page
      .locator('a[href^="/travel/visa-types/"]:visible')
      .first();
    const targetHref = await firstVisaLink.getAttribute('href');
    expect(targetHref).not.toBeNull();

    await firstVisaLink.click();

    await page.waitForURL(`**${targetHref}`);

    await expect(
      page.getByRole('heading', { name: 'Philippines Visa Types' })
    ).toBeVisible();

    await expect(page.getByPlaceholder('Search visa types...')).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Back to Visa Types' })
    ).toBeVisible();

    await expect(page.locator('h2.text-2xl')).toBeVisible();
    await expect(page.locator('p.text-lg')).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Minimum Requirements' })
    ).toBeVisible();

    await expect(page.locator('ul.list-disc li').first()).toBeVisible();

    const stepsHeading = page.locator('h3:has-text("Steps")');
    if ((await stepsHeading.count()) > 0) {
      const stepsCards = stepsHeading.locator(
        'xpath=following-sibling::div//div[contains(@class, "bg-gray-50")]'
      );
      await expect(stepsCards.first()).toBeVisible();
    }

    const subtypesHeading = page.locator('h3:has-text("Visa Subtypes")');
    if ((await subtypesHeading.count()) > 0) {
      const subtypeCards = subtypesHeading.locator(
        'xpath=following-sibling::div//div[contains(@class, "bg-gray-50")]'
      );
      await expect(subtypeCards.first()).toBeVisible();
    }

    await expect(page.getByText('Important Notice')).toBeVisible();
  });
});
