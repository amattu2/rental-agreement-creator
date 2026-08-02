import { Box } from "@mui/material";
import type { ReactNode } from "react";

export const FieldCell = ({ children }: { children: ReactNode }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
);
