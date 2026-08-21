import dayjs from "dayjs";
import z from "zod";

import {
  DISTANCE_MEASUREMENT_OPTIONS,
  FUEL_LEVEL_OPTIONS,
  MAX_ADDITIONAL_DRIVERS,
  MAX_RENTAL_RATES,
  MAX_USAGE_RATES,
  PAYLOAD_MEASUREMENT_OPTIONS,
  RATE_UNIT_OPTIONS,
  USAGE_TYPE_OPTIONS,
} from "@/config/constants";
import { computeBillingSignature } from "@/utils/billing";

const EMPLOYER_SCHEMA = z.object({
  company: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  position: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  address_street1: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  address_city: z.string().max(50, "Maximum of 50 characters allowed").optional(),
  address_state: z.string().max(50, "Maximum of 50 characters allowed").optional(),
  address_zip: z.string().max(20, "Maximum of 20 characters allowed").optional(),
});

const INSURANCE_SCHEMA = z.object({
  company: z.string().max(100, "Maximum of 100 characters allowed").optional(),
  policy_number: z.string().max(50, "Maximum of 50 characters allowed").optional(),
});

export const RENTEE_SCHEMA = z
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
    driver_license_expiration: z.date().min(new Date(), "Driver's license cannot be expired"),

    date_of_birth: z.date().max(new Date(), "Date of birth must be in the past"),
    cell_phone: z
      .string()
      .min(1, "Cell phone number is required")
      .max(20, "Maximum of 20 characters allowed"),
    alternate_phone: z.string().max(20, "Maximum of 20 characters allowed").optional(),
    email: z
      .union([z.literal(""), z.email().max(100, "Maximum of 100 characters allowed")])
      .optional(),
    employer: EMPLOYER_SCHEMA.optional(),
    insurance: INSURANCE_SCHEMA.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.driver_license_expiration && dayjs(data.driver_license_expiration).isBefore(dayjs())) {
      ctx.addIssue({
        code: "custom",
        path: ["driver_license_expiration"],
        message: "Driver's license cannot be expired",
      });
    }

    if (data.date_of_birth && dayjs(data.date_of_birth).isAfter(dayjs())) {
      ctx.addIssue({
        code: "custom",
        path: ["date_of_birth"],
        message: "Date of birth must be in the past",
      });
    }
  });

const ADDITIONAL_DRIVER_SCHEMA = z.object({
  full_name: z
    .string()
    .min(1, "Additional driver name is required")
    .max(50, "Maximum of 50 characters allowed"),
  date_of_birth: z.date().max(new Date(), "Date of birth must be in the past"),
  driver_license_number: z
    .string()
    .min(1, "Driver's license number is required")
    .max(50, "Maximum of 50 characters allowed"),
  driver_license_expiration: z.date().min(new Date(), "Driver's license cannot be expired"),
});

const VEHICLE_DAMAGE_WAIVER_SCHEMA = z.object({
  rate_per_day: z.number().min(1, "Rate per day must be a positive number"),
  rate_per_week: z.number().min(1, "Rate per week must be a positive number"),
  damage_liability_limit: z.number().min(1, "Damage liability limit must be a positive number"),
});

const PERSONAL_ACCIDENT_INSURANCE_SCHEMA = z.object({
  rate_per_day: z.number().min(1, "Rate per day must be a positive number"),
});

const RENTAL_RATE_SCHEMA = z.object({
  rate_unit: z.enum(
    RATE_UNIT_OPTIONS.map((option) => option.value),
    `Rate unit must be one of ${RATE_UNIT_OPTIONS.map((option) => option.value).join(", ")}`
  ),
  rate_cost: z.number().min(0.01, "Rate cost must be a positive number"),
  rate_note: z.string().max(25).optional(),
});

const USAGE_RATE_SCHEMA = z.object({
  usage_type: z.enum(
    USAGE_TYPE_OPTIONS.map((option) => option.value),
    `Usage type must be one of ${USAGE_TYPE_OPTIONS.map((option) => option.value).join(", ")}`
  ),
  usage_cost: z.number().min(0.01, "Usage cost must be a positive number"),
  usage_note: z.string().max(25).optional(),
});

export const VEHICLE_SCHEMA = z
  .object({
    stock_number: z
      .string()
      .min(1, "Vehicle stock number is required")
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
    model: z
      .string()
      .min(1, "Vehicle model is required")
      .max(50, "Maximum of 50 characters allowed"),
    color: z
      .string()
      .min(1, "Vehicle color is required")
      .max(50, "Maximum of 50 characters allowed"),
    rental_rates: z
      .array(RENTAL_RATE_SCHEMA)
      .max(MAX_RENTAL_RATES, `Maximum of ${MAX_RENTAL_RATES} rental rates allowed`)
      .optional(),
    usage_rates: z
      .array(USAGE_RATE_SCHEMA)
      .max(MAX_USAGE_RATES, `Maximum of ${MAX_USAGE_RATES} usage rates allowed`)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.rental_rates) {
      const uniqueRates = new Set<string>();
      data.rental_rates.forEach(({ rate_unit }, index) => {
        if (uniqueRates.has(rate_unit)) {
          ctx.addIssue({
            code: "custom",
            path: ["rental_rates", index, "rate_unit"],
            message: "Duplicate rate units are not allowed",
          });
        } else {
          uniqueRates.add(rate_unit);
        }
      });
    }

    if (data.usage_rates) {
      const uniqueRates = new Set<string>();
      data.usage_rates.forEach(({ usage_type }, index) => {
        if (uniqueRates.has(usage_type)) {
          ctx.addIssue({
            code: "custom",
            path: ["usage_rates", index, "usage_type"],
            message: "Duplicate usage types are not allowed",
          });
        } else {
          uniqueRates.add(usage_type);
        }
      });
    }
  });

const RENTAL_AGREEMENT_INFO_SCHEMA = z
  .object({
    odometer_in: z.number().int().min(1, "Odometer reading must be greater than 0"),
    date_in: z.date(),
    odometer_out: z.number().int().min(1, "Odometer reading must be greater than 0"),
    date_out: z.date(),
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
    comments: z.string().max(750, "Maximum of 750 characters allowed").optional(),
    comments_visible: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!dayjs(data.date_in).isAfter(data.date_out)) {
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
    if (data.odometer_in > data.odometer_out + data.max_distance) {
      ctx.addIssue({
        code: "custom",
        path: ["odometer_in"],
        message: "Odometer at return cannot exceed odometer at pickup plus maximum distance",
      });
    }
  });

export const AGREEMENT_TERMS_SCHEMA = z.object({
  version: z.number().int().min(1, "Agreement terms version must be a positive integer"),
  effective_date: z.date(),
  conditions: z
    .object({
      title: z.string().max(50, "Maximum of 50 characters allowed"),
      description: z.string(),
      sub_conditions: z.array(z.string()),
      list_format: z.enum(["numerical", "alphabetical"]).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.sub_conditions.length > 0 && !data.list_format) {
        ctx.addIssue({
          code: "custom",
          path: ["list_format"],
          message: "List format is required when sub-conditions are provided",
        });
      }
    })
    .array(),
});

const AGREEMENT_CHARGE_ITEM = z.object({
  code: z.string().min(1, "Code is required"),
  label: z.string().min(1, "Label is required"),
  category: z.enum(["rental_rates", "usage_charges", "vehicle_protection"]),
  rate: z.number().min(0, "Rate must be a non-negative number"),
  quantity: z.number().min(0, "Quantity must be a non-negative number"),
  total: z.number().min(0, "Total must be a non-negative number"),
  note: z.string().optional(),
});

export const AGREEMENT_CHARGES_SCHEMA = z.object({
  line_items: z.array(AGREEMENT_CHARGE_ITEM),
  sales_tax_rate: z.number().min(0, "Sales tax rate must be a non-negative number"),
  deposit_amount: z.number().min(0, "Deposit amount must be a non-negative number"),
  subtotal: z.number().min(0, "Subtotal must be a non-negative number"),
  sales_tax_amount: z.number().min(0, "Sales tax amount must be a non-negative number"),
  total_due: z.number(),
  source_signature: z.string(),
  calculated_at: z.date().optional(),
});

export const FORM_SCHEMA = z
  .object({
    agreement_number: z
      .string()
      .min(1, "Agreement number is required")
      .max(50, "Maximum of 50 characters allowed"),
    agreement_terms: AGREEMENT_TERMS_SCHEMA,
    customer_uuid: z.uuidv4().optional(),
    vehicle_uuid: z.uuidv4().optional(),
    rentee: RENTEE_SCHEMA,
    additional_drivers: z
      .array(ADDITIONAL_DRIVER_SCHEMA)
      .max(
        MAX_ADDITIONAL_DRIVERS,
        `Maximum of ${MAX_ADDITIONAL_DRIVERS} additional drivers allowed`
      )
      .optional(),
    vehicle_damage_waiver: VEHICLE_DAMAGE_WAIVER_SCHEMA.optional(),
    personal_accident_insurance: PERSONAL_ACCIDENT_INSURANCE_SCHEMA.optional(),
    rental_vehicle: VEHICLE_SCHEMA,
    rental_agreement_info: RENTAL_AGREEMENT_INFO_SCHEMA,
    agreement_charges: AGREEMENT_CHARGES_SCHEMA,
    currency: z.literal("USD"),
    clerk_signature: z.union([z.literal(""), z.string().startsWith("data:image/png")]).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !data.agreement_charges.source_signature ||
      data.agreement_charges.source_signature !== computeBillingSignature(data)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["agreement_charges"],
        message: "Charges must be confirmed before the agreement can be saved.",
      });
    }
  })
  .strict();

export type RenteeSchema = z.infer<typeof RENTEE_SCHEMA>;
export type VehicleSchema = z.infer<typeof VEHICLE_SCHEMA>;
export type FormSchema = z.infer<typeof FORM_SCHEMA>;
export type AgreementTermsSchema = z.infer<typeof AGREEMENT_TERMS_SCHEMA>;
export type AgreementChargeItemSchema = z.infer<typeof AGREEMENT_CHARGE_ITEM>;
export type AgreementChargesSchema = z.infer<typeof AGREEMENT_CHARGES_SCHEMA>;
