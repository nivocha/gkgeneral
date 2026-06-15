# Testing Setup — GK General Supply

## Framework

- **Unit/Integration**: Vitest + Testing Library
- **E2E**: Playwright

## Installed Dependencies

```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @vitejs/plugin-react \
  jsdom \
  @playwright/test
```

All except `@playwright/test` are already in `package.json`. Install Playwright:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

## Running Tests

```bash
# Unit tests (single run)
npm test

# Unit tests (watch mode)
npm run test:watch

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with Playwright UI
npm run test:e2e:ui
```

## Test Structure

```
src/
  __tests__/
    setup.ts                    # Global test setup
    lib/
      utils.test.ts             # Utility function tests
    features/
      carts/
        store.test.ts           # Zustand cart store tests
      orders/
        actions.test.ts         # Order action tests
e2e/
  auth.spec.ts                  # Playwright auth E2E tests
vitest.config.ts                # Vitest configuration
playwright.config.ts            # Playwright configuration
```

## CI Integration

Tests run automatically on every push/PR via GitHub Actions (`.github/workflows/ci.yml`). Vitest runs with the PostgreSQL service container for database-dependent tests.
