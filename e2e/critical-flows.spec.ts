import { test, expect } from '@playwright/test';
import { mobileCheck } from './utils/device';

test.describe('Critical User Flows', () => {
  test('PhilSys National ID registration button should work', async ({
    page,
  }) => {
    await page.goto('/');

    // Find the PhilSys registration section
    const philSysSection = page
      .locator('section')
      .filter({ hasText: 'PhilSys National ID Registration' });
    await expect(philSysSection).toBeVisible();

    const link = philSysSection.getByRole('link').first();
    const registerButton = link
      .getByRole('button', {
        name: 'Register Now',
      })
      .first();

    await expect(registerButton).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://philsys.gov.ph/registration-process'
    );
  });

  test('search for government services', async ({ page }) => {
    await page.goto('/services');

    await expect(
      page.getByRole('heading', { name: 'Government Services', exact: true })
    ).toBeVisible();

    const searchBox = page.getByPlaceholder('Search for services...');

    await searchBox.fill('passport');
    await searchBox.press('Enter');

    const resultGrid = page.getByLabel('List of government services');
    await expect(
      resultGrid.getByRole('button', { name: 'Passport and Travel' }).first()
    ).toBeVisible();
  });

  test('language switcher should work', async ({ page }) => {
    const isMobile = await mobileCheck();
    await page.goto('/');

    if (isMobile) {
      await page.getByRole('button', { name: 'Open main menu' }).click();
    }

    // Find language switcher
    const languageSwitcher = page.getByRole('combobox').first();
    await expect(languageSwitcher).toBeVisible();

    // Click language switcher
    await languageSwitcher.click();
    await languageSwitcher.selectOption('fil');

    // Verify language changed (check for Filipino text)
    await expect(
      page.getByText('Maligayang Pagdating sa BetterGov.ph')
    ).toBeVisible();

    // Switch back to English
    await languageSwitcher.click();
    await languageSwitcher.selectOption('en');

    // Verify back to English
    await expect(page.getByText('Welcome to BetterGov.ph')).toBeVisible();
  });

  test('hotlines page should display emergency numbers', async ({ page }) => {
    await page.goto('/philippines/hotlines');

    // Check page loaded
    await expect(
      page.getByRole('heading', {
        name: 'Philippines Emergency Hotlines',
        exact: true,
      })
    ).toBeVisible();

    const hotlineGrid = page.locator('div.grid').first();
    const hotlineBox = hotlineGrid.locator('div.bg-white').first();
    const heading = hotlineBox.getByRole('heading', {
      name: 'National Emergency Hotline',
      exact: true,
    });
    const contact = hotlineBox.locator('div > div').first();

    // Check for critical hotline numbers
    await expect(heading).toBeVisible();
    await expect(contact.getByText('911')).toBeVisible();
  });

  test('government departments page should load', async ({ page }) => {
    await page.goto('/government/departments');

    // Check page loaded
    await expect(
      page.getByRole('heading', { name: 'The Philippine Government Directory' })
    ).toBeVisible();

    // Check for some department cards
    await expect(
      page
        .getByRole('heading', { name: 'Government Departments', exact: true })
        .first()
    ).toBeVisible();
  });

  test('weather page should display weather information', async ({ page }) => {
    await page.goto('/data/weather');

    // Check page loaded
    const weatherGrid = page
      .locator('div.grid.grid-cols-1.lg\\:grid-cols-3')
      .first();

    await expect(weatherGrid).toBeVisible();

    const locations = weatherGrid.locator('div.bg-white').first();
    const weatherInfo = weatherGrid.locator('div.lg\\:col-span-2').first();

    // Check for weather sections
    await expect(locations).toContainText(/Manila/i);
    await expect(weatherInfo).toContainText(/Manila/i);
  });

  test('flood control projects page should load', async ({ page }) => {
    await page.goto('/flood-control-projects');

    // Check page loaded
    await expect(
      page.getByRole('heading', { name: 'Flood Control Projects' }).first()
    ).toBeVisible();

    // Check for tabs
    await expect(
      page.getByRole('link', { name: 'Visual' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Table' }).first()
    ).toBeVisible();

    // Switch to map view
    await page.getByRole('link', { name: 'Map' }).first().click();

    // Check map container is visible
    await expect(
      page.locator('div.leaflet-container.leaflet-touch').first()
    ).toBeVisible();
  });
});
