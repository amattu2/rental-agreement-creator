import z from "zod";

export const ENV_SCHEMA = z.object({
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, "App name is required")
    .max(100, "Maximum of 100 characters allowed"),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .max(500, "Maximum of 500 characters allowed")
    .optional()
    .default(""),
  NEXT_PUBLIC_COMPANY_NAME: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Maximum of 100 characters allowed"),
  NEXT_PUBLIC_ADDRESS_LINE1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(100, "Maximum of 100 characters allowed"),
  NEXT_PUBLIC_ADDRESS_LINE2: z
    .string()
    .max(100, "Maximum of 100 characters allowed")
    .optional()
    .default(""),
  NEXT_PUBLIC_DEPLOYMENT_URL: z
    .union([
      z
        .url()
        .max(1_000, "Maximum of 1000 characters allowed")
        .refine((url) => !url.endsWith("/"), "Deployment URL should not end with a slash"),
      z.literal(""),
    ])
    .optional()
    .default(""),
});

export type EnvSchema = z.infer<typeof ENV_SCHEMA>;
