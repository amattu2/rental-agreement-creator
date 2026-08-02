import { DEFAULT_FORM } from "@/config/constants";
import type { FormSchema } from "@/schemas/form";

import { buildAgreementCharges, computeBillingSignature, groupByCategory } from "./billing";

const makeForm = (overrides: Partial<FormSchema> = {}): FormSchema => {
  const form = Object.assign({}, DEFAULT_FORM);

  return {
    ...form,
    ...overrides,
    rental_vehicle: {
      ...form.rental_vehicle,
      ...overrides.rental_vehicle,
    },
    agreement_charges: {
      ...form.agreement_charges,
      ...overrides.agreement_charges,
    },
  };
};

describe("computeBillingSignature", () => {
  it("contains only billing-relevant fields", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [{ rate_cost: 12.5, rate_note: "PER HOUR", rate_unit: "hours" }],
        usage_rates: [{ usage_type: "electricity", usage_cost: 0.3 }],
      },
      vehicle_damage_waiver: { rate_per_day: 10, rate_per_week: 55, damage_liability_limit: 0 },
      personal_accident_insurance: { rate_per_day: 3.5 },
    });

    expect(computeBillingSignature(form)).toBe(
      JSON.stringify({
        currency: "USD",
        rental_rates: [{ rate_cost: 12.5, rate_note: "PER HOUR", rate_unit: "hours" }],
        usage_rates: [{ usage_type: "electricity", usage_cost: 0.3 }],
        vehicle_damage_waiver: { rate_per_day: 10, rate_per_week: 55, damage_liability_limit: 0 },
        personal_accident_insurance: { rate_per_day: 3.5 },
      })
    );
  });
});

describe("buildAgreementCharges", () => {
  it("builds line items and rounds totals for floating-point and decimal tax rates", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [
          { rate_unit: "hours", rate_cost: 0.1, rate_note: "PER HOUR" },
          { rate_unit: "days", rate_cost: 19.995, rate_note: "PER DAY" },
        ],
        usage_rates: [{ usage_type: "gasoline", usage_cost: 3.499, usage_note: "PER GAL" }],
      },
      vehicle_damage_waiver: {
        rate_per_day: 5.555,
        rate_per_week: 20,
        damage_liability_limit: 0,
      },
      personal_accident_insurance: {
        rate_per_day: 2.333,
      },
    });

    const charges = buildAgreementCharges(form, {
      quantitiesByCode: {
        "rental_rate:hours": 3,
        "rental_rate:days": 3,
        "usage_rate:gasoline": 10,
        "vehicle_damage_waiver:day": 2,
        "vehicle_damage_waiver:week": 1,
        "personal_accident_insurance:day": 2,
      },
      salesTaxRate: 8.875,
      depositAmount: 25.5,
    });

    expect(charges.line_items).toHaveLength(6);
    expect(charges.subtotal).toBe(131.06);
    expect(charges.sales_tax_rate).toBe(8.875);
    expect(charges.sales_tax_amount).toBe(11.63);
    expect(charges.deposit_amount).toBe(25.5);
    expect(charges.total_due).toBe(117.19);
  });

  it("uses existing persisted quantities and tax/deposit when overrides are omitted", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [{ rate_unit: "hours", rate_cost: 10, rate_note: "PER HOUR" }],
      },
      agreement_charges: {
        ...DEFAULT_FORM.agreement_charges,
        line_items: [
          {
            code: "rental_rate:hours",
            label: "HOURS",
            category: "rental_rates",
            rate: 10,
            quantity: 4,
            total: 40,
          },
        ],
        sales_tax_rate: 5,
        deposit_amount: 10,
      },
    });

    const charges = buildAgreementCharges(form);

    expect(charges.subtotal).toBe(40);
    expect(charges.sales_tax_rate).toBe(5);
    expect(charges.sales_tax_amount).toBe(2);
    expect(charges.deposit_amount).toBe(10);
    expect(charges.total_due).toBe(32);
  });

  it("coerces invalid quantities, tax, and deposit values to 0", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [{ rate_unit: "hours", rate_cost: 12, rate_note: "PER HOUR" }],
      },
    });

    const charges = buildAgreementCharges(form, {
      quantitiesByCode: { "rental_rate:hours": Number.NaN },
      salesTaxRate: Number.POSITIVE_INFINITY,
      depositAmount: -50,
    });

    expect(charges.subtotal).toBe(0);
    expect(charges.sales_tax_rate).toBe(0);
    expect(charges.sales_tax_amount).toBe(0);
    expect(charges.deposit_amount).toBe(0);
    expect(charges.total_due).toBe(0);
  });

  it("supports legacy form state where agreement_charges is missing", () => {
    const legacyForm = {
      ...makeForm({
        rental_vehicle: {
          ...DEFAULT_FORM.rental_vehicle,
          rental_rates: [{ rate_unit: "hours", rate_cost: 10, rate_note: "PER HOUR" }],
        },
      }),
      agreement_charges: undefined,
    } as unknown as FormSchema;

    const charges = buildAgreementCharges(legacyForm);

    expect(charges.sales_tax_rate).toBe(0);
    expect(charges.deposit_amount).toBe(0);
    expect(charges.subtotal).toBe(0);
  });

  it("allows total_due to go negative when deposit exceeds subtotal", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [{ rate_unit: "days", rate_cost: 10, rate_note: "PER DAY" }],
      },
    });

    const charges = buildAgreementCharges(form, {
      quantitiesByCode: { "rental_rate:days": 1 },
      depositAmount: 25,
    });

    expect(charges.subtotal).toBe(10);
    expect(charges.total_due).toBe(-15);
  });

  it("sets source signature from current billing inputs", () => {
    const form = makeForm({
      rental_vehicle: {
        ...DEFAULT_FORM.rental_vehicle,
        rental_rates: [{ rate_unit: "days", rate_cost: 75, rate_note: "PER DAY" }],
      },
    });

    const charges = buildAgreementCharges(form);
    expect(charges.source_signature).toBe(computeBillingSignature(form));
    expect(charges.calculated_at).toBeInstanceOf(Date);
  });
});

describe("groupByCategory", () => {
  it("returns an empty object for missing input", () => {
    expect(groupByCategory()).toEqual({});
  });

  it("groups charge items by category", () => {
    const grouped = groupByCategory([
      {
        code: "rental_rate:hours",
        label: "HOURS",
        category: "rental_rates",
        rate: 10,
        quantity: 2,
        total: 20,
        note: "PER HOUR",
      },
      {
        code: "usage_rate:electricity:kWh",
        label: "ELECTRICITY",
        category: "usage_charges",
        rate: 0.35,
        quantity: 20,
        total: 7,
        note: "PER KWH",
      },
      {
        code: "vehicle_damage_waiver:day",
        label: "VDW",
        category: "vehicle_protection",
        rate: 5,
        quantity: 1,
        total: 5,
        note: "PER DAY",
      },
    ]);

    expect(Object.keys(grouped)).toEqual(["rental_rates", "usage_charges", "vehicle_protection"]);
    expect(grouped.rental_rates).toHaveLength(1);
    expect(grouped.usage_charges).toHaveLength(1);
    expect(grouped.vehicle_protection).toHaveLength(1);
  });
});
