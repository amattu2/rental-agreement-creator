import { expect } from "@playwright/test";

import { test } from "../../fixtures";

const openAgreementActions = async (
  agreementsPage: import("../../pages/agreements.page").AgreementsPage,
  identifier: string
) => {
  const row = agreementsPage.getAgreementRow(identifier);
  await row.getByRole("menuitem", { name: /^more$/i }).click();
};

test.describe("Complete Agreement Lifecycle", () => {
  test("should support the complete agreement lifecycle", async ({
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

  test("should maintain data consistency across workflows", async ({
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

    await agreementsPage.finalizeAgreement(agreementNumber, {
      vehicleReturnedAt: "08/01/2026 10:15 AM",
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
    await page.keyboard.press("Escape");

    await agreementsPage.finalizeAgreement(activeAgreementNumber, {
      vehicleReturnedAt: "08/01/2026 10:15 AM",
      actualOdometerIn: 1100,
      actualFuelLevel: "F",
    });

    await agreementsPage.filterByStatus("archived");
    await openAgreementActions(agreementsPage, activeAgreementNumber);
    await expect(page.getByRole("menuitem", { name: "View Agreement" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "View Receipt" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Finalize" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Cancel" })).toHaveCount(0);
    await page.keyboard.press("Escape");

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
});
