import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Settings - ${process.env.NEXT_PUBLIC_APP_NAME}`,
  robots: { index: false, follow: false },
};

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Provides a server rendered layout for the settings page.
 *
 * @param props The layout props containing the children elements.
 * @returns The children elements.
 */
const Layout = ({ children }: Readonly<LayoutProps>) => children;

export default Layout;
