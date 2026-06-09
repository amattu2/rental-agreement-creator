import { FormSchema } from "@/schemas/form";

/**
 * A constant array of fuel level options for the rental agreement form.
 */
export const FUEL_LEVEL_OPTIONS = ["E", "1/4", "1/2", "3/4", "F"];

/**
 * A constant representing the maximum number of additional drivers allowed in the rental agreement form.
 */
export const MAX_ADDITIONAL_DRIVERS = 2;

/**
 * A constant representing the maximum number of rental rates allowed in the rental agreement form.
 */
export const MAX_RENTAL_RATES = 4;

/**
 * Constant representing the rate unit options for rental rates.
 */
export const RATE_UNIT_OPTIONS = [
  { label: "Hours", value: "hours", note: "Per Hour" },
  { label: "Days", value: "days" },
  { label: "Weeks", value: "weeks" },
  { label: "Miles", value: "miles", note: "Per Mile" },
];

/**
 * Constant representing the distance measurement options for the rental agreement form.
 */
export const DISTANCE_MEASUREMENT_OPTIONS = [
  { label: "Miles (MI)", value: "MI" },
  { label: "Kilometers (KM)", value: "KM" },
];

/**
 * Constant representing the payload measurement options for the rental agreement form.
 */
export const PAYLOAD_MEASUREMENT_OPTIONS = [
  { label: "Pounds (LB)", value: "LB" },
  { label: "Kilograms (KG)", value: "KG" },
];

/**
 * A default form object that adheres to the FormSchema
 */
export const DEFAULT_FORM: FormSchema = {
  agreement_number: "",
  rentee: {
    full_name: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    verified: false,
    driver_license_number: "",
    driver_license_state: "",
    driver_license_expiration: new Date(), // TODO: Needs to be empty by default
    date_of_birth: new Date(),
    cell_phone: "",
    alternate_phone: "",
    email: "",
  },
  rentee_employer: {
    company: "",
    position: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  },
  rentee_insurance: {
    company: "",
    policy_number: "",
  },
  additional_drivers: [],
  vehicle_damage_waiver: undefined,
  personal_accident_insurance: undefined,
  rental_vehicle: {
    identifier: "",
    VIN: "",
    license_plate: "",
    year: new Date().getFullYear(),
    make: "",
    model: "",
    color: "",
    rental_rates: [],
  },
  rental_agreement_info: {
    odometer_in: 0,
    date_in: new Date(),
    odometer_out: 0,
    date_out: new Date(),
    max_distance: 0,
    max_distance_measurement: "MI",
    max_payload: 0,
    max_payload_measurement: "LB",
    fuel_level_in: "F",
    fuel_level_out: "F",
  },
  currency: "USD",
};

export const INDEXED_DB_NAME = "rental-agreement-creator";
export const INDEXED_DB_VERSION = 2;
export const INDEXED_DB_AGREEMENT_STORE = "agreements";
export const INDEXED_DB_VEHICLE_STORE = "vehicles";
export const AGREEMENT_TERMS_PDF_URL = "/AgreementTerms.pdf";
