import { FormSchema } from "@/schemas/form";
import { computeBillingSignature } from "@/utils/billing";
import React, { FC, createContext, useContext, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

type BillingStatus = "confirmed" | "pending" | "stale";

export type BillingCtxState = {
  /**
   * Describes the current billing status of the agreement.
   *
   * - `confirmed` - The billing has been confirmed and is up-to-date.
   * - `pending` - The billing is awaiting confirmation or processing.
   * - `stale` - The billing is outdated or no longer valid.
   */
  status: BillingStatus;
  /**
   * A human-readable description of the current billing status.
   */
  description: string;
};

const BillingDescriptions: Record<BillingStatus, string> = {
  confirmed: "",
  pending: "Charges have not been calculated yet.",
  stale:
    "Rate inputs changed since charges were last confirmed. Review and save charges again before generating the agreement.",
};

/**
 * Billing State Context
 *
 * @note Do NOT use this context directly. This is exported for testing purposes only.
 * @see {@link BillingCtxState} – The billing context state
 * @see {@link useBillingState} – The billing context hook
 */
export const BillingStateCtx = createContext<BillingCtxState | null>(null);
BillingStateCtx.displayName = "BillingContext";

/**
 * Billing State Context Hook
 *
 * @see {@link BillingStateProvider} Must be wrapped in the provider component
 * @see {@link BillingCtxState} Context state returned by the hook
 */
export const useBillingState = (): BillingCtxState => {
  const context = useContext<BillingCtxState | null>(BillingStateCtx);

  if (!context) {
    throw new Error("useBillingState cannot be used outside of the BillingStateProvider component");
  }

  return context;
};

/**
 * Props for the BillingStateProvider component
 */
export type BillingStateProviderProps = {
  /**
   * The child components that will have access to the billing context.
   */
  children: React.ReactNode;
};

/**
 * Provides access to the Billing context hook
 *
 * @see {@link useBillingState} The context hook
 * @returns React Context Provider
 */
export const BillingStateProvider: FC<BillingStateProviderProps> = ({
  children,
}: BillingStateProviderProps) => {
  const { control } = useFormContext<FormSchema>();

  const [
    currency,
    rental_rates,
    vehicle_damage_waiver,
    personal_accident_insurance,
    calculatedAt,
    sourceSignature,
  ] = useWatch({
    control,
    name: [
      "currency",
      "rental_vehicle.rental_rates",
      "vehicle_damage_waiver",
      "personal_accident_insurance",
      "agreement_charges.calculated_at",
      "agreement_charges.source_signature",
    ],
  });

  const billingSourceSignature = useMemo<string>(
    () =>
      computeBillingSignature({
        currency,
        rental_vehicle: { rental_rates },
        vehicle_damage_waiver,
        personal_accident_insurance,
      }),
    [currency, rental_rates, vehicle_damage_waiver, personal_accident_insurance]
  );

  const state = useMemo<BillingCtxState>(() => {
    if (!calculatedAt) {
      return { status: "pending", description: BillingDescriptions["pending"] };
    }

    const status = sourceSignature !== billingSourceSignature ? "stale" : "confirmed";
    return { status, description: BillingDescriptions[status] };
  }, [calculatedAt, sourceSignature, billingSourceSignature]);

  return <BillingStateCtx.Provider value={state}>{children}</BillingStateCtx.Provider>;
};
