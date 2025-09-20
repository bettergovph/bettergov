# BetterGov.ph

A community-led initiative to create a better and more usable Philippine national government website.

## Why We're Building This Project

The current state of Philippine government websites, particularly the main portal [www.gov.ph](https://www.gov.ph), presents numerous challenges for citizens:

- The main Gov.ph website is outdated and has not been updated for a long time
- Full of broken links and difficult navigation paths
- Inconsistent formatting and design across pages
- Poor user experience and accessibility issues
- Similar problems exist across most Philippine government agency websites

These issues create barriers for citizens trying to access essential government services and information.

## Our Mission

We are a volunteer-led initiative with a clear mission: to provide a 'better' and 'usable' website for the Philippines.

Our goals include:

- Building a proper national website that reflects Filipino values and culture
- Creating intuitive navigation and search functionality
- Ensuring accessibility for all citizens, including those with disabilities
- Providing accurate, up-to-date information about government services
- Establishing a model for how government digital services can and should work

## Features

- Modern, responsive design that works on all devices
- Comprehensive directory of government services and agencies
- User-friendly navigation and search
- Accessibility features for users with disabilities
- Regular updates and maintenance

## Join Us as a Volunteer

We're always looking for passionate individuals to help improve BetterGov.ph. We need volunteers with various skills:

- Frontend and backend developers
- UX/UI designers
- Content writers and editors
- Translators (for Filipino and other local languages)
- Accessibility experts
- Project managers
- QA testers

If you're interested in contributing, please reach out to us at [volunteers@bettergov.ph](mailto:volunteers@bettergov.ph) or open an issue in this repository.

## Report a Bug

Found a problem with the website? Help us improve by reporting it!

1. Open an issue in this repository
2. Use the bug report template
3. Provide as much detail as possible, including:
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Screenshots, if applicable

Alternatively, email us at [bugs@bettergov.ph](mailto:bugs@bettergov.ph)

## Setup

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run the development server

```bash
# Clone the repository
git clone https://github.com/bettergovph/bettergov.git
cd bettergov

# Install dependencies
npm install

# Set environment variables (example)
# cp .env.example .env
# then edit .env as needed

# Start the development server
npm run dev
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed browser
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

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

## License

This project is released under the [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/) dedication. This means the work is dedicated to the public domain and can be freely used by anyone for any purpose without restriction under copyright law.

---
