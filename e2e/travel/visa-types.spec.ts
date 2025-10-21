import { expect, test } from '@playwright/test';

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

  await expect(page.getByPlaceholder('Search visa types...')).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Visa Categories' })
  ).toBeVisible();

  const categoryButtons = page.getByRole('button', { name: /Visas$/ });
  expect(await categoryButtons.count()).toBeGreaterThan(0);
  await expect(categoryButtons.first()).toBeVisible();

  const visaLinks = page.getByRole('link', { name: /Visa/ });
  expect(await visaLinks.count()).toBeGreaterThan(0);
  await expect(visaLinks.first()).toBeVisible();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Important Notice' })
  ).toBeVisible();
});

test('should render visa detail layout structure', async ({ page }) => {
  await page.goto('/travel/visa-types');

  const visaLinks = page.getByRole('link', { name: /Visa/ });
  const firstVisaLink = visaLinks.first();
  const targetHref = await firstVisaLink.getAttribute('href');

  expect(targetHref).toBeTruthy();

  await firstVisaLink.click();
  await page.waitForURL(`**${targetHref}`);

  await expect(
    page.getByRole('heading', { name: 'Philippines Visa Types' })
  ).toBeVisible();

  await expect(page.getByPlaceholder('Search visa types...')).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Back to Visa Types' })
  ).toBeVisible();

  const detailHeading = page.getByRole('heading', { level: 2 }).first();
  await expect(detailHeading).toBeVisible();
  await expect(detailHeading).not.toHaveText('');

  const minimumRequirementsHeading = page.getByRole('heading', {
    level: 3,
    name: 'Minimum Requirements',
  });
  await expect(minimumRequirementsHeading).toBeVisible();
  const minimumRequirementsItems = minimumRequirementsHeading.locator(
    'xpath=following-sibling::div[1]//li'
  );
  expect(await minimumRequirementsItems.count()).toBeGreaterThan(0);
  await expect(minimumRequirementsItems.first()).toBeVisible();

  const stepsHeading = page.getByRole('heading', { level: 3, name: 'Steps' });
  if ((await stepsHeading.count()) > 0) {
    await expect(stepsHeading.first()).toBeVisible();
    const firstStepTrigger = page
      .getByRole('button', { name: /^(Step\s+\d+|\d+\.)/i })
      .first();
    await firstStepTrigger.click();
    const openStepContent = page.locator('[data-state="open"]').first();
    await expect(openStepContent).toBeVisible();
    const openStepItems = openStepContent.locator('li, p');
    expect(await openStepItems.count()).toBeGreaterThan(0);
    await expect(openStepItems.first()).toBeVisible();
  }

  const subtypesHeading = page.getByRole('heading', {
    level: 3,
    name: 'Visa Subtypes',
  });
  if ((await subtypesHeading.count()) > 0) {
    await expect(subtypesHeading.first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 4 }).first()).toBeVisible();
  }

  await expect(
    page.getByRole('heading', { level: 3, name: 'Important Notice' })
  ).toBeVisible();
});

test('should render 13G visa detail directly', async ({ page }) => {
  await page.goto('/travel/visa-types/13g');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const primaryHeading13G = page.getByRole('heading', { level: 2 }).first();
  await expect(primaryHeading13G).toBeVisible();
  await expect(primaryHeading13G).not.toHaveText('');

  const minimumRequirementsHeading13G = page.getByRole('heading', {
    level: 3,
    name: 'Minimum Requirements',
  });
  await expect(minimumRequirementsHeading13G).toBeVisible();
  const minimumRequirementsItems13G = minimumRequirementsHeading13G.locator(
    'xpath=following-sibling::div[1]//li'
  );
  expect(await minimumRequirementsItems13G.count()).toBeGreaterThan(0);
  await expect(minimumRequirementsItems13G.first()).toBeVisible();

  const stepsHeading = page.getByRole('heading', { level: 3, name: 'Steps' });
  await expect(stepsHeading.first()).toBeVisible();
  await page
    .getByRole('button', { name: /^(Step\s+\d+|\d+\.)/i })
    .first()
    .click();
  const openStepContent13G = page.locator('[data-state="open"]').first();
  await expect(openStepContent13G).toBeVisible();
  const openStepItems13G = openStepContent13G.locator('li, p');
  expect(await openStepItems13G.count()).toBeGreaterThan(0);
  await expect(openStepItems13G.first()).toBeVisible();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Important Notice' })
  ).toBeVisible();
});

test('should render 13A visa detail directly', async ({ page }) => {
  await page.goto('/travel/visa-types/13a');

  await expect(
    page.getByRole('heading', { name: 'Philippines Visa Types' })
  ).toBeVisible();

  const primaryHeading13A = page.getByRole('heading', { level: 2 }).first();
  await expect(primaryHeading13A).toBeVisible();
  await expect(primaryHeading13A).not.toHaveText('');

  const minimumRequirementsHeading13A = page.getByRole('heading', {
    level: 3,
    name: 'Minimum Requirements',
  });
  await expect(minimumRequirementsHeading13A).toBeVisible();
  const minimumRequirementsItems13A = minimumRequirementsHeading13A.locator(
    'xpath=following-sibling::div[1]//li'
  );
  expect(await minimumRequirementsItems13A.count()).toBeGreaterThan(0);
  await expect(minimumRequirementsItems13A.first()).toBeVisible();

  const stepsHeading = page.getByRole('heading', { level: 3, name: 'Steps' });
  await expect(stepsHeading.first()).toBeVisible();
  await page
    .getByRole('button', { name: /^(Step\s+\d+|\d+\.)/i })
    .first()
    .click();
  const openStepContent13A = page.locator('[data-state="open"]').first();
  await expect(openStepContent13A).toBeVisible();
  const openStepItems13A = openStepContent13A.locator('li, p');
  expect(await openStepItems13A.count()).toBeGreaterThan(0);
  await expect(openStepItems13A.first()).toBeVisible();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Important Notice' })
  ).toBeVisible();
});
