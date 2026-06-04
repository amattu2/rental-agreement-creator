import type { ReactNode } from "react";
import { Box } from "@mui/material";

export const FieldCell = ({ children }: { children: ReactNode }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
);
