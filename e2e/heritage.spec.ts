import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// HERITAGE_BUILT=1 exercises the output of `npm run build` through Playwright's
// request routing, without starting another server on the shared VM.
const built = process.env.HERITAGE_BUILT === '1';
test.beforeEach(async ({ page }) => {
  if (!built) return;
  const directory = resolve('dist');
  expect(
    existsSync(resolve(directory, 'index.html')),
    'Run npm run build first'
  ).toBeTruthy();
  await page.route('http://127.0.0.1:5125/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const file = resolve(
      directory,
      `.${pathname.startsWith('/philippines/') ? '/index.html' : pathname}`
    );
    if (file.startsWith(`${directory}/`) && existsSync(file)) {
      await route.fulfill({ path: file });
    } else {
      await route.continue();
    }
  });
});

test.describe('Culture and history', () => {
  test('loads local photographs and page-specific metadata', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['culture', 'history']) {
      await page.goto(`/philippines/${route}`);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page).toHaveTitle(new RegExp(`${route}.*Philippines`, 'i'));
      // react-helmet-async 2 loses tags under development StrictMode. Check
      // the actual production tags in the built run, including after routing.
      if (built) {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          `https://bettergov.ph/philippines/${route}`
        );
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
          'content',
          /\/og-image\.png$/
        );
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          'content',
          /Philippine/
        );
      }
      const images = page.locator('main img');
      await expect(images).toHaveCount(route === 'culture' ? 3 : 1);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('alt', /\S+/);
        await expect
          .poll(() =>
            image.evaluate(
              element => (element as HTMLImageElement).naturalWidth
            )
          )
          .toBeGreaterThan(0);
        await expect(image).toHaveAttribute('src', /^\/assets\/heritage\//);
      }
    }
    expect(errors).toEqual([]);
  });

  test('era navigation and incoming event links reach their destinations', async ({
    page,
  }) => {
    await page.goto('/philippines/history');
    const link = page
      .getByRole('navigation', { name: 'Historical eras' })
      .getByRole('link', { name: /An independent republic/ });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#independent-republic$/);
    await expect
      .poll(() =>
        page
          .locator('#independent-republic')
          .evaluate(element => Math.abs(element.getBoundingClientRect().top))
      )
      .toBeLessThan(150);

    await page.goto('/philippines/history#martial-law');
    const entry = page.getByRole('article', {
      name: 'Declaration of martial law',
    });
    await expect
      .poll(() =>
        entry.evaluate(element => Math.abs(element.getBoundingClientRect().top))
      )
      .toBeLessThan(150);
    await expect(entry).toContainText('1972–1981');
    await expect(entry).toContainText('17 January 1981');
    await expect(
      entry.getByRole('link', { name: /Proclamation No. 2045/ })
    ).toHaveAttribute('href', /proc_2045_1981/);
    await expect(
      entry.getByRole('link', { name: /Republic Act No. 10368/ })
    ).toHaveAttribute('href', /elibrary.judiciary.gov.ph/);
  });

  test('culture chapters and the history cross-link work from the keyboard', async ({
    page,
  }) => {
    await page.goto('/philippines/culture');
    const link = page
      .getByRole('navigation', { name: 'Culture chapters' })
      .getByRole('link', { name: /Living arts/ });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#living-arts$/);
    await expect(
      page.getByRole('heading', {
        name: 'Knowledge, passed from hand to hand.',
      })
    ).toBeVisible();
    const next = page
      .locator('main')
      .getByRole('link', { name: /The stories behind the present/ });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/philippines\/history$/);
    await expect(page.locator('main article')).toHaveCount(17);
  });

  test('history keeps complete timeline content with a fallback language', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'fil'));
    await page.goto('/philippines/history');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Kasaysayan ng Pilipinas' })
    ).toBeVisible();
    await expect(page.locator('main article')).toHaveCount(17);
    await expect(page.locator('#martial-law')).toContainText('17 January 1981');
    await expect(page.locator('.heritage-timeline')).toHaveAttribute(
      'lang',
      'en'
    );
  });

  test('pages reflow on narrow screens and pass accessibility checks', async ({
    page,
  }) => {
    for (const route of ['culture', 'history']) {
      await page.goto(`/philippines/${route}`);
      await page.locator('main h1').waitFor();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, route).toEqual([]);
      for (const width of [320, 720]) {
        await page.setViewportSize({ width, height: 900 });
        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll, `${route} at ${width}px`).toBeLessThanOrEqual(
          dimensions.width
        );
      }
    }
  });
});
