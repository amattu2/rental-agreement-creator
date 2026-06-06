import {
  DISTANCE_MEASUREMENT_OPTIONS,
  FUEL_LEVEL_OPTIONS,
  MAX_ADDITIONAL_DRIVERS,
  PAYLOAD_MEASUREMENT_OPTIONS,
} from "@/config/constants";
import dayjs, { Dayjs } from "dayjs";
import z from "zod";

const RENTEE_SCHEMA = z
  .object({
    full_name: z
      .string()
      .min(1, "Rentee name is required")
      .max(50, "Maximum of 50 characters allowed"),
    address_street1: z
      .string()
      .min(1, "Home address is required")
      .max(100, "Maximum of 100 characters allowed"),
    address_city: z.string().min(1, "City is required").max(50, "Maximum of 50 characters allowed"),
    address_state: z
      .string()
      .min(1, "State is required")
      .max(50, "Maximum of 50 characters allowed"),
    address_zip: z
      .string()
      .min(1, "Zip code is required")
      .max(20, "Maximum of 20 characters allowed"),
    verified: z.boolean(),

    driver_license_number: z
      .string()
      .min(1, "Driver's license number is required")
      .max(50, "Maximum of 50 characters allowed"),
    driver_license_state: z
      .string()
      .min(1, "Driver's license state is required")
      .max(50, "Maximum of 50 characters allowed"),
    driver_license_expiration: z
      .custom<Dayjs>()
      .refine((date) => date !== null && date.isValid(), "Driver's license expiration is required"),

    date_of_birth: z
      .custom<Dayjs>()
      .refine((date) => date !== null && date.isValid(), "Date of birth is required"),
    cell_phone: z
      .string()
      .min(1, "Cell phone number is required")
      .max(20, "Maximum of 20 characters allowed"),
    alternate_phone: z.string().max(20, "Maximum of 20 characters allowed").optional(),

    email: z
      .union([z.literal(""), z.email().max(100, "Maximum of 100 characters allowed")])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.driver_license_expiration && data.driver_license_expiration.isBefore(dayjs())) {
      ctx.addIssue({
        code: "custom",
        path: ["driver_license_expiration"],
        message: "Driver's license cannot be expired",
      });
    }

    if (data.date_of_birth && data.date_of_birth.isAfter(dayjs())) {
      ctx.addIssue({
        code: "custom",
        path: ["date_of_birth"],
        message: "Date of birth must be in the past",
      });
    }
  });

const RENTEE_EMPLOYER_SCHEMA = z.object({
  company: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  position: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  address_street1: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  address_city: z.string().max(50, "Maximum of 50 characters allowed").optional(),
  address_state: z.string().max(50, "Maximum of 50 characters allowed").optional(),
  address_zip: z.string().max(20, "Maximum of 20 characters allowed").optional(),
});

const RENTEE_INSURANCE_SCHEMA = z.object({
  company: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  policy_number: z.string().max(50, "Maximum of 50 characters allowed").optional(),
});

const ADDITIONAL_DRIVER_SCHEMA = z.object({
  full_name: z
    .string()
    .min(1, "Additional driver name is required")
    .max(50, "Maximum of 50 characters allowed"),
  date_of_birth: z
    .custom<Dayjs>()
    .refine((date) => date !== null && date.isValid(), "Date of birth is required"),
  driver_license_number: z
    .string()
    .min(1, "Driver's license number is required")
    .max(50, "Maximum of 50 characters allowed"),
  driver_license_expiration: z
    .custom<Dayjs>()
    .refine((date) => date !== null && date.isValid(), "Driver's license expiration is required"),
});

const VEHICLE_DAMAGE_WAIVER_SCHEMA = z.object({
  rate_per_day: z.number().min(1, "Rate per day must be a positive number"),
  rate_per_week: z.number().min(1, "Rate per week must be a positive number"),
  damage_liability_limit: z.number().min(1, "Damage liability limit must be a positive number"),
});

const PERSONAL_ACCIDENT_INSURANCE_SCHEMA = z.object({
  rate_per_day: z.number().min(1, "Rate per day must be a positive number"),
});

const RENTAL_VEHICLE_SCHEMA = z.object({
  identifier: z
    .string()
    .min(1, "Vehicle identifier is required")
    .max(50, "Maximum of 50 characters allowed"),
  VIN: z.string().min(1, "Vehicle VIN is required").max(17, "Maximum of 17 characters allowed"),
  license_plate: z
    .string()
    .min(1, "Vehicle license plate is required")
    .max(15, "Maximum of 15 characters allowed"),
  year: z
    .number()
    .int()
    .min(1900, "Vehicle year must be a valid year")
    .max(new Date().getFullYear() + 1, "Vehicle year cannot be in the future"),
  make: z.string().min(1, "Vehicle make is required").max(50, "Maximum of 50 characters allowed"),
  model: z.string().min(1, "Vehicle model is required").max(50, "Maximum of 50 characters allowed"),
  color: z.string().min(1, "Vehicle color is required").max(50, "Maximum of 50 characters allowed"),
});

const RENTAL_AGREEMENT_INFO_SCHEMA = z
  .object({
    odometer_in: z.number().int().min(1, "Odometer reading must be greater than 0"),
    date_in: z
      .custom<Dayjs>()
      .refine((date) => date !== null && date.isValid(), "Date in is required"),
    odometer_out: z.number().int().min(1, "Odometer reading must be greater than 0"),
    date_out: z
      .custom<Dayjs>()
      .refine((date) => date !== null && date.isValid(), "Date out is required"),
    fuel_level_out: z.enum(
      FUEL_LEVEL_OPTIONS,
      `Fuel level must be one of ${FUEL_LEVEL_OPTIONS.join(", ")}`
    ),
    fuel_level_in: z.enum(
      FUEL_LEVEL_OPTIONS,
      `Fuel level must be one of ${FUEL_LEVEL_OPTIONS.join(", ")}`
    ),
    max_distance: z.number().int().min(0, "Maximum distance must be a non-negative integer"),
    max_distance_measurement: z.enum(
      DISTANCE_MEASUREMENT_OPTIONS.map((option) => option.value),
      "Maximum distance measurement must be either 'MI' or 'KM'"
    ),
    max_payload: z.number().int().min(0, "Maximum payload must be a non-negative integer"),
    max_payload_measurement: z.enum(
      PAYLOAD_MEASUREMENT_OPTIONS.map((option) => option.value),
      "Maximum payload measurement must be either 'LB' or 'KG'"
    ),
  })
  .superRefine((data, ctx) => {
    if (data.date_in && data.date_out && !data.date_in.isAfter(data.date_out)) {
      ctx.addIssue({
        code: "custom",
        path: ["date_in"],
        message: "Return date and time must be after pickup date and time",
      });
    }
    if (
      data.odometer_in !== undefined &&
      data.odometer_out !== undefined &&
      data.odometer_out > data.odometer_in
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["odometer_in"],
        message: "Odometer at return must be greater than or equal to odometer at pickup",
      });
    }
    // TODO: Expand these rules. e.g. odometer_in does not exceed odometer_out by more than max_distance
  });

export const FORM_SCHEMA = z
  .object({
    agreement_number: z
      .string()
      .min(1, "Agreement number is required")
      .max(50, "Maximum of 50 characters allowed"),
    rentee: RENTEE_SCHEMA,
    rentee_employer: RENTEE_EMPLOYER_SCHEMA,
    rentee_insurance: RENTEE_INSURANCE_SCHEMA,
    additional_drivers: z
      .array(ADDITIONAL_DRIVER_SCHEMA)
      .max(
        MAX_ADDITIONAL_DRIVERS,
        `Maximum of ${MAX_ADDITIONAL_DRIVERS} additional drivers allowed`
      )
      .optional(),
    vehicle_damage_waiver: VEHICLE_DAMAGE_WAIVER_SCHEMA.optional(),
    personal_accident_insurance: PERSONAL_ACCIDENT_INSURANCE_SCHEMA.optional(),

    rental_vehicle: RENTAL_VEHICLE_SCHEMA,
    rental_agreement_info: RENTAL_AGREEMENT_INFO_SCHEMA,
    // TODO: Remaining fields from column 2 (e.g., rental rates, signatures)
  })
  .strict();

export type FormSchema = z.infer<typeof FORM_SCHEMA>;
