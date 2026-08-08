/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";

import { AgreementsPage } from "./pages/agreements.page";
import { CustomersPage } from "./pages/customers.page";
import { VehiclesPage } from "./pages/vehicles.page";
import { TEST_CUSTOMERS, TEST_VEHICLES } from "./test-data";

/**
 * Custom test fixtures for E2E testing
 *
 * Provides:
 * - testDataContext: Contains unique test data for the current run
 * - Page objects: Initialized instances ready to use
 *
 * Test data uses unique identifiers per run to avoid collisions
 * with existing data in any environment (DEV, QA, PROD)
 */

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
    // Provide test data context (constants with unique run IDs)
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
