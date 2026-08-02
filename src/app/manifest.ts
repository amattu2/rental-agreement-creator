import type { MetadataRoute } from "next";

import CustomersImage from "@/assets/customers.png";
import HomeImage from "@/assets/home.png";
import Logo from "@/assets/logo.png";
import VehiclesImage from "@/assets/vehicles.png";

export const dynamic = "force-static";

export const manifest = (): MetadataRoute.Manifest => ({
  name: process.env.NEXT_PUBLIC_APP_NAME || "",
  short_name: process.env.NEXT_PUBLIC_APP_NAME || "",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "",
  start_url: process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "",
  display: "standalone",
  background_color: "#fff",
  theme_color: "#fff",
  categories: ["productivity", "utilities", "automotive"],
  lang: "en",
  icons: [
    {
      src: Logo.src,
      sizes: `${Logo.width}x${Logo.height}`,
      type: "image/png",
      purpose: "any",
    },
  ],
  screenshots: [
    {
      src: HomeImage.src,
      sizes: `${HomeImage.width}x${HomeImage.height}`,
      type: "image/png",
      form_factor: "wide",
    },
    {
      src: CustomersImage.src,
      sizes: `${CustomersImage.width}x${CustomersImage.height}`,
      type: "image/png",
      form_factor: "wide",
    },
    {
      src: VehiclesImage.src,
      sizes: `${VehiclesImage.width}x${VehiclesImage.height}`,
      type: "image/png",
      form_factor: "wide",
    },
  ],
});

export default manifest;
