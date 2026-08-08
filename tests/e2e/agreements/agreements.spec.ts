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
    await expect(page.getByTestId("iframe")).toBeVisible({ timeout: 15_000 });
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
    await expect(page.getByTestId("iframe")).toBeVisible({ timeout: 15_000 });
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
    await page.keyboard.press("Tab");
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
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("stale-overlay")).toBeVisible();
    await expect(page.getByTestId("stale-overlay")).toContainText('Click "Generate Agreement"');

    await fullNameInput.fill(originalName);
    await page.keyboard.press("Tab");

    await expect(page.getByTestId("stale-overlay")).toHaveCount(0);
    await expect(page.getByTestId("iframe")).toBeVisible();
  });

  test("should bind selected existing customer and vehicle data into the agreement form", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[2],
      full_name: `SELECT-CUSTOMER-${uniqueToken}`,
      email: `select-${uniqueToken}@test.com`,
      driver_license_number: `DL-SEL-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[2],
      VIN: `S${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-SEL-${uniqueToken}`,
      license_plate: `SEL${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toBeVisible();
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue(customer.full_name);
    await expect(page.locator('input[name="rentee.cell_phone"]')).toHaveValue(customer.cell_phone);

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Vehicle")).toBeVisible();
    await expect(page.locator('input[name="rental_vehicle.stock_number"]')).toHaveValue(
      vehicle.stock_number
    );
    await expect(page.locator('input[name="rental_vehicle.VIN"]')).toHaveValue(vehicle.VIN);
  });

  test("should clear selected existing customer and vehicle from the agreement form", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const customer = {
      ...testDataContext.customers[1],
      full_name: `CLEAR-CUSTOMER-${uniqueToken}`,
      email: `clear-${uniqueToken}@test.com`,
      driver_license_number: `DL-CLR-${uniqueToken}`,
    };
    const vehicle = {
      ...testDataContext.vehicles[1],
      VIN: `C${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-CLR-${uniqueToken}`,
      license_plate: `CLR${uniqueToken.slice(-5)}`,
    };

    await customersPage.goto();
    await customersPage.createCustomer(customer);
    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);

    await agreementsPage.gotoCreateAgreement();

    await page.getByRole("button", { name: "Select an existing customer" }).click();
    const customerDialog = page.getByRole("dialog", { name: /select customer/i });
    await customerDialog.getByLabel("Search").fill(customer.full_name);
    await customerDialog
      .locator(`[role="row"]:has-text("${customer.full_name}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const vehicleDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await vehicleDialog.getByLabel("Search").fill(vehicle.VIN);
    await vehicleDialog
      .locator(`[role="row"]:has-text("${vehicle.VIN}") [aria-label="Select"]`)
      .first()
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toBeVisible();
    await expect(page.getByText("Existing Vehicle")).toBeVisible();

    await page
      .locator('[aria-label="Clear customer selection"] .MuiChip-deleteIcon')
      .click({ force: true });
    await page
      .locator('[aria-label="Clear vehicle selection"] .MuiChip-deleteIcon')
      .click({ force: true });

    await expect(page.getByText("Existing Customer")).toHaveCount(0);
    await expect(page.getByText("Existing Vehicle")).toHaveCount(0);
    await expect(page.locator('input[name="rentee.full_name"]')).toHaveValue("");
    await expect(page.locator('input[name="rental_vehicle.stock_number"]')).toHaveValue("");
    await expect(page.locator('input[name="rental_vehicle.VIN"]')).toHaveValue("");
  });

  test("should support writing and saving a clerk signature", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.openAgreementDetails(agreementNumber);

    const signatureCanvas = page.getByLabel("Authorized Rental Clerk Signature");
    await expect(signatureCanvas).toBeVisible();

    const canvasHasInk = async () =>
      signatureCanvas.evaluate((canvasElement: HTMLCanvasElement) => {
        const context = canvasElement.getContext("2d");
        if (!context) {
          return false;
        }

        const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
        for (let index = 3; index < imageData.data.length; index += 4) {
          if (imageData.data[index] !== 0) {
            return true;
          }
        }
        return false;
      });

    expect(await canvasHasInk()).toBe(false);

    await signatureCanvas.evaluate((canvasElement) => {
      const rect = canvasElement.getBoundingClientRect();
      const fire = (type: string, x: number, y: number, buttons: number) => {
        canvasElement.dispatchEvent(
          new PointerEvent(type, {
            pointerId: 1,
            bubbles: true,
            clientX: rect.left + x,
            clientY: rect.top + y,
            buttons,
          })
        );
      };

      fire("pointerdown", 20, 20, 1);
      fire("pointermove", 170, 55, 1);
      fire("pointerup", 170, 55, 0);
    });

    expect(await canvasHasInk()).toBe(true);

    await page.getByRole("button", { name: "Generate Agreement" }).click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);

    await agreementsPage.goto();
    await agreementsPage.openAgreementDetails(agreementNumber);

    const persistedSignatureCanvas = page.getByLabel("Authorized Rental Clerk Signature");
    await expect(persistedSignatureCanvas).toBeVisible();

    const persistedCanvasHasInk = await persistedSignatureCanvas.evaluate(
      (canvasElement: HTMLCanvasElement) => {
        const context = canvasElement.getContext("2d");
        if (!context) {
          return false;
        }

        const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
        for (let index = 3; index < imageData.data.length; index += 4) {
          if (imageData.data[index] !== 0) {
            return true;
          }
        }
        return false;
      }
    );

    expect(persistedCanvasHasInk).toBe(true);
  });
});
