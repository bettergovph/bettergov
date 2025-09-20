import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('PhilSys National ID registration button should work', async ({
    page,
  }) => {
    await page.goto('/');

    // Find the PhilSys registration section
    const philSysSection = page.locator(
      'text=PhilSys National ID Registration'
    );
    await expect(philSysSection).toBeVisible();

    // Find the Register Now button (it's wrapped in an anchor tag)
    const registerLink = page.locator('a[href*="philsys.gov.ph"]').first();

    // Check if the link exists
    const linkCount = await registerLink.count();
    if (linkCount > 0) {
      await expect(registerLink).toBeVisible();

      // Get the href attribute
      const href = await registerLink.getAttribute('href');
      expect(href).toContain('philsys.gov.ph');
    } else {
      // If no direct link, check for button
      const registerButton = page.getByRole('button', { name: 'Register Now' });
      await expect(registerButton).toBeVisible();
    }
  });

  test('search for government services', async ({ page }) => {
    await page.goto('/services');

    // Wait for services page to load
    await expect(
      page.getByRole('heading', { name: /Government Services/i })
    ).toBeVisible();

    // Find search input
    const searchBox = page.getByPlaceholder(/Search services/i);

    // Search for passport
    await searchBox.fill('passport');
    await searchBox.press('Enter');

    // Verify results contain passport-related services
    await expect(page.locator('text=/passport/i').first()).toBeVisible();
  });

  test('language switcher should work', async ({ page }) => {
    await page.goto('/');

    // Find language switcher
    const languageSwitcher = page.getByText('English').first();
    await expect(languageSwitcher).toBeVisible();

    // Click language switcher
    await languageSwitcher.click();

    // Select Filipino
    await page.getByText('Filipino').click();

    // Verify language changed (check for Filipino text)
    await expect(page.getByText('Tahanan')).toBeVisible();

    // Switch back to English
    await page.getByText('Filipino').first().click();
    await page.getByText('English').click();

    // Verify back to English
    await expect(page.getByText('Home')).toBeVisible();
  });

  test('hotlines page should display emergency numbers', async ({ page }) => {
    await page.goto('/philippines/hotlines');

    // Check page loaded
    await expect(
      page.getByRole('heading', { name: /Emergency Hotlines/i })
    ).toBeVisible();

    // Check for critical hotline numbers
    await expect(page.getByText('911')).toBeVisible();
    await expect(page.getByText('National Emergency')).toBeVisible();
  });

  test('government departments page should load', async ({ page }) => {
    await page.goto('/government/departments');

    // Check page loaded
    await expect(
      page.getByRole('heading', { name: /Executive Departments/i })
    ).toBeVisible();

    // Check for some department cards
    await expect(page.locator('text=/Department of/i').first()).toBeVisible();
  });

  test('weather page should display weather information', async ({ page }) => {
    await page.goto('/data/weather');

    // Check page loaded
    await expect(page.getByRole('heading', { name: /Weather/i })).toBeVisible();

    // Check for weather sections
    await expect(page.locator('text=/Current Weather/i')).toBeVisible();
  });

  test('flood control projects page should load', async ({ page }) => {
    await page.goto('/flood-control-projects');

    // Check page loaded
    await expect(
      page.getByRole('heading', { name: /Flood Control Projects/i })
    ).toBeVisible();

    // Check for tabs
    await expect(page.getByRole('tab', { name: /Table View/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Map View/i })).toBeVisible();

    // Switch to map view
    await page.getByRole('tab', { name: /Map View/i }).click();

    // Check map container is visible
    await expect(page.locator('#map')).toBeVisible();
  });
});
