import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export const Subsection = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>
      {title}
    </Typography>
    {children}
  </Box>
);
