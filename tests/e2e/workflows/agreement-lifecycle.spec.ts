import { expect } from "@playwright/test";

import { test } from "../../fixtures";

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
});
