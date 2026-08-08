import { expect } from "@playwright/test";

import { test } from "../../fixtures";

test.describe("Complete Agreement Lifecycle", () => {
  test("should complete full workflow: create customer, vehicle, and agreement", async ({
    page,
    agreementsPage,
    testDataContext,
  }) => {
    const customer = testDataContext.customers[0];
    const vehicle = testDataContext.vehicles[0];

    // createAgreement fills the form directly and internally upserts customer + vehicle records
    await agreementsPage.createAgreement({ customer, vehicle });

    await agreementsPage.expectAgreementExists(customer.full_name, "active");

    const row = agreementsPage.getAgreementRow(customer.full_name);
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

    // Agreement creation upserts the customer and vehicle records as part of onSubmit
    await agreementsPage.createAgreement({ customer: customer1, vehicle: vehicle1 });
    await agreementsPage.createAgreement({ customer: customer2, vehicle: vehicle2 });

    await agreementsPage.expectAgreementExists(customer1.full_name);
    await agreementsPage.search(customer2.full_name);
    await agreementsPage.expectAgreementExists(customer2.full_name);

    // Records created by agreement submission are visible in the respective list pages
    await customersPage.goto();
    await customersPage.expectCustomerExists(customer1.full_name);
    await customersPage.expectCustomerExists(customer2.full_name);

    await vehiclesPage.goto();
    await vehiclesPage.expectVehicleExists(vehicle1.VIN);
    await vehiclesPage.expectVehicleExists(vehicle2.VIN);
  });
});
