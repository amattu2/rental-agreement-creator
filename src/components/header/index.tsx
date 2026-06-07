"use client";

import { AppBar, styled, Toolbar, Typography } from "@mui/material";
import Link, { LinkProps } from "next/link";

const StyledTypography = styled(Typography)<{
  component: React.ElementType;
  href: LinkProps["href"];
}>({
  fontWeight: 700,
  color: "inherit",
  textDecoration: "none",
});

export const Header = () => (
  <AppBar position="static">
    <Toolbar>
      <StyledTypography variant="h6" noWrap component={Link} href="/">
        {process.env.NEXT_PUBLIC_APP_NAME}
      </StyledTypography>
    </Toolbar>
  </AppBar>
);
