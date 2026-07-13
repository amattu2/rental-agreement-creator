import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "",
    lastModified: new Date(),
    changeFrequency: "always",
    priority: 1,
  },
  {
    url: `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL || ""}/customers`,
    lastModified: new Date(),
    changeFrequency: "always",
    priority: 0.9,
  },
  {
    url: `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL || ""}/vehicles`,
    lastModified: new Date(),
    changeFrequency: "always",
    priority: 0.8,
  },
];

export default sitemap;
