import { Stack } from "@mui/material";
import type { ReactNode } from "react";

export const FieldRow = ({ children }: { children: ReactNode }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
    {children}
  </Stack>
);
