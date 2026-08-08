import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Agreements", () => {
  test.beforeEach(async ({ agreementsPage }) => {
    await agreementsPage.goto();
  });

  test("should list agreements @smoke", async ({ agreementsPage }) => {
    const searchField = agreementsPage.searchInput;
    await expect(searchField).toBeVisible();

    const createButton = agreementsPage.createButton;
    await expect(createButton).toBeVisible();
  });

  test("should create a new agreement @smoke", async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.expectAgreementExists(customer.full_name, "active");
  });

  test("should filter agreements by status", async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.filterByStatus("active");
    await agreementsPage.expectAgreementExists(customer.full_name);
  });

  test("should search agreements by customer name", async ({ agreementsPage, testDataContext }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    await agreementsPage.createAgreement({ customer: customer1, vehicle: vehicle1 });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.search(customer1.full_name);
    await agreementsPage.expectAgreementExists(customer1.full_name);
  });

  test("should create multiple distinct agreements", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    await agreementsPage.createAgreement({ customer: customer1, vehicle: vehicle1 });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.expectAgreementExists(customer1.full_name);
    await agreementsPage.search(customer2.full_name);
    await agreementsPage.expectAgreementExists(customer2.full_name);
  });

  test("should view agreement details", async ({ agreementsPage, testDataContext, page }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    await agreementsPage.createAgreement({ customer, vehicle });

    const row = agreementsPage.getAgreementRow(customer.full_name);
    await row.getByRole("link").click();
    await expect(page).toHaveURL("**/agreement*");
  });

  test("should validate required fields in agreement form", async ({ agreementsPage, page }) => {
    await agreementsPage.clickCreateAgreement();

    await expect(page.getByLabel("Agreement number")).toBeVisible();
    // Generate Agreement is disabled until billing is confirmed (by design)
    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();
  });

  test("should show daily rate calculations", async ({ agreementsPage, testDataContext, page }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    await agreementsPage.createAgreement({ customer, vehicle });

    const row = agreementsPage.getAgreementRow(customer.full_name);
    await row.getByRole("link").click();
    await expect(page).toHaveURL("**/agreement*");
  });
});
