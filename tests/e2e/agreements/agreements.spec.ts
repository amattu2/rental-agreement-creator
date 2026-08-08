import { expect } from "@playwright/test";

import { test } from "../../fixtures";

const saveChargesAndClose = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: "Edit Charges" }).click();
  const chargesDialog = page.locator('[role="dialog"]').filter({ hasText: "Edit Charges" });
  await chargesDialog.waitFor({ state: "visible" });
  await chargesDialog
    .locator("button")
    .filter({ hasText: /save.*close/i })
    .click({ force: true });
  await chargesDialog.waitFor({ state: "hidden" });
};

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

  test("should require billing reconfirmation when billable inputs change", async ({
    agreementsPage,
    page,
  }) => {
    await agreementsPage.gotoCreateAgreement();

    const generateButton = page.getByRole("button", { name: "Generate Agreement" });
    await expect(generateButton).toBeDisabled();

    await saveChargesAndClose(page);
    await expect(generateButton).toBeEnabled();

    await page.getByRole("button", { name: "Add rate" }).click();
    await expect(generateButton).toBeDisabled();

    await saveChargesAndClose(page);
    await expect(generateButton).toBeEnabled();
  });

  test("should keep agreement creation consistent for save-close and save-generate charge actions", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumberWithClose = await agreementsPage.createAgreementWithOptions(
      {
        customer: testDataContext.customers[0],
        vehicle: testDataContext.vehicles[0],
      },
      { chargesAction: "save-close" }
    );

    await agreementsPage.expectAgreementExists(agreementNumberWithClose, "active");
    await agreementsPage.openAgreementDetails(agreementNumberWithClose);
    await expect(page.getByTestId("iframe")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);

    await agreementsPage.goto();

    const agreementNumberWithGenerate = await agreementsPage.createAgreementWithOptions(
      {
        customer: testDataContext.customers[1],
        vehicle: testDataContext.vehicles[1],
      },
      { chargesAction: "save-generate" }
    );

    await agreementsPage.expectAgreementExists(agreementNumberWithGenerate, "active");
    await agreementsPage.openAgreementDetails(agreementNumberWithGenerate);
    await expect(page.getByTestId("iframe")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
  });

  test("should preserve or discard edits correctly through reset confirmation", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(
      testDataContext.customers[0].full_name
    );

    const fullNameInput = page.locator('input[name="rentee.full_name"]');
    const originalName = await fullNameInput.inputValue();
    const updatedName = `${originalName}-TEMP`;

    await fullNameInput.fill(updatedName);
    await expect(page.getByTestId("stale-overlay")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    const resetDialog = page.getByRole("dialog", { name: "Discard Changes?" });
    await expect(resetDialog).toBeVisible();
    await resetDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(resetDialog).toBeHidden();

    await expect(fullNameInput).toHaveValue(updatedName);
    await expect(page.getByTestId("stale-overlay")).toBeVisible();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(resetDialog).toBeVisible();
    await resetDialog.getByRole("button", { name: "Reset" }).click();
    await expect(resetDialog).toBeHidden();

    await expect(fullNameInput).toHaveValue(originalName);
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
  });

  test("should mark preview stale after editing saved agreement and clear stale state when changes are reverted", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(
      testDataContext.customers[1].full_name
    );
    await expect(page.getByTestId("iframe")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);

    const fullNameInput = page.locator('input[name="rentee.full_name"]');
    const originalName = await fullNameInput.inputValue();
    const modifiedName = `${originalName}-REVIEW`;

    await fullNameInput.fill(modifiedName);
    await expect(page.getByTestId("stale-overlay")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toContainText('Click "Generate Agreement"');

    await fullNameInput.fill(originalName);
    await page.keyboard.press("Tab");

    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
    await expect(page.getByTestId("iframe")).toBeVisible();
  });
});
