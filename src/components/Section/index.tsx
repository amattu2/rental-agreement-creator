import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <Box mb={4}>
    <Typography variant="h6" mb={1}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      {description}
    </Typography>
    {children}
  </Box>
);
