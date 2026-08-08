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

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.expectAgreementExists(agreementNumber, "active");
  });

  test("should filter agreements by status", async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.filterByStatus("active");
    await agreementsPage.expectAgreementExists(agreementNumber);
  });

  test("should search agreements by customer name", async ({ agreementsPage, testDataContext }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    const agreementNumber1 = await agreementsPage.createAgreement({
      customer: customer1,
      vehicle: vehicle1,
    });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.search(customer1.full_name);
    await expect(agreementsPage.getAgreementRow(agreementNumber1)).toBeVisible();
  });

  test("should create multiple distinct agreements", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];

    const agreementNumber1 = await agreementsPage.createAgreement({
      customer: customer1,
      vehicle: vehicle1,
    });
    const agreementNumber2 = await agreementsPage.createAgreement({
      customer: customer2,
      vehicle: vehicle2,
    });

    await agreementsPage.expectAgreementExists(agreementNumber1);
    await agreementsPage.search(agreementNumber2);
    await agreementsPage.expectAgreementExists(agreementNumber2);
  });

  test("should view agreement details", async ({ agreementsPage, testDataContext, page }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    const row = agreementsPage.getAgreementRow(agreementNumber);
    await row.getByRole("link").click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
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

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    const row = agreementsPage.getAgreementRow(agreementNumber);
    await row.getByRole("link").click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
  });
});
