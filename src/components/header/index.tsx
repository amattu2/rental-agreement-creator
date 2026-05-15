"use client";

import { AppBar, styled, Toolbar, Typography } from "@mui/material";

const StyledTypography = styled(Typography)({
  fontWeight: 700,
  color: "inherit",
  textDecoration: "none",
});

export const Header = () => (
  <AppBar position="static">
    <Toolbar>
      <StyledTypography variant="h6" noWrap>
        {process.env.NEXT_PUBLIC_APP_NAME}
      </StyledTypography>
    </Toolbar>
  </AppBar>
);
