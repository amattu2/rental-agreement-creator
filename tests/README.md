# End-to-End Testing with Playwright

This directory contains comprehensive E2E tests for the Rental Agreement Creator application using Playwright.

## Overview

The test suite covers all major user workflows:

- **Customers**: Create, read, update, search customer profiles
- **Vehicles**: Create, read, update, search vehicle inventory
- **Agreements**: Create, edit, search rental agreements with lifecycle management (finalize, cancel)

### Key Features

✅ **Data-Agnostic Design**: Tests work with clean builds, DEV, QA, or production environments  
✅ **Unique Test Identifiers**: Each test run uses timestamp-based unique IDs to avoid data collisions  
✅ **Page Object Model**: Encapsulated page classes for maintainability  
✅ **Comprehensive Coverage**: 20+ tests covering CRUD, validation, and workflows  
✅ **Smoke Tests**: @smoke tagged tests for quick pre-commit validation  
✅ **Rich Reporting**: HTML reports, screenshots, videos on failure

## Quick Start

### Run All Tests

```bash
npm run test:e2e
```

### Run Smoke Tests (Quick)

```bash
npm run test:e2e:smoke
```

### Debug Tests Interactively

```bash
npm run test:e2e:debug
# Opens Playwright Inspector UI for step-by-step debugging
```

### View Last Test Report

```bash
npm run test:e2e:report
```

## Test Structure

```
tests/
├── pages/                    # Page Object Model classes
│   ├── base.page.ts         # Base class with common actions
│   ├── agreements.page.ts   # Agreements list & form interactions
│   ├── customers.page.ts    # Customers CRUD operations
│   └── vehicles.page.ts     # Vehicles CRUD operations
├── e2e/
│   ├── agreements/          # Agreement workflow tests
│   ├── customers/           # Customer CRUD tests
│   ├── vehicles/            # Vehicle CRUD tests
│   └── workflows/           # End-to-end lifecycle tests
├── fixtures.ts              # Custom test fixtures with test data
├── test-data.ts             # Test constants with unique identifiers
└── README.md                # This file
```

## How Tests Avoid Data Collisions

Each test run generates a **unique timestamp-based identifier**:

```typescript
// tests/test-data.ts
const TEST_RUN_ID = Date.now().toString(36); // e.g., "2pz8b1a"

export const TEST_CUSTOMERS = [
  {
    full_name: `TEST-CUSTOMER-${TEST_RUN_ID}-1`, // "TEST-CUSTOMER-2pz8b1a-1"
    cell_phone: "555-0101",
    email: `test-${TEST_RUN_ID}-1@test.com`, // "test-2pz8b1a-1@test.com"
  },
  // ... more customers
];
```

**Why this matters:**

- Tests work identically on fresh builds (0 records), DEV, QA, or production
- Each run gets unique customer names like "TEST-CUSTOMER-2pz8b1a-1"
- Tests search for their unique data, not affected by existing records
- No manual data cleanup needed (test data remains but never interferes)

## Selector Strategy (Priority Order)

Tests use resilient selectors following Playwright best practices:

1. **`getByRole()`** - Accessibility tree (preferred)

   ```typescript
   page.getByRole("button", { name: "Create" });
   page.getByRole("textbox", { name: "Email" });
   ```

2. **`getByLabel()`** - Form labels

   ```typescript
   page.getByLabel("Customer Name");
   ```

3. **`getByText()`** - Visible text

   ```typescript
   page.getByText("Active");
   ```

4. **`getByTestId()`** - data-testid attribute (fallback)

   ```typescript
   page.getByTestId("customer-row-123");
   ```

5. **CSS/XPath** - Last resort only (fragile, avoid if possible)

## Page Object Model Pattern

Each page class encapsulates selectors and workflows:

```typescript
export class CustomersPage extends BasePage {
  readonly searchInput: Locator;
  readonly createButton: Locator;

  async goto(): Promise<void> {
    /* ... */
  }
  async createCustomer(data): Promise<void> {
    /* ... */
  }
  async expectCustomerExists(name): Promise<void> {
    /* ... */
  }
}
```

**Benefits:**

- Selector changes update in one place
- Tests are readable (semantic actions, not selectors)
- Easy to add new workflows

## Writing New Tests

### Basic Test Template

```typescript
import { expect } from "@playwright/test";
import { test } from "../../fixtures";

test.describe("Feature Name", () => {
  test("should do something @smoke", async ({
    customersPage, // Page object
    testDataContext, // Test data with unique IDs
  }) => {
    const testCustomer = testDataContext.customers[0];

    // Use page object methods
    await customersPage.goto();
    await customersPage.createCustomer(testCustomer);

    // Use semantic assertions
    await customersPage.expectCustomerExists(testCustomer.full_name);
  });
});
```

### Key Principles

- **Use page objects** for all interactions (e.g., `customersPage.createCustomer()`)
- **Never assert on counts** (fails with existing data)
- **Always search by unique test ID** before asserting
- **Tag critical tests** with `@smoke` for quick validation
- **Test from user perspective**, not implementation details

## Running Tests Against Different Environments

### Local Development (with npm run dev)

```bash
npm run test:e2e
# Playwright launches app via `npm run dev` (from playwright.config.ts)
```

### Built Static Output (Production-like)

```bash
npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx serve out -p 3000 &
npm run test:e2e
```

### External Environment (DEV/QA)

```bash
PLAYWRIGHT_BASE_URL=https://dev.example.com npm run test:e2e
```

Tests will pass identically in all environments because:

- ✅ Unique test data identifiers prevent collisions
- ✅ Tests search for their unique data, not affected by existing records
- ✅ No assumptions about initial database state

## Debugging Failed Tests

### 1. Run in Headed Mode (See Browser)

```bash
npm run test:e2e:debug -- --headed
```

### 2. Pause Execution

Add to your test:

```typescript
await page.pause(); // Opens Inspector, click Play to continue
```

### 3. Check Screenshots/Videos

- On failure, screenshots/videos are automatically captured
- View in `playwright-report/` after test run
- Use `npm run test:e2e:report` to view

### 4. View HTML Report

```bash
npm run test:e2e:report
```

## CI/CD Integration

Tests run automatically on every PR via `.github/workflows/e2e-tests.yml`:

1. **Trigger**: On push to main and all PRs
2. **Build**: `npm run build` (static export to `/out`)
3. **Serve**: Static server on port 3000
4. **Test**: `npm run test:e2e` with 4 parallel workers
5. **Retries**: Up to 2 retries on CI to reduce flakes
6. **Report**: HTML report + GitHub checks + artifact upload on failure

**View Results**:

- GitHub PR checks (✅/❌)
- Artifacts tab in workflow run (playwright-report/)

## Handling Common Issues

### Test Fails: "Locator is not found"

- Check selector priority (getByRole > getByLabel > getByText > getByTestId)
- Run in headed mode to see what's on screen
- Add data-testid if semantic selector insufficient

### Test Passes Locally, Fails on CI

- Check for timing issues (add explicit waits)
- Verify base URL is correct
- Check for environment-specific data issues

### Tests Work on Fresh Build but Fail with Existing Data

- Verify test searches for unique test ID before asserting
- Avoid asserting on record count
- Use `.search()` methods to isolate test data

## Adding data-testid Attributes

**Only add data-testid when semantic selectors fail**:

```typescript
// Don't do this (unnecessary if role selector works)
<button data-testid="btn-create">Create</button>

// Do this (if multiple buttons share same name)
<button data-testid="btn-create-customer">Create</button>
```

**Add to component before pushing:**

```tsx
<TextField label="Email" data-testid="input-email" />
```

Then use in tests:

```typescript
page.getByTestId("input-email").fill("test@test.com");
```

## Performance Considerations

- **Smoke tests**: ~90 seconds (includes UI setup)
- **Full suite**: ~5 minutes (parallel execution on CI)
- **Each test**: ~30-60 seconds (fixture setup + UI interactions)

Optimization tips:

- Use @smoke tag for quick pre-commit checks
- Reuse fixtures to share test setup
- Keep UI setup minimal (only create data needed for test)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-test)
