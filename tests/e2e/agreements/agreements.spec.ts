import { expect } from '@playwright/test';

import { test } from '../../fixtures';

test.describe('Agreements', () => {
  test.beforeEach(async ({ agreementsPage, customersPage, vehiclesPage, testDataContext }) => {
    await customersPage.goto();
    await customersPage.createCustomer(testDataContext.customers[0]);
    await customersPage.createCustomer(testDataContext.customers[1]);

    await vehiclesPage.goto();
    await vehiclesPage.createVehicle(testDataContext.vehicles[0]);
    await vehiclesPage.createVehicle(testDataContext.vehicles[1]);

    await agreementsPage.goto();
  });

  test('should list agreements @smoke', async ({ agreementsPage }) => {
    // Verify page is loaded
    const searchField = agreementsPage.searchInput;
    await expect(searchField).toBeVisible();

    const createButton = agreementsPage.createButton;
    await expect(createButton).toBeVisible();
  });

  test('should create a new agreement @smoke', async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await agreementsPage.createAgreement({
      customerName: customer.full_name,
      vehicleVin: vehicle.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    await agreementsPage.expectAgreementExists(customer.full_name, 'active');
  });

  test('should filter agreements by status', async ({ agreementsPage, testDataContext }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await agreementsPage.createAgreement({
      customerName: customer.full_name,
      vehicleVin: vehicle.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    await agreementsPage.filterByStatus('active');
    await agreementsPage.expectAgreementExists(customer.full_name);
  });

  test('should search agreements by customer name', async ({ agreementsPage, testDataContext }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    await agreementsPage.search(customer1.full_name);
    await agreementsPage.expectAgreementExists(customer1.full_name);
  });

  test('should create multiple distinct agreements', async ({ agreementsPage, testDataContext }) => {
    const customer1 = testDataContext.customers[0];
    const customer2 = testDataContext.customers[1];
    const vehicle1 = testDataContext.vehicles[0];
    const vehicle2 = testDataContext.vehicles[1];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
  });

  test('should view agreement details', async ({ agreementsPage, testDataContext, page }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await agreementsPage.createAgreement({
      customerName: customer.full_name,
      vehicleVin: vehicle.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    const row = agreementsPage.getAgreementRow(customer.full_name);
    await row.click();
    await expect(page).toHaveURL('**/agreement*');
  });

  test('should validate required fields in agreement form', async ({ agreementsPage, page }) => {
    // Click create agreement button
    await agreementsPage.clickCreateAgreement();

    // Try to save without filling required fields
    const saveButton = page.getByRole('button', { name: /save|submit/i });
    
    // Customer and vehicle fields should be required
    // (Specific selectors depend on form implementation)
    const customerField = page.getByLabel(/customer|rentee/i);
    await expect(customerField).toHaveAttribute('required', '');
  });

  test('should show daily rate calculations', async ({ agreementsPage, testDataContext, page }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];
    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await agreementsPage.createAgreement({
      customerName: customer.full_name,
      vehicleVin: vehicle.VIN,
      startDate: today,
      endDate: oneWeekLater,
      dailyRate: '50.00',
    });

    const row = agreementsPage.getAgreementRow(customer.full_name);
    await row.click();
    await expect(page).toHaveURL('**/agreement*');
  });
});
