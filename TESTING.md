## Testing

### End-to-End Testing

This project uses Playwright for end-to-end testing to ensure critical user flows work correctly across different browsers and devices.

#### Running E2E Tests

- `npm run test:e2e` - Run all E2E tests headlessly
- `npm run test:e2e:ui` - Open Playwright UI to run and debug tests interactively
- `npm run test:e2e:headed` - Run tests with visible browser windows
- `npm run test:e2e:debug` - Debug tests with Playwright Inspector
- `npm run test:e2e:codegen` - Record new tests using Playwright's code generator

#### E2E Test Coverage

Our E2E tests cover:

1. **Critical User Flows**
   - Homepage loading and navigation
   - PhilSys National ID registration
   - Government services search
   - Language switching
   - Emergency hotlines access

2. **Navigation**
   - Main menu navigation
   - Dropdown menus
   - Footer links
   - Breadcrumb navigation

3. **Accessibility**
   - WCAG compliance checks using axe-core
   - Keyboard navigation
   - ARIA labels and alt text
   - Focus indicators

4. **Performance**
   - Page load times
   - First Contentful Paint metrics
   - DOM size optimization
   - Image optimization
   - Slow network handling

#### Writing E2E Tests

E2E tests are located in the `e2e/` directory. Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test('user can search for services', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder(/Search for services/i).fill('passport');
  await page.getByPlaceholder(/Search for services/i).press('Enter');
  await expect(page).toHaveURL('/search');
  await expect(page.locator('text=/passport/i')).toBeVisible();
});
```
