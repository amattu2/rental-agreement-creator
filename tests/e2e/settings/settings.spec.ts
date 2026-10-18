import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Settings", () => {
  test("should export a backup without any database records", async ({ page, settingsPage }) => {
    await settingsPage.goto();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import data" })).toBeEnabled();
    await expect(page.getByRole("banner").getByRole("link", { name: "Settings" })).toHaveCount(0);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^rental-backup-[\dT-]+Z\.zip$/);
    expect(await download.failure()).toBeNull();
    expect(await download.path()).not.toBeNull();

    await expect(page.getByRole("button", { name: "Export data" })).toBeEnabled();
  });

  test("should restore a backup and replace records created after export", async ({
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

    await settingsPage.goto();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data" }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).not.toBeNull();

    const additionalCustomer = testDataContext.customers[1];
    await customersPage.goto();
    await customersPage.createCustomer(additionalCustomer);
    await customersPage.expectCustomerExists(additionalCustomer.full_name);

    await settingsPage.goto();
    await page.getByLabel("Select backup ZIP").setInputFiles(backupPath!);
    const dialog = page.getByRole("dialog", { name: "Restore backup" });
    await expect(dialog.getByText(/permanently replace all/)).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();

    await customersPage.goto();
    await customersPage.expectCustomerExists(additionalCustomer.full_name);

    await settingsPage.goto();
    await page.getByLabel("Select backup ZIP").setInputFiles(backupPath!);
    await dialog.getByRole("button", { name: "Replace all data" }).click();
    await expect(dialog).toBeHidden();

    await customersPage.goto();
    await customersPage.expectCustomerExists(customer.full_name);
    await customersPage.expectCustomerNotExists(additionalCustomer.full_name);
    await vehiclesPage.goto();
    await vehiclesPage.expectVehicleExists(vehicle.VIN);
    await agreementsPage.goto();
    await agreementsPage.expectAgreementExists(agreementNumber, "active");
  });

  test("should reject an invalid backup without allowing replacement", async ({
    page,
    settingsPage,
  }) => {
    await settingsPage.goto();
    await page.getByLabel("Select backup ZIP").setInputFiles({
      name: "invalid.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("not a ZIP backup"),
    });
    const dialog = page.getByRole("dialog", { name: "Restore backup" });
    await expect(dialog.getByText("Unable to read this ZIP backup.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Replace all data" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
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
