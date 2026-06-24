import type { AgreementChargeItemSchema, AgreementChargesSchema, FormSchema } from "@/schemas/form";

/**
 * Rounds a numeric value to two decimal places for currency calculations.
 *
 * @param value The number to round.
 * @returns The rounded value with two-decimal precision.
 */
const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Coerces an optional quantity-like value to a safe non-negative number.
 *
 * @param value The candidate quantity value.
 * @returns The original value when finite and non-negative, otherwise 0.
 */
const coerceQuantity = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;

type BillingSignatureInput = Pick<
  FormSchema,
  "currency" | "vehicle_damage_waiver" | "personal_accident_insurance"
> & {
  rental_vehicle: Pick<FormSchema["rental_vehicle"], "rental_rates">;
};

/**
 * Builds a stable signature string from billing-related form fields.
 *
 * @param form The subset of form values that affect billing calculations.
 * @returns A JSON string signature used to detect billing input changes.
 */
export const computeBillingSignature = (form: BillingSignatureInput): string =>
  JSON.stringify({
    currency: form.currency,
    rental_rates: form.rental_vehicle.rental_rates ?? [],
    vehicle_damage_waiver: form.vehicle_damage_waiver ?? null,
    personal_accident_insurance: form.personal_accident_insurance ?? null,
  });

/**
 * Creates draft charge line items from the current form configuration.
 *
 * @param form The full form state containing available billing options.
 * @returns Line items initialized with quantity and total set to zero.
 */
const createDraftLineItems = (form: FormSchema): Array<AgreementChargeItemSchema> => {
  const rentalRateItems: Array<AgreementChargeItemSchema> =
    form.rental_vehicle.rental_rates?.map(({ rate_unit, rate_cost, rate_note }) => ({
      code: `rental_rate:${rate_unit}`,
      label: rate_unit.toUpperCase(),
      category: "rental_rates",
      note: rate_note ?? "",
      rate: rate_cost,
      quantity: 0,
      total: 0,
    })) ?? [];

  const vehicleProtectionItems: Array<AgreementChargeItemSchema> = [];
  if (form.vehicle_damage_waiver) {
    vehicleProtectionItems.push({
      code: `vehicle_damage_waiver:day`,
      label: "VDW",
      category: "vehicle_protection",
      note: "PER DAY",
      rate: form.vehicle_damage_waiver.rate_per_day,
      quantity: 0,
      total: 0,
    });
    vehicleProtectionItems.push({
      code: `vehicle_damage_waiver:week`,
      label: "VDW",
      category: "vehicle_protection",
      note: "PER WEEK",
      rate: form.vehicle_damage_waiver.rate_per_week,
      quantity: 0,
      total: 0,
    });
  }

  if (form.personal_accident_insurance) {
    vehicleProtectionItems.push({
      code: `personal_accident_insurance:day`,
      label: "PAI",
      category: "vehicle_protection",
      note: undefined,
      rate: form.personal_accident_insurance.rate_per_day,
      quantity: 0,
      total: 0,
    });
  }

  return [...rentalRateItems, ...vehicleProtectionItems];
};

type BillingInputOverrides = {
  quantitiesByCode?: Record<string, number | undefined>;
  salesTaxRate?: number;
  depositAmount?: number;
};

/**
 * Builds the agreement charges object using form values and optional overrides.
 *
 * @param form The form data used to derive charge line items and totals.
 * @param overrides Optional quantity, tax rate, and deposit overrides.
 * @returns A complete calculated agreement charges snapshot.
 */
export const buildAgreementCharges = (
  form: FormSchema,
  overrides: BillingInputOverrides = {}
): AgreementChargesSchema => {
  const draftLineItems = createDraftLineItems(form);
  const currentQuantities = Object.fromEntries(
    form.agreement_charges?.line_items.map((lineItem) => [lineItem.code, lineItem.quantity]) ?? []
  );
  const quantitiesByCode = {
    ...currentQuantities,
    ...overrides.quantitiesByCode,
  };

  const line_items = draftLineItems.map((lineItem) => {
    const quantity = coerceQuantity(quantitiesByCode[lineItem.code]);

    return {
      ...lineItem,
      quantity,
      total: roundCurrency(lineItem.rate * quantity),
    };
  });

  const subtotal = roundCurrency(line_items.reduce((sum, item) => sum + item.total, 0));
  const sales_tax_rate = coerceQuantity(
    overrides.salesTaxRate ?? form.agreement_charges.sales_tax_rate
  );
  const deposit_amount = coerceQuantity(
    overrides.depositAmount ?? form.agreement_charges.deposit_amount
  );
  const sales_tax_amount = roundCurrency(subtotal * (sales_tax_rate / 100));
  const total_due = roundCurrency(subtotal + sales_tax_amount - deposit_amount);

  return {
    line_items,
    sales_tax_rate,
    deposit_amount,
    subtotal,
    sales_tax_amount,
    total_due,
    source_signature: computeBillingSignature(form),
    calculated_at: new Date(),
  };
};

/**
 * A billing utility function that groups agreement charge items by their category.
 *
 * @param items The array of agreement charge items to be grouped.
 * @returns An object mapping category names to arrays of agreement charge items belonging to those categories.
 */
export const groupByCategory = (
  items?: Array<AgreementChargeItemSchema>
): Record<string, Array<AgreementChargeItemSchema>> => {
  if (!items || !Array.isArray(items)) {
    return {};
  }

  return items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, Array<AgreementChargeItemSchema>>
  );
};
