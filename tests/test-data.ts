import type { FinalizationSchema } from "@/schemas/finalization";
import type { RenteeSchema, VehicleSchema } from "@/schemas/form";

// Unique per test run — prevents collisions with existing data in any environment
const TEST_RUN_ID = Date.now().toString(36);

export const TEST_CUSTOMERS: RenteeSchema[] = [
  {
    full_name: `TEST-CUSTOMER-${TEST_RUN_ID}-1`,
    address_street1: "123 Test St",
    address_city: "Testville",
    address_state: "TX",
    address_zip: "75001",
    verified: false,
    driver_license_number: `DL-${TEST_RUN_ID}-1`,
    driver_license_state: "TX",
    driver_license_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    date_of_birth: new Date("1990-01-01"),
    cell_phone: "555-0101",
    email: `test-${TEST_RUN_ID}-1@test.com`,
  },
  {
    full_name: `TEST-CUSTOMER-${TEST_RUN_ID}-2`,
    address_street1: "456 Sample Ave",
    address_city: "Testville",
    address_state: "TX",
    address_zip: "75002",
    verified: false,
    driver_license_number: `DL-${TEST_RUN_ID}-2`,
    driver_license_state: "TX",
    driver_license_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    date_of_birth: new Date("1985-06-15"),
    cell_phone: "555-0102",
    email: `test-${TEST_RUN_ID}-2@test.com`,
  },
  {
    full_name: `TEST-CUSTOMER-${TEST_RUN_ID}-3`,
    address_street1: "789 Demo Blvd",
    address_city: "Testville",
    address_state: "TX",
    address_zip: "75003",
    verified: false,
    driver_license_number: `DL-${TEST_RUN_ID}-3`,
    driver_license_state: "TX",
    driver_license_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    date_of_birth: new Date("1978-11-30"),
    cell_phone: "555-0103",
    email: `test-${TEST_RUN_ID}-3@test.com`,
  },
];

export const TEST_VEHICLES: VehicleSchema[] = [
  {
    VIN: `T${TEST_RUN_ID}001`.toUpperCase().slice(0, 17),
    stock_number: `STK-${TEST_RUN_ID}-1`,
    license_plate: `TST${TEST_RUN_ID.slice(-4).toUpperCase()}1`,
    year: 2022,
    make: "Honda",
    model: "Civic",
    color: "Blue",
  },
  {
    VIN: `T${TEST_RUN_ID}002`.toUpperCase().slice(0, 17),
    stock_number: `STK-${TEST_RUN_ID}-2`,
    license_plate: `TST${TEST_RUN_ID.slice(-4).toUpperCase()}2`,
    year: 2023,
    make: "Toyota",
    model: "Camry",
    color: "Silver",
  },
  {
    VIN: `T${TEST_RUN_ID}003`.toUpperCase().slice(0, 17),
    stock_number: `STK-${TEST_RUN_ID}-3`,
    license_plate: `TST${TEST_RUN_ID.slice(-4).toUpperCase()}3`,
    year: 2021,
    make: "Ford",
    model: "F-150",
    color: "Black",
  },
];

export const createFinalizationData = (): FinalizationSchema => ({
  vehicle_returned_at: new Date(),
  actual_odometer_in: 10050,
  actual_fuel_level_in: "1/2",
  finalized_at: new Date(),
});

export { TEST_RUN_ID };
