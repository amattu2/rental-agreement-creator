import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Customer Management - ${process.env.NEXT_PUBLIC_APP_NAME}`,
};

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Provides a server rendered layout for the customers management page.
 *
 * @param props The layout props containing the children elements.
 * @returns The children elements.
 */
const Layout = ({ children }: Readonly<LayoutProps>) => children;

export default Layout;
