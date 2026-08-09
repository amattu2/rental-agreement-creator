/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";

import { AgreementsPage } from "./pages/agreements.page";
import { CustomersPage } from "./pages/customers.page";
import { VehiclesPage } from "./pages/vehicles.page";
import { TEST_CUSTOMERS, TEST_VEHICLES } from "./test-data";

type TestFixtures = {
  testDataContext: {
    customers: typeof TEST_CUSTOMERS;
    vehicles: typeof TEST_VEHICLES;
  };
  agreementsPage: AgreementsPage;
  customersPage: CustomersPage;
  vehiclesPage: VehiclesPage;
};

export const test = base.extend<TestFixtures>({
  testDataContext: async ({}, use) => {
    const context = {
      customers: TEST_CUSTOMERS,
      vehicles: TEST_VEHICLES,
    };

    await use(context);
  },

  agreementsPage: async ({ page }, use) => {
    const agreementsPage = new AgreementsPage(page);
    await use(agreementsPage);
  },

  customersPage: async ({ page }, use) => {
    const customersPage = new CustomersPage(page);
    await use(customersPage);
  },

  vehiclesPage: async ({ page }, use) => {
    const vehiclesPage = new VehiclesPage(page);
    await use(vehiclesPage);
  },
});

export { expect } from "@playwright/test";
