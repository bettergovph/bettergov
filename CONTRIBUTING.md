# Contributing Guidelines

Thank you for considering contributing to this project. Contributions of all kinds are welcome, whether it's fixing bugs, adding new features, improving documentation, or suggesting ideas.

---

## How to Contribute

1. **Fork the Repository**
   Create a personal copy of this repository by clicking the "Fork" button.

2. **Clone Your Fork**

   ```bash
    git clone https://github.com/YOUR-USERNAME/bettergov.git
    cd bettergov
   ```

3. **Create a Branch**
   Make a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   Implement your feature, fix, or documentation update.

5. **Commit Your Changes**
   Use clear, descriptive commit messages:

   ```bash
   git commit -m "Add: short description of the change"
   ```

6. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request (PR)**
   Open a PR against the main branch of the original repository.

---

## Commit Message Guidelines

```
# feat:      A new feature
# fix:       A bug fix
# remove:    Remove code
# refactor:  Improve code without changing external behavior
# style:     Changes that do not affect the meaning of the code
#            (white-space, formatting, missing semi-colons, etc.)
# test:      Adding and revising tests
# docs:      Documentation only changes
# chore:     Changes to auxiliary tools and libraries
#            such as documentation generation and dependency versions
# ci:        Changes to automated workflows like in GitHub Actions
# build:     Changes to the build process
# perf:      A code change that improves performance
# revert:    Revert commits
# merge:     Merge branches
```

---

## Code Style Guidelines

- Use consistent formatting and naming conventions.
- Write clear and maintainable code.
- Add comments where needed to explain logic.
- Keep changes focused and minimal.

---

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

---

## Documentation

- Update documentation when introducing changes.
- Keep examples clear and concise.

---

## Pull Request Guidelines

- Keep PRs small and focused.
- Ensure your branch is up to date with `main`/`master`.
- Provide a clear description of your changes.
- Reference related issues (e.g., `Fixes #123`).

---

## Community

- Be respectful and inclusive in all interactions.
- Use GitHub Issues for bug reports and feature requests.

---

## License

This project is released under the [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/) dedication. This means the work is dedicated to the public domain and can be freely used by anyone for any purpose without restriction under copyright law.

---
