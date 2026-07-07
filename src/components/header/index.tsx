"use client";

import { AppBar, Box, Button, styled, Toolbar, Typography } from "@mui/material";
import Link, { LinkProps } from "next/link";
import routes from "@/config/routes";

const StyledTypography = styled(Typography)<{
  component: React.ElementType;
  href: LinkProps["href"];
}>({
  fontWeight: 700,
  color: "inherit",
  textDecoration: "none",
  marginRight: "16px",
});

const StyledButton = styled(Button)<{ component: React.ElementType }>({
  lineHeight: 1,
  textAlign: "center",
});

export const Header = () => (
  <AppBar position="static">
    <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <StyledTypography variant="h6" noWrap component={Link} href="/">
        {process.env.NEXT_PUBLIC_APP_NAME}
      </StyledTypography>
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {routes.map(({ label, href }) => (
          <StyledButton
            key={href}
            component={Link}
            href={href}
            sx={{ my: 2, color: "white", display: "block" }}
          >
            {label}
          </StyledButton>
        ))}
      </Box>
    </Toolbar>
  </AppBar>
);
