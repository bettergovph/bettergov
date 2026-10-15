import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ACCESSIBILITY_SAMPLE } from '../src/data/accessibility';

async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Measure final colours, not a partially transparent entrance animation.
  // Do not disable animation: reduced-motion behaviour is checked separately.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter(
          animation =>
            animation.effect?.getComputedTiming().iterations !== Infinity
        )
        .map(animation => animation.finished.catch(() => undefined))
    );
  });
}

test.describe('Accessibility audit', () => {
  for (const sample of ACCESSIBILITY_SAMPLE) {
    test(`axe: ${sample.label} (${sample.path})`, async ({
      page,
    }, testInfo) => {
      const unavailable: string[] = [];
      page.on('requestfailed', request =>
        unavailable.push(
          `${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`
        )
      );
      page.on('response', response => {
        if (response.status() >= 400)
          unavailable.push(
            `${response.status()} ${new URL(response.url()).pathname}`
          );
      });
      await openPage(page, sample.path);
      // Run all default-enabled rules, including best-practice checks.
      // No rules, nodes, or known failures are excluded from this audit.
      const results = await new AxeBuilder({ page }).analyze();
      await testInfo.attach('axe-results', {
        body: JSON.stringify(
          {
            path: sample.path,
            viewport: page.viewportSize(),
            unavailable,
            ...results,
          },
          null,
          2
        ),
        contentType: 'application/json',
      });
      expect(
        results.violations.map(violation => ({
          rule: violation.id,
          impact: violation.impact,
          help: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            reason: node.failureSummary,
          })),
        }))
      ).toEqual([]);
    });

    test(`page identification, image markup, and search names: ${sample.label}`, async ({
      page,
    }) => {
      await openPage(page, sample.path);
      await expect(page).toHaveTitle(new RegExp(sample.title));
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      const images = page.locator('img');
      expect(await images.count()).toBeGreaterThan(0);
      for (const image of await images.all()) {
        // Empty alt is valid for decorative images; quality needs human review.
        await expect(image).toHaveAttribute('alt', /.*/);
      }
      const searchFields = page.locator('input:visible');
      for (const field of await searchFields.all()) {
        await expect(field).toHaveAccessibleName(/\S+/);
      }
    });
  }

  test('sampled pages fit 320 and 720 CSS-pixel widths', async ({ page }) => {
    for (const width of [320, 720]) {
      await page.setViewportSize({ width, height: 900 });
      for (const sample of ACCESSIBILITY_SAMPLE) {
        await openPage(page, sample.path);
        const dimensions = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(
          dimensions.scrollWidth,
          `${sample.path} at ${width}px`
        ).toBeLessThanOrEqual(dimensions.width);
      }
    }
  });

  test('keyboard users can skip the repeated navigation', async ({ page }) => {
    await openPage(page, '/home');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    const main = page.getByRole('main');
    await expect(main).toBeFocused();
    await page.keyboard.press('Tab');
    expect(
      await main.evaluate(element => element.contains(document.activeElement))
    ).toBe(true);
  });

  test('services search has a visible keyboard focus indicator', async ({
    page,
  }) => {
    await openPage(page, '/services');
    const input = page.getByRole('textbox', {
      name: 'Search government services',
    });
    // Reach this input by Tab, instead of treating an element ID as evidence.
    for (let index = 0; index < 40; index++) {
      await page.keyboard.press('Tab');
      if (await input.evaluate(element => element === document.activeElement))
        break;
    }
    await expect(input).toBeFocused();
    const indicator = await input.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        outline:
          style.outlineStyle !== 'none' &&
          parseFloat(style.outlineWidth) > 0 &&
          style.outlineColor !== 'transparent',
        shadow: style.boxShadow !== 'none',
      };
    });
    expect(
      indicator.outline || indicator.shadow,
      'Visible outline or focus ring on the search field'
    ).toBe(true);
  });

  test('mobile navigation closes with Escape and returns focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/home');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('home entrance animations respect reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page, '/home');
    const animations = page.locator('.animate-fade-in, .animate-slide-in');
    expect(await animations.count()).toBeGreaterThan(0);
    const active = await animations.evaluateAll(elements =>
      elements
        .map(element => {
          const style = getComputedStyle(element);
          return {
            animation: style.animationName,
            duration: style.animationDuration,
          };
        })
        .filter(
          style =>
            style.animation !== 'none' &&
            style.duration
              .split(',')
              .some(duration => parseFloat(duration) > 0.01)
        )
    );
    expect(
      active,
      'Nonessential entrance animations should be removed or effectively instant'
    ).toEqual([]);
  });

  test('checklist sections are reachable with a keyboard', async ({ page }) => {
    await openPage(page, '/accessibility');
    const navigation = page.getByRole('navigation', {
      name: 'Accessibility checklist sections',
    });
    const link = navigation.getByRole('link', {
      name: 'Needs improvement',
      exact: true,
    });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/accessibility#improve$/);
    await expect(
      page.getByRole('heading', { name: 'What we need to improve' })
    ).toBeInViewport();
  });
});
