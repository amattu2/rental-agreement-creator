import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Customers", () => {
  test.beforeEach(async ({ customersPage }) => {
    await customersPage.goto();
  });

  test("should list customers @smoke", async ({ customersPage }) => {
    // Navigate to customers page
    await customersPage.goto();

    // Verify page is loaded (should have search field)
    const searchField = customersPage.searchInput;
    await expect(searchField).toBeVisible();
  });

  test("should create a new customer @smoke", async ({ customersPage, testDataContext }) => {
    const testCustomer = testDataContext.customers[0];

    await customersPage.createCustomer(testCustomer);
    await customersPage.searchByName(testCustomer.full_name);
    await customersPage.expectCustomerExists(testCustomer.full_name);
  });

  test("should edit an existing customer @smoke", async ({ customersPage, testDataContext }) => {
    const testCustomer = testDataContext.customers[0];
    const updatedName = `${testCustomer.full_name}-UPDATED`;

    await customersPage.createCustomer(testCustomer);
    await customersPage.editCustomer(testCustomer.full_name, { full_name: updatedName });
    await customersPage.searchByName(updatedName);
    await customersPage.expectCustomerExists(updatedName);
  });

  test("should search for customers by name", async ({ customersPage, testDataContext }) => {
    const testCustomer1 = testDataContext.customers[0];
    const testCustomer2 = testDataContext.customers[1];

    await customersPage.createCustomer(testCustomer1);
    await customersPage.createCustomer(testCustomer2);

    const partialName = testCustomer1.full_name.substring(0, 10);
    await customersPage.searchByName(partialName);
    await customersPage.expectCustomerExists(testCustomer1.full_name);
  });

  test("should validate customer name is required", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByRole("button", { name: "Save" }).click();

    // Zod validation message for empty full_name
    await expect(dialog.getByText("Rentee name is required")).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel("Full name").fill("Test Customer");
    await dialog.getByLabel("Email address").fill("invalid-email");

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeVisible();
  });

  test("should create multiple distinct customers", async ({ customersPage, testDataContext }) => {
    await customersPage.createCustomer(testDataContext.customers[0]);
    await customersPage.createCustomer(testDataContext.customers[1]);

    await customersPage.expectCustomerExists(testDataContext.customers[0].full_name);
    await customersPage.searchByName(testDataContext.customers[1].full_name);
    await customersPage.expectCustomerExists(testDataContext.customers[1].full_name);
  });
});
