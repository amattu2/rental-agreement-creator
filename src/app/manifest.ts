import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export const manifest = (): MetadataRoute.Manifest => ({
  name: process.env.NEXT_PUBLIC_APP_NAME || "",
  short_name: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "",
  start_url: process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "",
  display: "standalone",
  background_color: "#fff",
  theme_color: "#fff",
  categories: ["productivity", "utilities", "automotive"],
  lang: "en",
  icons: [],
});

export default manifest;
