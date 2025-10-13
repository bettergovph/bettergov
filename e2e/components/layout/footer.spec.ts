import { expect, test } from '@playwright/test';

test.describe('Footer component', () => {
  test('should render static footer layout', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    await expect(footer.getByText('Better Philippines')).toBeVisible();
    await expect(footer.getByText('BetterGov.ph Portal')).toBeVisible();

    const sectionHeadings = ['About', 'Services', 'Our Projects', 'Government'];
    for (const heading of sectionHeadings) {
      await expect(
        footer.getByRole('heading', { name: heading })
      ).toBeVisible();
    }

    await expect(
      footer.getByText('Cost to build this site to date:', { exact: false })
    ).toBeVisible();

    await expect(
      footer.getByRole('button', { name: 'Donate via BetterGov Merch' })
    ).toBeVisible();
  });

  test('should render dynamic footer content from data sources', async ({
    page,
  }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    await expect(footer.getByText('Ver. f10c51')).toBeVisible();

    await expect(footer.locator('h3:has-text("About") + ul li')).toHaveCount(6);
    await expect(footer.locator('h3:has-text("Services") + ul li')).toHaveCount(
      8
    );
    await expect(
      footer.locator('h3:has-text("Our Projects") + ul li')
    ).toHaveCount(8);
    await expect(
      footer.locator('h3:has-text("Government") + ul li')
    ).toHaveCount(5);
  });

  test('should open and close donate modal with content', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const donateButton = footer.getByRole('button', {
      name: 'Donate via BetterGov Merch',
    });
    await expect(donateButton).toBeVisible();

    await donateButton.click();

    const dialog = page.getByRole('dialog', {
      name: 'Support Our Monthly Server Costs',
    });
    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText(
        'Grab limited BetterGov merchandise and every purchase keeps our infrastructure running for Filipinos.'
      )
    ).toBeVisible();

    await expect(
      dialog.getByRole('img', { name: 'BetterGov merch preview' })
    ).toBeVisible();

    await expect(
      dialog.getByRole('link', { name: 'Fill out the order form' })
    ).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).not.toBeVisible();
  });
});
