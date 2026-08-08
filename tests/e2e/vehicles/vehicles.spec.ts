import { expect } from '@playwright/test';

import { test } from '../../fixtures';

test.describe('Vehicles', () => {
  test.beforeEach(async ({ vehiclesPage }) => {
    await vehiclesPage.goto();
  });

  test('should list vehicles @smoke', async ({ vehiclesPage }) => {
    // Navigate to vehicles page
    await vehiclesPage.goto();

    // Verify page is loaded (should have search field)
    const searchField = vehiclesPage.searchInput;
    await expect(searchField).toBeVisible();
  });

  test('should create a new vehicle @smoke', async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.search(testVehicle.VIN);
    await vehiclesPage.expectVehicleExists(testVehicle.VIN);
  });

  test('should edit an existing vehicle @smoke', async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];
    const updatedModel = `${testVehicle.model}-UPDATED`;

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.editVehicle(testVehicle.VIN, { model: updatedModel });
    await vehiclesPage.search(testVehicle.VIN);
    await vehiclesPage.expectVehicleExists(testVehicle.VIN);
  });

  test('should search for vehicles by VIN', async ({ vehiclesPage, testDataContext }) => {
    const testVehicle1 = testDataContext.vehicles[0];
    const testVehicle2 = testDataContext.vehicles[1];

    await vehiclesPage.createVehicle(testVehicle1);
    await vehiclesPage.createVehicle(testVehicle2);

    await vehiclesPage.search(testVehicle1.VIN);
    await vehiclesPage.expectVehicleExists(testVehicle1.VIN);
  });

  test('should search for vehicles by make/model', async ({ vehiclesPage, testDataContext }) => {
    const testVehicle = testDataContext.vehicles[0];

    await vehiclesPage.createVehicle(testVehicle);
    await vehiclesPage.search(testVehicle.make);
    await vehiclesPage.expectVehicleExists(testVehicle.VIN);
  });

  test('should validate VIN is required', async ({ page, vehiclesPage }) => {
    await page.getByRole('button', { name: 'Create' }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible' });

    await dialog.getByRole('button', { name: 'Save' }).click();

    // Zod validation message for empty VIN
    await expect(dialog.getByText('Vehicle VIN is required')).toBeVisible();
  });

  test('should create multiple distinct vehicles', async ({ vehiclesPage, testDataContext }) => {
    await vehiclesPage.createVehicle(testDataContext.vehicles[0]);
    await vehiclesPage.createVehicle(testDataContext.vehicles[1]);

    await vehiclesPage.expectVehicleExists(testDataContext.vehicles[0].VIN);
    await vehiclesPage.search(testDataContext.vehicles[1].VIN);
    await vehiclesPage.expectVehicleExists(testDataContext.vehicles[1].VIN);
  });
});
