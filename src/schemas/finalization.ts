import { z } from "zod";

import { FUEL_LEVEL_OPTIONS } from "@/config/constants";

export const FINALIZATION_SCHEMA = z.object({
  vehicle_returned_at: z.date(),
  actual_odometer_in: z.number().int().min(0, "Odometer reading cannot be negative"),
  actual_fuel_level_in: z.enum(
    FUEL_LEVEL_OPTIONS,
    `Fuel level must be one of ${FUEL_LEVEL_OPTIONS.join(", ")}`
  ),
  finalized_at: z.date(),
});

export type FinalizationSchema = z.infer<typeof FINALIZATION_SCHEMA>;
