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

    await customersPage.searchByName(testCustomer1.full_name);
    await expect(customersPage.getCustomerRow(testCustomer1.full_name)).toBeVisible();
    await expect(customersPage.getCustomerRow(testCustomer2.full_name)).toHaveCount(0);
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

    await expect(dialog.getByText(/invalid email/i)).toBeVisible();
  });

  test("should reject customer date of birth in the future", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel("Full name").fill("Future DOB Customer");
    await dialog.getByLabel("Street address").first().fill("123 Main St");
    await dialog.getByLabel("City").first().fill("Dallas");
    await dialog.getByLabel("State").first().fill("TX");
    await dialog.getByLabel("Zip code").first().fill("75001");
    await dialog.getByLabel("Cell phone").fill("555-0100");
    await dialog.getByLabel("Driver's license number").fill("DL-FUTURE-DOB");
    await dialog.getByLabel("Driver's license state").fill("TX");

    await dialog.getByRole("group", { name: "Driver's license expiration" }).click();
    await page.keyboard.type("12312099");

    await dialog.getByRole("group", { name: "Date of birth" }).click();
    await page.keyboard.type("12312099");

    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByText("Date of birth must be in the past")).toBeVisible();
  });

  test("should create multiple distinct customers", async ({ customersPage, testDataContext }) => {
    await customersPage.createCustomer(testDataContext.customers[0]);
    await customersPage.createCustomer(testDataContext.customers[1]);

    await customersPage.expectCustomerExists(testDataContext.customers[0].full_name);
    await customersPage.searchByName(testDataContext.customers[1].full_name);
    await customersPage.expectCustomerExists(testDataContext.customers[1].full_name);
  });
});
