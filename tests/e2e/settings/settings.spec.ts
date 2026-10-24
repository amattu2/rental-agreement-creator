import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Settings", () => {
  test("should export a backup without any database records", async ({ page, settingsPage }) => {
    await settingsPage.goto();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import data" })).toBeDisabled();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^rental-backup-[\dT-]+Z\.zip$/);
    expect(await download.failure()).toBeNull();
    expect(await download.path()).not.toBeNull();

    await expect(page.getByRole("button", { name: "Export data" })).toBeEnabled();
  });

  test("should export a backup after creating records through the UI", async ({
    page,
    agreementsPage,
    customersPage,
    vehiclesPage,
    settingsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const agreementNumber = await agreementsPage.createAgreement({ customer, vehicle });
    await agreementsPage.expectAgreementExists(agreementNumber, "active");

    await customersPage.goto();
    await customersPage.searchByName(customer.full_name);
    await customersPage.expectCustomerExists(customer.full_name);

    await vehiclesPage.goto();
    await vehiclesPage.search(vehicle.VIN);
    await vehiclesPage.expectVehicleExists(vehicle.VIN);

    await settingsPage.goto();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^rental-backup-[\dT-]+Z\.zip$/);
    expect(await download.failure()).toBeNull();
    expect(await download.path()).not.toBeNull();

    await expect(page.getByRole("button", { name: "Export data" })).toBeEnabled();
  });
});
