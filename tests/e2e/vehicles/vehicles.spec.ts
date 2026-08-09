import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Vehicles", () => {
  test.beforeEach(async ({ vehiclesPage }) => {
    await vehiclesPage.goto();
  });

  test("should list vehicles @smoke", async ({ vehiclesPage }) => {
    // Navigate to vehicles page
    await vehiclesPage.goto();

    // Verify page is loaded (should have search field)
    const searchField = vehiclesPage.searchInput;
    await expect(searchField).toBeVisible();
  });

  test("should create a new vehicle @smoke", async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.search(testVehicle.VIN);
    await vehiclesPage.expectVehicleExists(testVehicle.VIN);
  });

  test("should edit an existing vehicle @smoke", async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];
    const updatedModel = `${testVehicle.model}-UPDATED`;

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.editVehicle(testVehicle.VIN, { model: updatedModel });
    await vehiclesPage.search(testVehicle.VIN);
    const row = vehiclesPage.getVehicleRow(testVehicle.VIN);
    await expect(row).toBeVisible();
    await expect(row).toContainText(updatedModel);
  });

  test("should search for vehicles by VIN", async ({ vehiclesPage, testDataContext }) => {
    const testVehicle1 = testDataContext.vehicles[0];
    const testVehicle2 = testDataContext.vehicles[1];

    await vehiclesPage.createVehicle(testVehicle1);
    await vehiclesPage.createVehicle(testVehicle2);

    await vehiclesPage.search(testVehicle1.VIN);
    await expect(vehiclesPage.getVehicleRow(testVehicle1.VIN)).toBeVisible();
    await expect(vehiclesPage.getVehicleRow(testVehicle2.VIN)).toHaveCount(0);
  });

  test("should search for vehicles by make", async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];
    const otherVehicle = testDataContext.vehicles[1];

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.createVehicle(otherVehicle);
    await vehiclesPage.search(testVehicle.make);
    await expect(vehiclesPage.getVehicleRow(testVehicle.VIN)).toBeVisible();
    await expect(vehiclesPage.getVehicleRow(otherVehicle.VIN)).toHaveCount(0);
  });

  test("should validate VIN is required", async ({ page }) => {
    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByRole("button", { name: "Save" }).click();

    // Zod validation message for empty VIN
    await expect(dialog.getByText("Vehicle VIN is required")).toBeVisible();
  });

  test("should reject duplicate rental and usage rate types", async ({ page, testDataContext }) => {
    const vehicle = testDataContext.vehicles[2];

    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel("VIN").fill(vehicle.VIN);
    await dialog.getByLabel("Stock number").fill(vehicle.stock_number);
    await dialog.getByLabel("License plate").fill(vehicle.license_plate);
    await dialog.getByLabel("Year").fill(vehicle.year.toString());
    await dialog.getByLabel("Make").fill(vehicle.make);
    await dialog.getByLabel("Model").fill(vehicle.model);
    await dialog.getByLabel("Color").fill(vehicle.color);

    await dialog.getByRole("button", { name: "Add Rate" }).click();
    await dialog.getByRole("button", { name: "Add Rate" }).click();

    await dialog.getByRole("button", { name: "Add Usage Charge" }).click();
    await dialog.getByRole("button", { name: "Add Usage Charge" }).click();

    const costInputs = dialog.getByLabel("Cost Per Unit");
    await costInputs.nth(0).fill("10");
    await costInputs.nth(1).fill("20");
    await costInputs.nth(2).fill("3");
    await costInputs.nth(3).fill("4");

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Duplicate rate units are not allowed")).toBeVisible();
    await expect(dialog.getByText("Duplicate usage types are not allowed")).toBeVisible();
  });

  test("should reject vehicle year in the future", async ({ page, testDataContext }) => {
    const vehicle = testDataContext.vehicles[0];

    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel("VIN").fill(`${vehicle.VIN}Y`);
    await dialog.getByLabel("Stock number").fill(`${vehicle.stock_number}-FUTURE`);
    await dialog.getByLabel("License plate").fill(`${vehicle.license_plate}F`);
    await dialog.getByLabel("Year").fill("3000");
    await dialog.getByLabel("Make").fill(vehicle.make);
    await dialog.getByLabel("Model").fill(vehicle.model);
    await dialog.getByLabel("Color").fill(vehicle.color);

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Vehicle year cannot be in the future")).toBeVisible();
  });

  test("should require positive rental and usage costs", async ({ page, testDataContext }) => {
    const vehicle = testDataContext.vehicles[1];

    await page.getByRole("button", { name: "Create" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: "visible" });

    await dialog.getByLabel("VIN").fill(`${vehicle.VIN}P`);
    await dialog.getByLabel("Stock number").fill(`${vehicle.stock_number}-POS`);
    await dialog.getByLabel("License plate").fill(`${vehicle.license_plate}P`);
    await dialog.getByLabel("Year").fill(vehicle.year.toString());
    await dialog.getByLabel("Make").fill(vehicle.make);
    await dialog.getByLabel("Model").fill(vehicle.model);
    await dialog.getByLabel("Color").fill(vehicle.color);

    await dialog.getByRole("button", { name: "Add Rate" }).click();
    await dialog.getByRole("button", { name: "Add Usage Charge" }).click();

    const costInputs = dialog.getByLabel("Cost Per Unit");
    await costInputs.nth(0).fill("0");
    await costInputs.nth(1).fill("0");

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Rate cost must be a positive number").first()).toBeVisible();
    await expect(dialog.getByText("Usage cost must be a positive number").first()).toBeVisible();
  });

  test("should create multiple distinct vehicles", async ({ vehiclesPage, testDataContext }) => {
    await vehiclesPage.createVehicle(testDataContext.vehicles[0]);
    await vehiclesPage.createVehicle(testDataContext.vehicles[1]);

    await vehiclesPage.expectVehicleExists(testDataContext.vehicles[0].VIN);
    await vehiclesPage.search(testDataContext.vehicles[1].VIN);
    await vehiclesPage.expectVehicleExists(testDataContext.vehicles[1].VIN);
  });
});
