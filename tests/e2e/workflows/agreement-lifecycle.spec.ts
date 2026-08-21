import { expect } from "@playwright/test";

import { test } from "../../fixtures";

const openAgreementActions = async (
  agreementsPage: import("../../pages/agreements.page").AgreementsPage,
  identifier: string
) => {
  const row = agreementsPage.getAgreementRow(identifier);
  await row.getByRole("menuitem", { name: /^more$/i }).click();
};

test.describe("Agreement Lifecycle", () => {
  test("should create an active agreement and open its details", async ({
    page,
    agreementsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.expectAgreementExists(agreementNumber, "active");

    const row = agreementsPage.getAgreementRow(agreementNumber);
    await row.getByRole("link").click();
    await expect(page).toHaveURL(/\/agreement\?uuid=/);
  });

  test("should surface agreement-created customers and vehicles in list pages", async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
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

    // Records created by agreement submission are visible in the respective list pages
    await customersPage.goto();
    await customersPage.expectCustomerExists(customer1.full_name);
    await customersPage.expectCustomerExists(customer2.full_name);

    await vehiclesPage.goto();
    await vehiclesPage.expectVehicleExists(vehicle1.VIN);
    await vehiclesPage.expectVehicleExists(vehicle2.VIN);
  });

  test("should archive agreement through finalization flow", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });
    await agreementsPage.expectAgreementExists(agreementNumber, "active");

    const vehicleReturnedAt = new Date();
    vehicleReturnedAt.setDate(vehicleReturnedAt.getDate() + 1);
    vehicleReturnedAt.setHours(10, 15, 0, 0);

    await agreementsPage.finalizeAgreement(agreementNumber, {
      vehicleReturnedAt,
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("active");
    await agreementsPage.expectAgreementNotExists(agreementNumber);

    await agreementsPage.filterByStatus("archived");
    await agreementsPage.expectAgreementExists(agreementNumber, "archived");
  });

  test("should cancel agreement and move it out of active workflow", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[1];
    const vehicle = testDataContext.vehicles[1];

    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });
    await agreementsPage.expectAgreementExists(agreementNumber, "active");

    await agreementsPage.cancelAgreement(agreementNumber);

    await agreementsPage.filterByStatus("active");
    await agreementsPage.expectAgreementNotExists(agreementNumber);

    await agreementsPage.filterByStatus("canceled");
    await agreementsPage.expectAgreementExists(agreementNumber, "canceled");
  });

  test("should show status-specific agreement row actions", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    test.slow();

    const activeAgreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, activeAgreementNumber);
    await expect(page.getByRole("menuitem", { name: "View Agreement" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Finalize" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Cancel" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "View Receipt" })).toHaveCount(0);
    await page.mouse.click(8, 8);
    await page.getByLabel("Status", { exact: true }).click();
    await page.getByRole("option", { name: /^active$/i }).click();

    const vehicleReturnedAt = new Date();
    vehicleReturnedAt.setDate(vehicleReturnedAt.getDate() + 1);
    vehicleReturnedAt.setHours(10, 15, 0, 0);

    await agreementsPage.finalizeAgreement(activeAgreementNumber, {
      vehicleReturnedAt,
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("archived");
    await openAgreementActions(agreementsPage, activeAgreementNumber);
    await expect(page.getByRole("menuitem", { name: "View Agreement" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "View Receipt" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Finalize" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Cancel" })).toHaveCount(0);
    await page.mouse.click(8, 8);
    await page.getByLabel("Status", { exact: true }).click();
    await page.getByRole("option", { name: /^archived$/i }).click();

    const canceledAgreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[2],
      vehicle: testDataContext.vehicles[2],
    });
    await agreementsPage.cancelAgreement(canceledAgreementNumber);

    await agreementsPage.filterByStatus("canceled");
    await openAgreementActions(agreementsPage, canceledAgreementNumber);
    await expect(page.getByRole("menuitem", { name: "View Agreement" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "View Receipt" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Finalize" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Cancel" })).toHaveCount(0);
  });

  test("should enforce vehicle activation consistency across vehicle and agreement workflows", async ({
    vehiclesPage,
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const uniqueToken = Date.now().toString(36).toUpperCase();
    const vehicle = {
      ...testDataContext.vehicles[2],
      VIN: `V${uniqueToken}AAA`.slice(0, 17),
      stock_number: `STK-${uniqueToken}`,
      license_plate: `PLT${uniqueToken.slice(-5)}`,
    };

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);
    await vehiclesPage.filterByStatus("active");
    await vehiclesPage.expectVehicleExists(vehicle.VIN);

    await vehiclesPage.toggleVehicleStatus(vehicle.VIN);
    await vehiclesPage.filterByStatus("active");
    await vehiclesPage.expectVehicleNotExists(vehicle.VIN);

    await vehiclesPage.filterByStatus("inactive");
    await vehiclesPage.expectVehicleExists(vehicle.VIN);

    await agreementsPage.gotoCreateAgreement();
    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const selectionDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await selectionDialog.getByLabel("Search").fill(vehicle.VIN);
    await expect(selectionDialog.locator(`[role="row"]:has-text("${vehicle.VIN}")`)).toHaveCount(0);
    await selectionDialog.getByRole("button", { name: "Close" }).click();

    await vehiclesPage.goto();
    await vehiclesPage.filterByStatus("inactive");
    await vehiclesPage.toggleVehicleStatus(vehicle.VIN);
    await vehiclesPage.filterByStatus("active");
    await vehiclesPage.expectVehicleExists(vehicle.VIN);

    await agreementsPage.gotoCreateAgreement();
    await page.getByRole("button", { name: "Select an existing vehicle" }).click();
    const activeSelectionDialog = page.getByRole("dialog", { name: /select vehicle/i });
    await activeSelectionDialog.getByLabel("Search").fill(vehicle.VIN);
    await expect(
      activeSelectionDialog.locator(`[role="row"]:has-text("${vehicle.VIN}")`)
    ).toBeVisible();
  });

  test("should render archived and canceled agreements as readonly in detail view", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    test.slow();

    const archivedAgreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    const vehicleReturnedAt = new Date();
    vehicleReturnedAt.setDate(vehicleReturnedAt.getDate() + 1);
    vehicleReturnedAt.setHours(10, 15, 0, 0);

    await agreementsPage.finalizeAgreement(archivedAgreementNumber, {
      vehicleReturnedAt,
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("archived");
    await agreementsPage.openAgreementDetails(archivedAgreementNumber);

    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Edit Charges" })).toBeDisabled();
    await expect(page.locator('input[name="rentee.full_name"]')).toBeDisabled();

    await agreementsPage.goto();

    const canceledAgreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });
    await agreementsPage.cancelAgreement(canceledAgreementNumber);

    await agreementsPage.filterByStatus("canceled");
    await agreementsPage.openAgreementDetails(canceledAgreementNumber);

    await expect(page.getByRole("button", { name: "Generate Agreement" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Edit Charges" })).toBeDisabled();
    await expect(page.locator('input[name="rentee.full_name"]')).toBeDisabled();
  });

  test("should prevent finalization when odometer in is less than pickup odometer", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, agreementNumber);
    await page.getByRole("menuitem", { name: /^finalize$/i }).click();

    const dialog = page.getByRole("dialog", { name: /finalize agreement/i });
    await expect(dialog).toBeVisible();

    const finalizedReturnDate = new Date();
    finalizedReturnDate.setDate(finalizedReturnDate.getDate() + 1);
    finalizedReturnDate.setHours(10, 15, 0, 0);
    await agreementsPage.typeDateTimeField("Return date", finalizedReturnDate);

    await dialog.getByLabel(/^odometer in$/i).fill("999");
    await dialog.getByLabel(/^fuel level in$/i).click();
    await page.getByRole("option", { name: "F" }).click();
    await dialog.getByRole("button", { name: /^confirm$/i }).click();

    await expect(
      dialog.getByText("Odometer at return must be greater than or equal to odometer at pickup")
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("should prevent finalization when return date is before pickup date", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, agreementNumber);
    await page.getByRole("menuitem", { name: /^finalize$/i }).click();

    const dialog = page.getByRole("dialog", { name: /finalize agreement/i });
    await expect(dialog).toBeVisible();

    const invalidReturnDate = new Date();
    invalidReturnDate.setDate(invalidReturnDate.getDate() - 30);
    invalidReturnDate.setHours(8, 0, 0, 0);
    await agreementsPage.typeDateTimeField("Return date", invalidReturnDate);

    await dialog.getByLabel(/^odometer in$/i).fill("1100");
    await dialog.getByLabel(/^fuel level in$/i).click();
    await page.getByRole("option", { name: "F" }).click();
    await dialog.getByRole("button", { name: /^confirm$/i }).click();

    await expect(
      dialog.getByText("Return date and time must be after pickup date and time")
    ).toBeVisible();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^cancel$/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("should open receipt PDF after finalization and from archived row action", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[2],
      vehicle: testDataContext.vehicles[2],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, agreementNumber);
    await page.getByRole("menuitem", { name: /^finalize$/i }).click();

    const dialog = page.getByRole("dialog", { name: /finalize agreement/i });
    await expect(dialog).toBeVisible();

    const finalizedReturnDate = new Date();
    finalizedReturnDate.setDate(finalizedReturnDate.getDate() + 1);
    finalizedReturnDate.setHours(10, 15, 0, 0);
    await agreementsPage.typeDateTimeField("Return date", finalizedReturnDate);

    await dialog.getByLabel(/^odometer in$/i).fill("1100");
    await dialog.getByLabel(/^fuel level in$/i).click();
    await page.getByRole("option", { name: "F" }).click();

    await agreementsPage.installWindowOpenSpy();
    await dialog.getByRole("button", { name: /^confirm$/i }).click();
    await agreementsPage.expectWindowOpenCalledWithBlobUrl();
    await dialog.waitFor({ state: "hidden" });

    await agreementsPage.filterByStatus("archived");
    await openAgreementActions(agreementsPage, agreementNumber);

    await agreementsPage.installWindowOpenSpy();
    await page.getByRole("menuitem", { name: "View Receipt" }).click();
    await agreementsPage.expectWindowOpenCalledWithBlobUrl();
  });

  test("should open agreement PDF from 'View Agreement' row action", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, agreementNumber);

    await agreementsPage.installWindowOpenSpy();
    await page.getByRole("menuitem", { name: "View Agreement" }).click();
    await agreementsPage.expectWindowOpenCalledWithBlobUrl();
  });

  test("should open receipt PDF from 'View Receipt' row action", async ({
    agreementsPage,
    testDataContext,
    page,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    const vehicleReturnedAt = new Date();
    vehicleReturnedAt.setDate(vehicleReturnedAt.getDate() + 1);
    vehicleReturnedAt.setHours(10, 15, 0, 0);

    await agreementsPage.finalizeAgreement(agreementNumber, {
      vehicleReturnedAt,
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("archived");
    await openAgreementActions(agreementsPage, agreementNumber);

    await agreementsPage.installWindowOpenSpy();
    await page.getByRole("menuitem", { name: "View Receipt" }).click();
    await agreementsPage.expectWindowOpenCalledWithBlobUrl();
  });

  test("should generate an agreement PDF from 'View Agreement' row action @smoke", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[0],
      vehicle: testDataContext.vehicles[0],
    });

    await agreementsPage.filterByStatus("active");
    await openAgreementActions(agreementsPage, agreementNumber);
    const fields = await agreementsPage.capturePdfScreenshot(
      "View Agreement",
      "Agreement",
      test.info()
    );

    expect(fields).toBeDefined();
  });

  test("should generate a receipt PDF from 'View Receipt' row action @smoke", async ({
    agreementsPage,
    testDataContext,
  }) => {
    const agreementNumber = await agreementsPage.createAgreement({
      customer: testDataContext.customers[1],
      vehicle: testDataContext.vehicles[1],
    });

    const vehicleReturnedAt = new Date();
    vehicleReturnedAt.setDate(vehicleReturnedAt.getDate() + 1);
    vehicleReturnedAt.setHours(10, 15, 0, 0);

    await agreementsPage.finalizeAgreement(agreementNumber, {
      vehicleReturnedAt,
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("archived");
    await openAgreementActions(agreementsPage, agreementNumber);
    const fields = await agreementsPage.capturePdfScreenshot(
      "View Receipt",
      "Receipt",
      test.info()
    );

    expect(fields).toBeDefined();
  });
});
