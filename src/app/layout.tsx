import type { Metadata } from "next";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import theme from "@/theme";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import { DatabaseApiProvider } from "@/database/provider";

export const metadata: Metadata = {
  title: `Agreements - ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
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
            <main style={{ minHeight: "calc(100vh - 68.5px - 52.02px)" }}>
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
