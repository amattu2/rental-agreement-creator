import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Metadata } from "next";
import { Suspense } from "react";

import Logo from "@/assets/logo.png";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { DatabaseApiProvider } from "@/database/provider";
import theme from "@/theme";

export const metadata: Metadata = {
  title: `Agreements - ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  icons: {
    icon: Logo.src,
  },
};

type RootProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: Readonly<RootProps>) => (
  <html lang="en">
    <body>
      <AppRouterCacheProvider>
        <DatabaseApiProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Header />
            <main style={{ minHeight: "calc(100vh - 64px - 52.02px)" }}>
              <Suspense>{children}</Suspense>
            </main>
            <Suspense>
              <Footer />
            </Suspense>
          </ThemeProvider>
        </DatabaseApiProvider>
      </AppRouterCacheProvider>
    </body>
  </html>
);

export default RootLayout;
