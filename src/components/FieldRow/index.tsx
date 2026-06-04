import type { ReactNode } from "react";
import { Stack } from "@mui/material";

export const FieldRow = ({ children }: { children: ReactNode }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
    {children}
  </Stack>
);
