import { expect } from '@playwright/test';

import { test } from '../../fixtures';

test.describe('Customers', () => {
  test.beforeEach(async ({ customersPage }) => {
    await customersPage.goto();
  });

  test('should list customers @smoke', async ({ customersPage, testDataContext }) => {
    // Navigate to customers page
    await customersPage.goto();

    // Verify page is loaded (should have search field)
    const searchField = customersPage.searchInput;
    await expect(searchField).toBeVisible();
  });

  test('should create a new customer @smoke', async ({ customersPage, testDataContext }) => {
    const testCustomer = testDataContext.customers[0];

    await customersPage.createCustomer(testCustomer);
    await customersPage.searchByName(testCustomer.full_name);
    await customersPage.expectCustomerExists(testCustomer.full_name);
  });

  test('should edit an existing customer @smoke', async ({ customersPage, testDataContext }) => {
    const testCustomer = testDataContext.customers[0];
    const updatedName = `${testCustomer.full_name}-UPDATED`;

    await customersPage.createCustomer(testCustomer);
    await customersPage.editCustomer(testCustomer.full_name, { full_name: updatedName });
    await customersPage.searchByName(updatedName);
    await customersPage.expectCustomerExists(updatedName);
  });

  test('should search for customers by name', async ({ customersPage, testDataContext }) => {
    const testCustomer1 = testDataContext.customers[0];
    const testCustomer2 = testDataContext.customers[1];

    await customersPage.createCustomer(testCustomer1);
    await customersPage.createCustomer(testCustomer2);

    const partialName = testCustomer1.full_name.substring(0, 10);
    await customersPage.searchByName(partialName);
    await customersPage.expectCustomerExists(testCustomer1.full_name);
  });

  test('should validate customer name is required', async ({ customersPage, page }) => {
    // Try to create customer without name
    const createButtons = page.getByRole('button').filter({ hasText: /add|create|new/i });
    await createButtons.first().click();

    // Wait for dialog
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Try to submit without filling name
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    
    // Name field should be required
    const nameField = page.getByLabel(/full name/i);
    await expect(nameField).toHaveAttribute('required', '');
  });

  test('should validate email format', async ({ customersPage, page }) => {
    const createButtons = page.getByRole('button').filter({ hasText: /add|create|new/i });
    await createButtons.first().click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });

    // Fill name and invalid email
    await page.getByLabel(/full name/i).fill('Test Customer');
    await page.getByLabel(/email/i).fill('invalid-email');

    // Try to submit
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    await saveButton.click();

    // Should still have dialog open if validation fails
    await expect(dialog).toBeVisible();
  });

  test('should create multiple distinct customers', async ({ customersPage, testDataContext }) => {
    await customersPage.createCustomer(testDataContext.customers[0]);
    await customersPage.createCustomer(testDataContext.customers[1]);

    await customersPage.expectCustomerExists(testDataContext.customers[0].full_name);
    await customersPage.searchByName(testDataContext.customers[1].full_name);
    await customersPage.expectCustomerExists(testDataContext.customers[1].full_name);
  });
});
