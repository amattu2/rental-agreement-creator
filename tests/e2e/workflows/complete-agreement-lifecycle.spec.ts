import { expect } from '@playwright/test';

import { test } from '../../fixtures';

test.describe('Complete Agreement Lifecycle', () => {
  test('should complete full workflow: create customer, vehicle, and agreement', async ({
    page,
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await customersPage.goto();
    await customersPage.createCustomer(customer);
    await customersPage.expectCustomerExists(customer.full_name);

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle);
    await vehiclesPage.expectVehicleExists(vehicle.VIN);

    await agreementsPage.goto();
    await agreementsPage.createAgreement({
      customerName: customer.full_name,
      vehicleVin: vehicle.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    await agreementsPage.expectAgreementExists(customer.full_name, 'active');

    const row = agreementsPage.getAgreementRow(customer.full_name);
    await row.click();
    await expect(page).toHaveURL('**/agreement*');

    const customerField = page.getByLabel(/customer|rentee/i);
    const vehicleField = page.getByLabel(/vehicle/i);
    await expect(customerField).toBeVisible();
    await expect(vehicleField).toBeVisible();
  });

  test('should maintain data consistency across workflows', async ({
    agreementsPage,
    customersPage,
    vehiclesPage,
    testDataContext,
  }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await customersPage.goto();
    await customersPage.createCustomer(customer1);
    await customersPage.createCustomer(customer2);

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(vehicle1);
    await vehiclesPage.createVehicle(vehicle2);

    await agreementsPage.goto();
    await agreementsPage.createAgreement({
      customerName: customer1.full_name,
      vehicleVin: vehicle1.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    await agreementsPage.createAgreement({
      customerName: customer2.full_name,
      vehicleVin: vehicle2.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '60.00',
    });

    await agreementsPage.expectAgreementExists(customer1.full_name);
    await agreementsPage.search(customer2.full_name);
    await agreementsPage.expectAgreementExists(customer2.full_name);

    await customersPage.goto();
    await customersPage.expectCustomerExists(customer1.full_name);
    await customersPage.expectCustomerExists(customer2.full_name);

    await vehiclesPage.goto();
    await vehiclesPage.expectVehicleExists(vehicle1.VIN);
    await vehiclesPage.expectVehicleExists(vehicle2.VIN);
  });
});
